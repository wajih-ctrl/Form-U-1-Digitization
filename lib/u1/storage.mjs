import {mkdir,readFile,writeFile,rename,readdir} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import * as blob from '@vercel/blob';

export const dataDir=process.env.U1_DATA_DIR||path.join(process.cwd(),'.u1-data');
export function safeId(id){if(typeof id!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(id))throw new Error('Invalid document identifier');return id;}
export const pagePath=id=>path.join(dataDir,'pages',`${safeId(id)}.png`);
export const recordPath=id=>path.join(dataDir,'records',`${safeId(id)}.json`);

function currentLayout(record){
  if(!Array.isArray(record.fields))return record;
  // Records created before the combined-cell mapping retain their reviewed
  // values while the obsolete duplicate bolting columns disappear everywhere.
  const fields=record.fields.filter(field=>!/(?:\.boltQuantity|\.boltQuality|\.boltSize)$/.test(field.id)&&!/^Bolting (?:Quality|Size)$/i.test(field.label??''));
  for(const field of fields.filter(field=>/^nozzle\.\d+\.attachment$/.test(field.id))){
    const prefix=field.id.slice(0,-'.attachment'.length),flange=fields.find(other=>other.id===`${prefix}.flangeAttachment`);
    if(!flange||fields.some(other=>other.id===`${prefix}.attachmentDetails`))continue;
    const join=(a,b)=>[a,b].filter(Boolean).join(' ').trim();
    const value=join(field.value,flange.value),original=join(field.original,flange.original);
    fields.push({...field,id:`${prefix}.attachmentDetails`,label:'Nozzle / flange attachment details',box:[field.box[0],field.box[1],flange.box[0]+flange.box[2]-field.box[0],field.box[3]],value,original,confidence:Math.min(field.confidence,flange.confidence),status:field.status==='Corrected'||flange.status==='Corrected'?'Corrected':field.status==='N/A'&&flange.status==='N/A'?'N/A':field.status==='Verified'&&flange.status==='Verified'?'Verified':field.status==='High Confidence'&&flange.status==='High Confidence'?'High Confidence':'Review Required',lowConfidenceReason:field.lowConfidenceReason||flange.lowConfidenceReason||''});
    if(record.fieldPolicies){const previous=[record.fieldPolicies[field.id],record.fieldPolicies[flange.id]].filter(Boolean);if(previous.length)record.fieldPolicies[`${prefix}.attachmentDetails`]=previous.includes('required')?'required':previous.includes('optional')?'optional':'ignored'}
  }
  record.fields=fields.filter(field=>!/^nozzle\.\d+\.(?:attachment|flangeAttachment)$/.test(field.id));
  if(record.fieldPolicies){for(const id of Object.keys(record.fieldPolicies))if(/(?:\.boltQuantity|\.boltQuality|\.boltSize|\.flangeAttachment|nozzle\.\d+\.attachment)$/.test(id))delete record.fieldPolicies[id]}
  return record;
}

