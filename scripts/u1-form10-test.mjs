import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {prepareFile,extract} from '../lib/u1/engine.mjs';

const pages=await prepareFile(await readFile('public/U_Form 10.pdf'),'U_Form 10.pdf');
const {fields}=await extract(pages);
const byId=new Map(fields.map(field=>[field.id,field]));
const expected={
  manufacturer:'NORTHSTAR PROCESS EQUIPMENT',purchaser:'BLUE RIDGE ENERGY SYSTEMS',serial:'V-26-0417',year:'2026',asme:'ASME Code, Section VIII, Div. 1',
  'shell.length':`32'7.5"`,'shell.1.material':'SA387-11 CL2','shell.1.circEfficiency':'85','shell.2.diameter':'52.0" x 32.00"',
  'bodyFlange.1.number':'2','bodyFlange.1.boltMaterial':'SA193-B8M','bodyFlange.1.washerMaterial':'SS316',
  'headFlange.1.type':'SO','headFlange.1.material':'SA350 LF3','headFlange.1.washerMaterial':'SS316',
  'jacket.details':'3/8" x 2" continuous closure bar','notes':'Channel, tubesheet and nozzle schedule attached as Appendix A.',
  'design.impact':'Yes, UCS-66','design.test':'Hydro at 163 PSI',
  'tube.1.material':'SA179','tube.1.od':'0.875','tube.1.number':'420',
  'inner.length':`2'4.0"`,'inner.1.length':`2'4.0"`,'inner.1.circType':'2','inner.1.circEfficiency':'85',
  'innerFlange.1.boltMaterial':'SA193-B8M','innerFlange.1.washerMaterial':'SS316',
  'innerHead.1.knuckle':'3.0','innerHead.1.efficiency':'85','innerHeadFlange.1.type':'SO','innerHeadFlange.1.bolting':'40 - 1"-8UNC','innerHeadFlange.1.boltMaterial':'SA193-B8M','innerHeadFlange.1.washerMaterial':'SS316',
  'nozzle.1.size':'12','nozzle.1.reinforcement':'Pad','nozzle.1.attachmentDetails':'(d) Full Pen',
  'nozzle.2.size':'16','nozzle.2.reinforcement':'Pad','nozzle.2.attachmentDetails':'(d) Full Pen',
  'nozzle.3.size':'6','nozzle.3.reinforcement':'Integral','nozzle.3.attachmentDetails':'(d) Full Pen',
  'nozzle.4.size':'3','nozzle.4.reinforcement':'Pad','nozzle.4.attachmentDetails':'(d) Full Pen',
  'nozzle.5.purpose':'PT/LT','nozzle.5.size':'1','nozzle.5.reinforcement':'None','nozzle.5.attachmentDetails':'(e) Threaded',
  'remarks.1.text':'Item #19: Nozzle reinforcement per Fig. UG-37.1.',
  'remarks.2.text':'PWHT performed per UCS-56.',
  'remarks.3.text':'Corrosion allowance applies to pressure-retaining parts.',
  'cert.shopCertificate':'U-41782','cert.shopDate':'09/14/2026','cert.fieldExceptions':'',
};
for(const [id,value] of Object.entries(expected))assert.equal(byId.get(id)?.value,value,id);
assert.ok(!fields.some(field=>/bolting quality|bolting size/i.test(field.label)||/\.bolt(?:Quantity|Quality|Size)$/.test(field.id)));
assert.ok(!/\bCE\b/.test(byId.get('design.impact')?.value??''));
assert.ok(!fields.some(field=>field.value.includes('*')),'No inch marks should appear as asterisks in this PDF.');
console.log(`U_Form 10.pdf: ${Object.keys(expected).length} source values and schema checks passed.`);
