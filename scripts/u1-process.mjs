import {extract,getRecord,saveRecord} from '../lib/u1/engine.mjs';
const emit = event => process.stdout.write(JSON.stringify(event)+'\n');
try {
  const record=await getRecord(process.argv[2]);
  const {fields}=await extract(record.pages,emit);
  record.fields=fields; record.status='Review Required'; record.updated=new Date().toISOString();
  record.history.push({id:crypto.randomUUID(),field:'Document',before:'Captured',after:'Review Required',reviewer:'Local OCR',at:record.updated,status:'Extracted'});
  await saveRecord(record);
  emit({stage:'complete',message:'Ready for engineering review',record});
} catch(error) { emit({stage:'error',message:error.message}); process.exitCode=1; }
