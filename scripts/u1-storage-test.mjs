import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {BlobPreconditionFailedError} from '@vercel/blob';
import {createStorage} from '../lib/u1/storage.mjs';

function remoteClient(){
  const objects=new Map();let revision=0;
  return {
    async put(key,body,options){
      assert.equal(options.access,'private');assert.equal(options.addRandomSuffix,false);
      if(options.ifMatch&&objects.get(key)?.etag!==options.ifMatch)throw new BlobPreconditionFailedError();
      if(objects.has(key)&&!options.allowOverwrite)throw new Error('Already exists');
      const etag=String(++revision);objects.set(key,{bytes:Buffer.from(body),etag});return {etag};
    },
    async get(key,options){
      assert.equal(options.access,'private');assert.equal(options.useCache,false);
      const object=objects.get(key);return object?{statusCode:200,stream:new Response(object.bytes).body,blob:{etag:`download-${object.etag}`}}:null;
    },
    async head(key){
      const object=objects.get(key);if(!object)throw new Error('Not found');return {etag:object.etag};
    },
    async list({prefix,cursor}){
      const keys=[...objects.keys()].filter(k=>k.startsWith(prefix)).sort();const i=Number(cursor||0);
      return {blobs:keys.slice(i,i+1).map(pathname=>({pathname})),hasMore:i+1<keys.length,cursor:String(i+1)};
    },
  };
}
const record=id=>({id,updated:'2026-09-09T00:00:00Z',status:'Captured',fields:[],pages:[],history:[]});
test('independent serverless instances share private pages and records, paginate, and read latest revisions',async()=>{
  const client=remoteClient(),env={VERCEL:'1',BLOB_READ_WRITE_TOKEN:'test-only'};
  const a=createStorage({env,client,root:'/var/task/not-writable'}),b=createStorage({env,client,root:'/different-instance'});
  await a.putPage('page-one',Buffer.from('page pixels'));
  assert.equal((await b.getPage('page-one')).toString(),'page pixels');
  await a.saveRecord(record('U1-ONE'));await a.saveRecord(record('U1-TWO'));
  const revised=await b.getRecord('U1-ONE');revised.status='In Review';await b.saveRecord(revised);
  assert.equal((await a.getRecord('U1-ONE')).status,'In Review');
  assert.equal((await b.listRecords()).length,2);
  await assert.rejects(b.getPage('../escape'),/Invalid document/);
});
test('concurrent stale record updates cannot overwrite a newer review',async()=>{
  const client=remoteClient(),env={VERCEL:'1',BLOB_READ_WRITE_TOKEN:'test-only'};
  const a=createStorage({env,client}),b=createStorage({env,client});await a.saveRecord(record('U1-ONE'));
  const first=await a.getRecord('U1-ONE'),stale=await b.getRecord('U1-ONE');
  first.status='Approved';await a.saveRecord(first);stale.status='In Review';
  await assert.rejects(b.saveRecord(stale),/changed in another request/);
  assert.equal((await b.getRecord('U1-ONE')).status,'Approved');
});
test('unconfigured Vercel fails clearly instead of writing into its deployment or temporary filesystem',async()=>{
  const store=createStorage({env:{VERCEL:'1'}});
  await assert.rejects(store.putPage('one',Buffer.from('pixels')),/Connect a private Vercel Blob store/);
  await assert.rejects(store.listRecords(),/Production storage is not configured/);
});
test('current Vercel OIDC Blob connection is recognized without a long-lived token',async()=>{
  const client=remoteClient(),env={VERCEL:'1',BLOB_STORE_ID:'store_example',VERCEL_OIDC_TOKEN:'short-lived-test-token'};
  const store=createStorage({env,client,root:'/var/task/not-writable'});
  await store.putPage('oidc-page',Buffer.from('oidc pixels'));
  assert.equal((await store.getPage('oidc-page')).toString(),'oidc pixels');
  await store.saveRecord(record('U1-OIDC'));
  assert.equal((await store.getRecord('U1-OIDC')).id,'U1-OIDC');
});
test('local storage stays persistent across fresh instances',async()=>{
  const root=await mkdtemp(path.join(tmpdir(),'u1-storage-test-'));
  try{
    const a=createStorage({env:{},root});await a.saveRecord(record('U1-LOCAL'));await a.putPage('one',Buffer.from('pixels'));
    const b=createStorage({env:{},root});assert.equal((await b.getRecord('U1-LOCAL')).status,'Captured');
    assert.equal((await b.getPage('one')).toString(),'pixels');assert.equal((await b.listRecords()).length,1);
  }finally{await rm(root,{recursive:true,force:true});}
});
