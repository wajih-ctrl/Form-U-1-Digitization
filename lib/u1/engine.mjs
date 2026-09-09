import { createRequire } from 'node:module';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { createCanvas, DOMMatrix, ImageData, Path2D } from '@napi-rs/canvas';
import { createWorker, PSM } from 'tesseract.js';
import { templateFields } from './template.mjs';

const require = createRequire(import.meta.url);
import {storage,getPage} from './storage.mjs';
export {dataDir,safeId,pagePath,recordPath,getRecord,saveRecord} from './storage.mjs';
export async function savePage(buffer, name) {
  storage.assertConfigured();
  const id=randomUUID();
  const result=await sharp(buffer,{limitInputPixels:45000000}).rotate().flatten({background:'#fff'}).resize({width:1844,height:2374,fit:'inside',withoutEnlargement:false}).png().toBuffer({resolveWithObject:true});
  await storage.putPage(id,result.data);
  return {id,name,url:`/api/u1/pages/${id}`,width:result.info.width,height:result.info.height};
}
export async function prepareFile(buffer,name) {
  storage.assertConfigured();
  if(buffer.subarray(0,5).toString()==='%PDF-') {
    Object.assign(globalThis,{DOMMatrix,ImageData,Path2D});
    // PDF.js otherwise imports its worker through a runtime-computed path,
    // which deployment file tracing cannot discover. Register the same-version
    // worker explicitly before PDFWorker initializes its cached fallback.
    const {WorkerMessageHandler}=await import('pdfjs-dist/legacy/build/pdf.worker.mjs');
    Object.assign(globalThis,{pdfjsWorker:{WorkerMessageHandler}});
    const {getDocument}=await import('pdfjs-dist/legacy/build/pdf.mjs');
    // Resolve from the installed package directory: Turbopack rewrites a
    // statically analyzable require.resolve into an external module ID.
    const loading=getDocument({data:new Uint8Array(buffer),useSystemFonts:true,isEvalSupported:false,wasmUrl:path.join(process.cwd(),'node_modules','pdfjs-dist','wasm').replaceAll('\\','/')+'/'});
    const pdf=await loading.promise;
    try {
      if(pdf.numPages>3) throw new Error('This workflow supports exactly three pages. Upload the three-page U-1 form.');
      const result=[];
      for(let i=1;i<=pdf.numPages;i++) {
        const page=await pdf.getPage(i), viewport=page.getViewport({scale:1844/page.getViewport({scale:1}).width});
        const canvas=createCanvas(Math.ceil(viewport.width),Math.ceil(viewport.height));
        await page.render({canvasContext:canvas.getContext('2d'),viewport,canvas}).promise;
        result.push(await savePage(await canvas.encode('png'),`${name} · page ${i}`));
      }
      return result;
    } finally {await loading.destroy();}
  }
  return [await savePage(buffer,name)];
}

