import {mkdir,readFile,writeFile,rename,readdir} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import * as blob from '@vercel/blob';

export const dataDir=process.env.U1_DATA_DIR||path.join(process.cwd(),'.u1-data');
export function safeId(id){if(typeof id!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(id))throw new Error('Invalid document identifier');return id;}
export const pagePath=id=>path.join(dataDir,'pages',`${safeId(id)}.png`);
export const recordPath=id=>path.join(dataDir,'records',`${safeId(id)}.json`);

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
    const result=await client.get(key(kind,id),{...options(),access:'private',useCache:false});
    if(!result||result.statusCode!==200||!result.stream)throw new Error(`${kind==='pages'?'Page':'Record'} not found`);
    return {bytes:Buffer.from(await new Response(result.stream).arrayBuffer()),etag:result.blob.etag};
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
  const getRecord=async id=>{const {bytes,etag}=await read('records',id);const record=JSON.parse(bytes.toString('utf8'));Object.defineProperty(record,revision,{value:etag,writable:true});return record;};
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
