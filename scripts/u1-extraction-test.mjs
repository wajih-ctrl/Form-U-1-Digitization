import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {prepareFile,extract,pagePath,savePage} from '../lib/u1/engine.mjs';
import {templateFields} from '../lib/u1/template.mjs';
// Independent OCR regression: synthesize different printed values in the
// reference layout, then read the pixels with the real extraction engine.
await mkdir('tmp/u1-tests',{recursive:true});
const pages=await prepareFile(await readFile('public/reference-u1.pdf'),'Reference U-1');
const changes={
  manufacturer:'ATLAS VESSELS LTD, 18 DOCK ROAD',purchaser:'NORTH ENERGY INC, 44 RIVER ROAD',
  serial:'HX-8842',nationalBoard:'98216',year:'2024',drawing:'DWG-771',installation:'PORT TERMINAL',
  'shell.1.diameter':'48.0 IN','shell.1.material':'SA516-60','shell.1.thickness':'0.750',
  'design.mawp':'225 psi','design.mdmt':'-35 F','design.test':'Hydro at 293 PSI',
  'tube.1.number':'480','tube.1.material':'SA179','innerDesign.mawp':'300 psi',
  'nozzle.1.material':'SA312','nozzle.1.size':'12','nozzle.1.number':'4','nozzle.3.thickness':'0.500',
  'cert.manufacturer':'ATLAS VESSELS LTD','cert.shopDate':'06/14/2024','cert.inspector':'JAMES CARTER','cert.commission':'NB 88219',
};
const altered=[];
for(let i=0;i<3;i++){
  const image=await loadImage(await readFile(pagePath(pages[i].id))),canvas=createCanvas(image.width,image.height),ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
  for(const [id,value]of Object.entries(changes)){
    const f=templateFields().find(f=>f.id===id);if(f.page!==i+1)continue;
    const [x,y,w,h]=f.box.map((n,index)=>n*(index%2?image.height:image.width));
    ctx.fillStyle='white';ctx.fillRect(x,y,w,h);ctx.fillStyle='black';ctx.font=`${Math.min(22,h*.65)}px Arial`;ctx.textBaseline='middle';ctx.fillText(value,x+4,y+h/2,w-8);
  }
  const png=await canvas.encode('png');await writeFile(`tmp/u1-tests/changed-${i+1}.png`,png);altered.push(await savePage(png,`Changed values page ${i+1}`));
}
const result=await extract(altered,event=>console.log(event.message));
await writeFile('tmp/u1-tests/changed-result.json',JSON.stringify(result,null,2));
const normalize=v=>v.replace(/\s/g,'').toUpperCase();
const expected={...changes,manufacturer:'ATLAS VESSELS LTD',manufacturerAddress:'18 DOCK ROAD',purchaser:'NORTH ENERGY INC',purchaserAddress:'44 RIVER ROAD'};
const failures=[];
for(const [id,value]of Object.entries(expected)){
  const field=result.fields.find(f=>f.id===id);
  try{assert.equal(normalize(field?.value??''),normalize(value),`${id}: expected ${value}, got ${field?.value}`)}catch(e){failures.push(e.message)}
}
console.log(JSON.stringify({checked:Object.keys(expected).length,failures},null,2));
assert.equal(failures.length,0,'Changed-document extraction must read the replacement values.');
