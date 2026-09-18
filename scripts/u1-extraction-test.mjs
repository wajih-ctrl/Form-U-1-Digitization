import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {prepareFile,extract,pagePath,savePage,technicalValue} from '../lib/u1/engine.mjs';
import {templateFields} from '../lib/u1/template.mjs';
const mapped=Object.fromEntries(templateFields().map(field=>[field.id,field]));
for(const [id,ocr,expected] of [
  ['inner.1.circEfficiency','8S','85'],
  ['innerHead.1.knuckle','3.0','3.0'],
  ['innerFlange.1.boltMaterial','SA193-88M','SA193-B8M'],
  ['innerHeadFlange.1.boltMaterial','SA193-B8N','SA193-B8M'],
  ['tube.1.material','SA214L','SA214'],
  ['nozzle.1.size','2.5*','2.5"'],
  ['nozzle.1.reinforcement','Pao','PAD'],
  ['nozzle.2.attachmentDetails','c) ull pen','(c) Full pen'],
  ['inner.1.circExam','ull pen','Full pen'],
  ['design.impact','No, UG-20(f) Exempt CE','No, UG-20(f) Exempt'],
])assert.equal(technicalValue(ocr,mapped[id]).value,expected,`${id}: OCR repair should preserve the field meaning`);
// Independent OCR regression: synthesize different printed values in the
// reference layout, then read the pixels with the real extraction engine.
await mkdir('tmp/u1-tests',{recursive:true});
const pages=await prepareFile(await readFile('public/reference-u1.pdf'),'Reference U-1');
const changes={
  manufacturer:'ATLAS VESSELS LTD, 18 DOCK ROAD',purchaser:'NORTH ENERGY INC, 44 RIVER ROAD',
  serial:'HX-8842',nationalBoard:'98216',year:'2024',drawing:'DWG-771',installation:'PORT TERMINAL',
  'shell.length':`31' 4.5"`,'shell.1.diameter':'48.0 IN','shell.1.material':'SA516-60','shell.1.thickness':'0.750','shell.1.longExam':'Spot RT','shell.1.circExam':'Full RT','shell.1.heatTemp':'1125 F','shell.1.heatTime':'1.5 HR',
  'bodyFlange.1.boltMaterial':'SA193-B7','bodyFlange.1.washerMaterial':'SA516-70','design.mawp':'225 psi','design.mdmt':'-35 F','design.test':'Hydro at 293 PSI',
  'tube.1.number':'480','tube.1.material':'SA214','innerDesign.mawp':'300 psi','inner.length':`2' 8.5"`,
  'inner.1.circType':'1','inner.1.circEfficiency':'85','innerFlange.1.boltMaterial':'SA193-B8M','innerHead.1.knuckle':'3.0','innerHeadFlange.1.boltMaterial':'SA193-B8M',
  'nozzle.1.material':'SA312','nozzle.1.size':'12','nozzle.1.number':'4','nozzle.1.reinforcement':'Pad','nozzle.2.attachmentDetails':'(c) Full pen','nozzle.3.thickness':'0.500','nozzle.4.size':'2.5"','remarks.1.text':'First nozzle remark',
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
const expected={...changes,'design.mdmt':'-35 °F','shell.1.heatTemp':'1125 °F',manufacturer:'ATLAS VESSELS LTD',manufacturerAddress:'18 DOCK ROAD',purchaser:'NORTH ENERGY INC',purchaserAddress:'44 RIVER ROAD'};
const failures=[];
for(const [id,value]of Object.entries(expected)){
  const field=result.fields.find(f=>f.id===id);
  try{assert.equal(normalize(field?.value??''),normalize(value),`${id}: expected ${value}, got ${field?.value}`)}catch(e){failures.push(e.message)}
}
console.log(JSON.stringify({checked:Object.keys(expected).length,failures},null,2));
assert.ok(!result.fields.some(f=>/\.bolt(?:Quantity|Size)$|\.flangeAttachment$/.test(f.id)),'Obsolete split bolting and attachment fields must be absent.');
assert.ok(!/\bCE\b/.test(result.fields.find(f=>f.id==='design.impact')?.value??''),'Impact test output must not include CE.');
assert.equal(failures.length,0,'Changed-document extraction must read the replacement values.');