async function cellImage(buffer,box,width,height) {
  const [x,y,w,h]=box;
  const rect={left:Math.round(x*width),top:Math.round(y*height),width:Math.max(1,Math.floor(w*width)),height:Math.max(1,Math.floor(h*height))};
  const {data,info}=await sharp(buffer).extract(rect).greyscale().raw().toBuffer({resolveWithObject:true});
  const dark=data.reduce((s,v)=>s+(v<45?1:0),0)/data.length;
  let solidRows=0;
  for(let yy=0;yy<info.height;yy++){let run=0,max=0;for(let xx=0;xx<info.width;xx++){run=data[yy*info.width+xx]<45?run+1:0;max=Math.max(max,run)}if(max>Math.max(info.height*.9,info.width*.08))solidRows++}
  if(dark>.48||solidRows/info.height>.3)return {image:null,redacted:true};
  // Rules on the perimeter must not erase minus signs or decimal points.
  const out=Buffer.from(data),cw=info.width,ch=info.height;
  for(let yy=0;yy<ch;yy++) {
    let n=0;for(let xx=0;xx<cw;xx++)if(data[yy*cw+xx]<160)n++;
    if(n/cw>.65){
      const from=yy>ch*.55?Math.max(0,yy-1):yy<ch*.22?0:yy;
      const to=yy>ch*.55?ch:yy<ch*.22?Math.min(ch,yy+2):yy+1;
      for(let row=from;row<to;row++)for(let xx=0;xx<cw;xx++)out[row*cw+xx]=255;
    }
  }
  for(let xx=0;xx<cw;xx++) {
    let n=0;for(let yy=0;yy<ch;yy++)if(data[yy*cw+xx]<160)n++;
    if((xx<4||xx>cw-5)&&n/ch>.65)for(let yy=0;yy<ch;yy++)out[yy*cw+xx]=255;
  }
  if(out.reduce((s,v)=>s+(v<160?1:0),0)/out.length<.007)return {image:null,redacted:false};
  const image=await sharp(out,{raw:{width:cw,height:ch,channels:1}}).threshold(180).resize({width:cw*2}).extend({top:16,bottom:16,left:16,right:16,background:'#fff'}).png().toBuffer();
  return {image,redacted:false};
}
function wordsOf(data) { return (data.blocks??[]).flatMap(b=>b.paragraphs.flatMap(p=>p.lines.flatMap(l=>l.words))); }
function textIn(words,box,w,h) {
  const [x,y,bw,bh]=box;
  const selected=words.filter(word=>{
    const b=word.bbox, cx=(b.x0+b.x1)/2/w,cy=(b.y0+b.y1)/2/h;
    return cx>=x&&cx<=x+bw&&cy>=y&&cy<=y+bh;
  }).sort((a,b)=>Math.abs(a.bbox.y0-b.bbox.y0)>h*.006?a.bbox.y0-b.bbox.y0:a.bbox.x0-b.bbox.x0);
  return {value:selected.map(w=>w.text).join(' ').trim(),confidence:selected.length?Math.round(selected.reduce((s,w)=>s+w.confidence,0)/selected.length):0};
}
export async function extract(pages,onProgress=()=>{}) {
  if(pages.length!==3) throw new Error('Capture or upload all 3 pages before processing.');
  const langRoot=path.dirname(require.resolve('@tesseract.js-data/eng/package.json'));
  const worker=await createWorker('eng',1,{langPath:path.join(langRoot,'4.0.0'),cacheMethod:'none',workerPath:require.resolve('tesseract.js/src/worker-script/node/index.js')});
  try {
    await worker.setParameters({tessedit_pageseg_mode:PSM.SPARSE_TEXT,preserve_interword_spaces:'1'});
    const fields=templateFields(), results=[],raw=[];
    for(let i=0;i<3;i++) {
      onProgress({stage:'reading',message:`Reading page ${i+1} of 3 with local OCR…`,page:i+1});
      const buffer=await getPage(pages[i].id);
      const meta=await sharp(buffer).metadata();
      const {data}=await worker.recognize(buffer,{}, {blocks:true,text:true});
      raw.push(data.text);
      const words=wordsOf(data);
      const title=data.text.toUpperCase().replace(/[^A-Z0-9]/g,'');
      if(i===0&&(!/MANUFACTUR/.test(title)||!/TUBESHEET/.test(title))) throw new Error('Page 1 was not identified as Form U-1. Check page order, crop and image clarity.');
      if(i===1&&(!/NOZZLE/.test(title)||!/SUPPORT/.test(title))) throw new Error('Expected the nozzles / supports continuation on page 2. Check the page order and retake unclear photos.');
      if(i===2&&!/CERTIFICATEOFSHOP/.test(title)) throw new Error('Expected the certification page on page 3. Check the page order and image clarity.');
      if(i===0) onProgress({stage:'identified',message:'Form U-1 identified · supported U1-15 structure'});
      for(const field of fields.filter(f=>f.page===i+1)) {
        let {value,confidence}=textIn(words,field.box,meta.width,meta.height);
        // Black redaction boxes and blank lines are missing data, never guesses.
        const fullValue=value,fullConfidence=confidence;
        const cell=await cellImage(buffer,field.box,meta.width,meta.height);
        if(!cell.image) {value='';confidence=0;}
        else {
          await worker.setParameters({tessedit_pageseg_mode:field.id==='remarks'?PSM.SINGLE_BLOCK:PSM.SINGLE_LINE,user_defined_dpi:'300'});
          const result=await worker.recognize(cell.image,{}, {text:true});
          value=result.data.text.trim().replace(/\s+/g,' ');confidence=Math.round(result.data.confidence);
          const same=value.replace(/\s/g,'').toUpperCase()===fullValue.replace(/\s/g,'').toUpperCase();
          if(same)confidence=Math.max(confidence,fullConfidence);
          else {
            if(confidence<75&&fullConfidence>confidence+12&&!value.startsWith('-')){value=fullValue;confidence=fullConfidence}
            if(fullValue)confidence=Math.min(confidence,79);
          }
        }
        value=value.replace(/^[|_—\s]+|[|_—\s]+$/g,'');
        if(!/[a-zA-Z0-9]/.test(value)) {value='';confidence=0;}
        // Name/address share a printed line. A visible delimiter can establish
        // the split; otherwise keep the name candidate for explicit review.
        let ambiguous=['manufacturer','manufacturerAddress','purchaser','purchaserAddress'].includes(field.id);
        if(ambiguous&&value) {
          const split=value.match(/^(.+?)[,;]\s*(\d.+)$/);
          if(split){value=field.id.endsWith('Address')?split[2]:split[1];ambiguous=false}
          else if(field.id.endsWith('Address')){value='';confidence=0}
        }
        if(field.id.endsWith('.boltQuantity')||field.id.endsWith('.boltSize')) {
          const match=value.match(/^(\d+)\s*[-–]\s*(.+)$/);
          value=match?(field.id.endsWith('.boltQuantity')?match[1]:match[2]):/^N\/?A$/i.test(value)?value:'';
        }
        if(field.id.endsWith('.testPressure'))value=value.match(/\d+(?:\.\d+)?\s*(?:PSI|BAR|MPA|KPA)/i)?.[0]??'';
        if(field.id.endsWith('.testType'))value=value.match(/hydro(?:static)?|pneu(?:matic)?|comb(?:ined)?/i)?.[0]??'';
        results.push({...field,value,original:value,confidence,status:!value?'Not Detected':confidence>=88&&!ambiguous?'High Confidence':'Review Required'});
      }
      await worker.setParameters({tessedit_pageseg_mode:PSM.SPARSE_TEXT});
      onProgress({stage:'mapped',message:`Page ${i+1}: sections mapped and values extracted`,page:i+1});
    }
    onProgress({stage:'tables',message:'Tables detected · shell courses, flanges, heads, tubes and nozzles'});
    onProgress({stage:'review',message:`${results.filter(f=>f.status!=='High Confidence').length} uncertain or missing fields identified for review`});
    return {fields:results,raw};
  } finally {await worker.terminate();}
}