// A factory allows independent function instances to share durable storage
// without sharing a filesystem or an in-memory cache.
export function createStorage({env=process.env,client=blob,root=dataDir}={}){
  const revision=Symbol('stored revision');
  function remote(){
    if(env.BLOB_READ_WRITE_TOKEN||env.BLOB_STORE_ID)return true;
    if(env.VERCEL)throw new Error('Production storage is not configured. Connect a private Vercel Blob store to this project and redeploy.');
    return false;
  }
  const prefix=env.U1_STORAGE_PREFIX||'u1';
  if(!/^[a-zA-Z0-9_-]+$/.test(prefix))throw new Error('Invalid storage prefix');
  const key=(kind,id)=>`${prefix}/${kind}/${safeId(id)}.${kind==='pages'?'png':'json'}`;
  // New Vercel Blob connections use short-lived OIDC credentials. During a
  // Function request the SDK reads that token from the request context.
  const options=()=>env.BLOB_READ_WRITE_TOKEN
    ? {token:env.BLOB_READ_WRITE_TOKEN}
    : {...(env.BLOB_STORE_ID?{storeId:env.BLOB_STORE_ID}:{}),...(env.VERCEL_OIDC_TOKEN?{oidcToken:env.VERCEL_OIDC_TOKEN}:{})};
  async function read(kind,id){
    if(!remote())return {bytes:await readFile(/* turbopackIgnore: true */ path.join(/* turbopackIgnore: true */ root,kind,`${safeId(id)}.${kind==='pages'?'png':'json'}`))};
    const pathname=key(kind,id);
    // Use head() for the revision used by conditional writes. A private
    // download can carry a delivery ETag that the Blob write API rejects.
    const metadata=kind==='records'?await client.head(pathname,options()):undefined;
    const result=await client.get(pathname,{...options(),access:'private',useCache:false});
    if(!result||result.statusCode!==200||!result.stream)throw new Error(`${kind==='pages'?'Page':'Record'} not found`);
    return {bytes:Buffer.from(await new Response(result.stream).arrayBuffer()),etag:metadata?.etag};
  }
  async function write(kind,id,bytes,etag){
    if(remote()){
      try {
        const result=await client.put(key(kind,id),bytes,{...options(),access:'private',addRandomSuffix:false,allowOverwrite:!!etag,...(etag?{ifMatch:etag}:{}),contentType:kind==='pages'?'image/png':'application/json',cacheControlMaxAge:60});
        return result.etag;
      }catch(error){
        if(error instanceof blob.BlobPreconditionFailedError)throw new Error('This record changed in another request. Refresh the record before saving again.');
        throw error;
      }
    }
    const dir=path.join(/* turbopackIgnore: true */ root,kind);await mkdir(dir,{recursive:true});
    const dest=path.join(/* turbopackIgnore: true */ dir,`${safeId(id)}.${kind==='pages'?'png':'json'}`),temp=`${dest}.${randomUUID()}.tmp`;
    await writeFile(temp,bytes);await rename(/* turbopackIgnore: true */ temp,dest);
  }
  const getRecord=async id=>{const {bytes,etag}=await read('records',id);const record=currentLayout(JSON.parse(bytes.toString('utf8')));Object.defineProperty(record,revision,{value:etag,writable:true});return record;};
  return {
    assertConfigured:remote,
    getPage:async id=>(await read('pages',id)).bytes,
    putPage:(id,bytes)=>write('pages',id,bytes),
    getRecord,
    async saveRecord(record){const etag=await write('records',record.id,JSON.stringify(record),record[revision]);if(etag)Object.defineProperty(record,revision,{value:etag,writable:true});},
    async listRecords(){
      let ids=[];
      if(remote()){
        let cursor;
        do{
          const result=await client.list({...options(),prefix:`${prefix}/records/`,limit:1000,cursor});
          ids.push(...result.blobs.filter(b=>b.pathname.endsWith('.json')).map(b=>path.posix.basename(b.pathname,'.json')));
          cursor=result.hasMore?result.cursor:undefined;
        }while(cursor);
      }else{
        const files=await readdir(path.join(/* turbopackIgnore: true */ root,'records')).catch(e=>{if(e.code==='ENOENT')return [];throw e;});
        ids=files.filter(f=>f.endsWith('.json')).map(f=>f.slice(0,-5));
      }
      const records=[];
      // Bound requests when the prototype contains many records.
      for(let i=0;i<ids.length;i+=10)records.push(...await Promise.all(ids.slice(i,i+10).map(getRecord)));
      return records.sort((a,b)=>b.updated.localeCompare(a.updated));
    },
  };
}
export const storage=createStorage();
export const getPage=id=>storage.getPage(id);
export const getRecord=id=>storage.getRecord(id);
export const saveRecord=record=>storage.saveRecord(record);
export const listRecords=()=>storage.listRecords();
