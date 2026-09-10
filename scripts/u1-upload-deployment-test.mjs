import assert from 'node:assert/strict';
import {readFile,stat,lstat} from 'node:fs/promises';
import path from 'node:path';

// Check the deployment manifest, not just the full development node_modules.
const manifest=path.resolve('.next/server/app/api/u1/upload/route.js.nft.json');
const {files}=JSON.parse(await readFile(manifest,'utf8'));
async function assertDeployable(manifestPath,entries){
  const absoluteFiles=entries.map(file=>path.resolve(path.dirname(manifestPath),file));
  const links=[];
  for(const file of absoluteFiles)if((await lstat(file)).isSymbolicLink())links.push(file);
  for(const file of absoluteFiles)for(const link of links){
    assert.ok(!file.startsWith(link+path.sep),`Invalid deployment entry beneath symlink: ${path.relative(process.cwd(),file)}`);
  }
}
await assertDeployable(manifest,files);
for(const suffix of ['/pdfjs-dist/legacy/build/pdf.worker.mjs','/pdfjs-dist/wasm/jbig2.wasm']) {
  const asset=files.find(file=>file.replaceAll('\\','/').endsWith(suffix));
  assert.ok(asset,`Upload deployment is missing ${suffix}`);
  assert.ok((await stat(path.resolve(path.dirname(manifest),asset))).size>0);
}
const processManifest=path.resolve('.next/server/app/api/u1/process/route.js.nft.json');
const processFiles=JSON.parse(await readFile(processManifest,'utf8')).files;
await assertDeployable(processManifest,processFiles);
for(const suffix of ['/lib/u1/ocr/eng.traineddata.gz','/tesseract.js/src/worker-script/node/index.js']){
  assert.ok(processFiles.some(file=>file.replaceAll('\\','/').endsWith(suffix)),`OCR deployment is missing ${suffix}`);
}
assert.ok(processFiles.some(file=>file.includes('canvas')&&file.endsWith('.node')),'OCR native canvas binding is missing');
assert.ok(processFiles.some(file=>file.includes('sharp')&&file.endsWith('.node')),'OCR native sharp binding is missing');
assert.ok(processFiles.some(file=>file.replaceAll('\\','/').includes('/@vercel/blob/')),'OCR Blob SDK is missing');
for(const file of [...files,...processFiles])assert.ok(!/[\\/]\.u1-data[\\/]|[\\/]tmp[\\/]/.test(file),'Local user/test data must not be packaged');
const base=process.env.QA_BASE_URL||'http://localhost:3001';
const body=new FormData();
body.append('files',new Blob([await readFile('public/reference-u1.pdf')],{type:'application/pdf'}),'Reference Form U-1.pdf');
const response=await fetch(`${base}/api/u1/upload`,{method:'POST',body});
const result=await response.json();
assert.equal(response.status,200,JSON.stringify(result));
assert.equal(result.pages.length,3);
for(const page of result.pages){
  const image=await fetch(new URL(page.url,base));
  assert.equal(image.status,200);
  const bytes=new Uint8Array(await image.arrayBuffer());
  assert.deepEqual([...bytes.slice(0,8)],[137,80,78,71,13,10,26,10]);
  assert.ok(bytes.length>10000,'Rendered page is unexpectedly small');
}
console.log('PASS: upload and OCR functions are deployable; PDF, OCR, canvas, sharp, and Blob assets are packaged; production upload rendered all three reference pages.');
