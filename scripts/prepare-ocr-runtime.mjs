import {cp,mkdir,readFile,rm} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';

const root=process.cwd();
const destination=path.join(root,'lib','u1','ocr','runtime','node_modules');
const projectRequire=createRequire(path.join(root,'package.json'));
const tesseractPackage=projectRequire.resolve('tesseract.js/package.json');
const tesseractRequire=createRequire(tesseractPackage);
const nodeFetchPackage=tesseractRequire.resolve('node-fetch/package.json');
const nodeFetchRequire=createRequire(nodeFetchPackage);
const whatwgPackage=nodeFetchRequire.resolve('whatwg-url/package.json');
const whatwgRequire=createRequire(whatwgPackage);

const sources=new Map([
  ['tesseract.js',path.dirname(tesseractPackage)],
  ...['bmp-js','is-url','regenerator-runtime','tesseract.js-core','wasm-feature-detect','node-fetch','zlibjs']
    .map(name=>[name,path.dirname(tesseractRequire.resolve(`${name}/package.json`))]),
  ['whatwg-url',path.dirname(whatwgPackage)],
  ...['tr46','webidl-conversions'].map(name=>[name,path.dirname(whatwgRequire.resolve(`${name}/package.json`))]),
]);

await rm(path.dirname(destination),{recursive:true,force:true});
await mkdir(destination,{recursive:true});
for(const [name,source] of sources)await cp(source,path.join(destination,name),{recursive:true,dereference:true});

// Fail the build early if an install changes the worker entry point.
const worker=path.join(destination,'tesseract.js','src','worker-script','node','index.js');
await readFile(worker);
console.log(`Prepared self-contained OCR worker runtime (${sources.size} packages).`);
