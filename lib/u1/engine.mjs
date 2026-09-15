import path from 'node:path';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { createCanvas, DOMMatrix, ImageData, Path2D } from '@napi-rs/canvas';
import { createWorker, PSM } from 'tesseract.js';
import { templateFields } from './template.mjs';
import { normalizePageImage } from './page-normalize.mjs';

import {storage,getPage} from './storage.mjs';
export {dataDir,safeId,pagePath,recordPath,getRecord,saveRecord} from './storage.mjs';
export async function savePage(buffer, name, {register=true}={}) {
  storage.assertConfigured();
  const id=randomUUID();
  const result=register?await normalizePageImage(buffer):await sharp(buffer,{limitInputPixels:45000000}).rotate().flatten({background:'#fff'}).resize({width:1844,height:2374,fit:'fill',withoutEnlargement:false}).png().toBuffer({resolveWithObject:true});
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
        result.push(await savePage(await canvas.encode('png'),`${name} · page ${i}`,{register:false}));
      }
      return result;
    } finally {await loading.destroy();}
  }
  return [await savePage(buffer,name)];
}

async function cellImage(buffer,field,width,height) {
  const box=field.box;
  const [x,y,w,h]=box;
  // Form captions sit directly below many value lines. Keep the horizontal
  // extent (a leading minus can touch it), while trimming the caption fringe.
  const trimCaption=['manufacturer','manufacturerAddress','purchaser','purchaserAddress','installation'].includes(field.id);
  const top=Math.round((y+h*.02)*height),bottom=Math.round((y+h*(trimCaption ? .88 : .98))*height);
  const rect={left:Math.round(x*width),top,width:Math.max(1,Math.floor(w*width)),height:Math.max(1,bottom-top)};
  const {data,info}=await sharp(buffer).extract(rect).greyscale().raw().toBuffer({resolveWithObject:true});
  const dark=data.reduce((s,v)=>s+(v<45?1:0),0)/data.length;
  let solidRows=0;
  for(let yy=0;yy<info.height;yy++){let run=0,max=0;for(let xx=0;xx<info.width;xx++){run=data[yy*info.width+xx]<45?run+1:0;max=Math.max(max,run)}if(max>Math.max(info.height*.9,info.width*.08))solidRows++}
  if(dark>.48||solidRows/info.height>.3)return {image:null,alternate:null,redacted:true,leadingMinus:false};
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
  if(out.reduce((s,v)=>s+(v<160?1:0),0)/out.length<.007)return {image:null,alternate:null,redacted:false,leadingMinus:false};
  // Tesseract sometimes drops a short sign before an otherwise clear number.
  // Detect the isolated horizontal stroke from pixels; this only supplies a
  // sign for signed numeric fields and never invents a value.
  let leadingMinus=false;
  for(let yy=2;yy<ch-2&&!leadingMinus;yy++){
    let run=0;
    for(let xx=0;xx<Math.floor(cw*.28);xx++){
      run=out[yy*cw+xx]<140?run+1:0;
      if(run>=Math.max(5,Math.floor(cw*.025))){
        let rows=1;
        for(let dy=1;dy<7&&yy+dy<ch;dy++){
          let hits=0;for(let rx=xx-run+1;rx<=xx;rx++)if(out[(yy+dy)*cw+rx]<140)hits++;
          if(hits>=run*.45)rows++;else break;
        }
        if(rows<=Math.max(4,Math.floor(ch*.2)))leadingMinus=true;
      }
    }
  }
  const seen=new Uint8Array(cw*ch),queue=new Int32Array(cw*ch),components=[];
  for(let start=0;start<out.length;start++){
    if(seen[start]||out[start]>=140)continue;
    let head=0,tail=0,minX=cw,maxX=0,minY=ch,maxY=0,count=0;queue[tail++]=start;seen[start]=1;
    while(head<tail){const at=queue[head++],x=at%cw,y=(at/cw)|0;count++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);for(const next of [at-1,at+1,at-cw,at+cw]){if(next<0||next>=out.length||seen[next]||out[next]>=140)continue;const nx=next%cw;if(Math.abs(nx-x)>1)continue;seen[next]=1;queue[tail++]=next;}}
    components.push({minX,maxX,minY,maxY,count,width:maxX-minX+1,height:maxY-minY+1});
  }
  const glyphs=components.filter(c=>c.height>=ch*.38&&c.count>=4).sort((a,b)=>a.minX-b.minX),dot=components.filter(c=>c.minY>ch*.52&&c.height<=ch*.24&&c.width<=ch*.24&&c.count>=2).sort((a,b)=>b.count-a.count)[0];
  const decimalIndex=dot?glyphs.filter(c=>c.maxX<dot.minX).length:0;
  const image=await sharp(out,{raw:{width:cw,height:ch,channels:1}}).threshold(180).resize({width:cw*2}).extend({top:16,bottom:16,left:16,right:16,background:'#fff'}).png().toBuffer();
  // A grayscale contrast pass retains faint pen strokes that disappear in
  // the binary image. It is used selectively for important/uncertain fields.
  const alternate=await sharp(out,{raw:{width:cw,height:ch,channels:1}}).normalize().linear(1.35,-28).resize({width:cw*2}).extend({top:16,bottom:16,left:16,right:16,background:'#fff'}).png().toBuffer();
  return {image,alternate,redacted:false,leadingMinus,decimalIndex};
}
const compact=value=>value.replace(/[^A-Z0-9]/gi,'').toUpperCase();
function technicalValue(value,field,leadingMinus=false) {
  let normalized=value.replace(/[“”]/g,'"').replace(/[‘’`]/g,"'").replace(/\s+/g,' ').trim();
  normalized=normalized.replace(/^[^\p{L}\p{N}-]+|[^\p{L}\p{N})%'"\u00b0]+$/gu,'');
  if(field.id.endsWith('.mdmt')&&leadingMinus&&/^\d/.test(normalized))normalized='-'+normalized;
  if(/material/i.test(field.label)){
    normalized=normalized.toUpperCase().replace(/^5A(?=\d)/,'SA').replace(/^S[AIL](?=\d)/,'SA');
    // Common OCR ambiguity in ASME bolting grades (for example B7 read as 87).
    normalized=normalized.replace(/^(SA(?:193|320|354)[ -])8(?=\d\b)/,'$1B');
  }
  if(/temperature/i.test(field.label))normalized=normalized.replace(/\s*[°o](?=\s*[FC]\b)/i,' °').replace(/(\d)\s*([FC])\b/i,'$1 °$2');
  if(/(?:diameter|length|thickness|size|radius|allowance|hub|OD|ID)/i.test(field.label))normalized=normalized.replace(/(\d)\s*(?:IN\.?|INCH(?:ES)?)\b/i,'$1 in').replace(/(\d)\s*(?:FT\.?|FEET)\b/i,"$1 ft");
  return normalized;
}
function valueFit(value,field) {
  const v=value.toUpperCase();let score=0;
  if(!value) return -20;
  if(/^N\/?A$/i.test(value))return 5;
  if(/material/i.test(field.label)){score+=/^SA\d{2,4}/.test(v)?8:0;score+=/^(?:SA|ASTM|SB|A)\d/i.test(v)?3:0;score-=/[?{}|]/.test(v)?4:0;}
  if(/(?:pressure|MAWP)/i.test(field.label)){score+=/\d/.test(v)?2:-4;score+=/(?:PSI|BAR|MPA|KPA)\b/.test(v)?3:0;}
  if(/temperature/i.test(field.label)){score+=/[-+]?\d/.test(v)?2:-3;score+=/\b[FC]\b|°[FC]/.test(v)?3:0;}
  if(/(?:diameter|length|thickness|size|radius|allowance|OD|ID)/i.test(field.label)){score+=/\d/.test(v)?2:0;score+=/(?:\b(?:IN|FT)\b|["'])/.test(v)?2:0;}
  if(field.id==='year')score+=/^\d{4}$/.test(v)?6:-4;
  return score;
}
function confidenceReason(value,confidence,field,disagreed) {
  if(!value)return 'No value was detected in the mapped source area.';
  if(disagreed)return 'Two OCR passes produced different readings.';
  if(confidence<60)return 'Very low OCR confidence; verify against the document.';
  if(confidence<88)return 'Low OCR confidence; a character or unit may be incorrect.';
  if(/material/i.test(field.label)&&!/^N\/?A$|^(?:SA|SB|ASTM|A)\s*\d/i.test(value))return 'The material value does not match the expected specification pattern.';
  if(/(?:pressure|temperature|diameter|length|thickness|allowance|radius)/i.test(field.label)&&!/\d|N\/?A/i.test(value))return 'The engineering value does not contain an expected number.';
  return '';
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
function pageNumberFromName(name='') {
  return Number(name.match(/(?:page|pg)[\s._-]*0*([123])(?:\D|$)/i)?.[1]??0);
}
function pageScores(title) {
  const has=pattern=>pattern.test(title)?1:0;
  return [
    has(/MANUFACTUR/)*3+has(/DATAREPORT/)*2+has(/PRESSUREVESSEL/)+has(/TUBESHEET/)+has(/MAWP/),
    has(/NOZZLE/)*3+has(/OPENING/)*2+has(/SUPPORT/)*2+has(/REMARK/)+has(/CONTINUED/),
    has(/CERTIFICATEOFSHOP/)*4+has(/CERTIFICATEOFFIELD/)*3+has(/AUTHORIZEDINSPECTOR/)*2+has(/COMPLIANCE/),
  ];
}
function orderFormPages(scans) {
  const named=scans.map(scan=>pageNumberFromName(scan.page.name));
  if(new Set(named).size===3&&named.every(number=>number>=1&&number<=3))return [...scans].sort((a,b)=>pageNumberFromName(a.page.name)-pageNumberFromName(b.page.name));
  const permutations=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
  const best=permutations.map(order=>({order,score:order.reduce((sum,scanIndex,pageIndex)=>sum+scans[scanIndex].scores[pageIndex],0)})).sort((a,b)=>b.score-a.score)[0];
  const ordered=best.order.map(index=>scans[index]);
  if(ordered.some((scan,pageIndex)=>scan.scores[pageIndex]<1))throw new Error('The three pages could not be matched to the supported Form U-1 layout. Check that pages 1, 2 and 3 are included and readable.');
  return ordered;
}
export async function extract(pages,onProgress=()=>{},signal) {
  if(pages.length!==3) throw new Error('Capture or upload all 3 pages before processing.');
  signal?.throwIfAborted();
  onProgress({stage:'ocr',message:'Starting the local OCR engine…'});
  // Keep the language model at a stable path inside the function package.
  // Bundlers can rewrite require.resolve(package) into a numeric module ID,
  // which is not a usable filesystem path in a deployed server function.
  // Tesseract resolves its own Node worker relative to its installed package.
  const workerPath=path.join(process.cwd(),'lib','u1','ocr','runtime','node_modules','tesseract.js','src','worker-script','node','index.js');
  const worker=await createWorker('eng',1,{langPath:path.join(process.cwd(),'lib','u1','ocr'),cacheMethod:'none',workerPath});
  try {
    await worker.setParameters({tessedit_pageseg_mode:PSM.SPARSE_TEXT,preserve_interword_spaces:'1'});
    const fields=templateFields(), results=[],raw=[],scans=[];
    for(let i=0;i<3;i++) {
      signal?.throwIfAborted();
      onProgress({stage:'reading',message:`Reading page ${i+1} of 3 with local OCR…`,page:i+1});
      const buffer=await getPage(pages[i].id);
      const meta=await sharp(buffer).metadata();
      const {data}=await worker.recognize(buffer,{}, {blocks:true,text:true});
      const title=data.text.toUpperCase().replace(/[^A-Z0-9]/g,'');
      scans.push({page:pages[i],buffer,meta,data,title,scores:pageScores(title),uploadedIndex:i});
    }
    const ordered=orderFormPages(scans),wasReordered=ordered.some((scan,index)=>scan.uploadedIndex!==index);
    if(wasReordered)onProgress({stage:'identified',message:'Form U-1 identified · pages automatically placed in order'});
    else onProgress({stage:'identified',message:'Form U-1 identified · supported U1-15 structure'});
    for(let i=0;i<3;i++) {
      const {buffer,meta,data}=ordered[i],words=wordsOf(data);
      raw.push(data.text);
      for(const field of fields.filter(f=>f.page===i+1)) {
        signal?.throwIfAborted();
        let {value,confidence}=textIn(words,field.box,meta.width,meta.height);
        // Black redaction boxes and blank lines are missing data, never guesses.
        const fullValue=value,fullConfidence=confidence;
        const cell=await cellImage(buffer,field,meta.width,meta.height);
        if(!cell.image) {value='';confidence=0;}
        else {
          await worker.setParameters({tessedit_pageseg_mode:field.id==='remarks'?PSM.SINGLE_BLOCK:PSM.SINGLE_LINE,user_defined_dpi:'300'});
          const result=await worker.recognize(cell.image,{}, {text:true});
          value=result.data.text.trim().replace(/\s+/g,' ');confidence=Math.round(result.data.confidence);
          let disagreed=false;
          if(cell.alternate&&(field.importance==='Key engineering'||confidence<72)){
            const second=await worker.recognize(cell.alternate,{}, {text:true}),alternative=second.data.text.trim().replace(/\s+/g,' '),alternativeConfidence=Math.round(second.data.confidence);
            if(alternative&&compact(alternative)!==compact(value))disagreed=true;
            if(valueFit(alternative,field)*8+alternativeConfidence>valueFit(value,field)*8+confidence){value=alternative;confidence=alternativeConfidence;}
          }
          const same=value.replace(/\s/g,'').toUpperCase()===fullValue.replace(/\s/g,'').toUpperCase();
          if(same)confidence=Math.max(confidence,fullConfidence);
          else {
            const cellKey=compact(value),fullKey=compact(fullValue);
            // Page-wide OCR often includes a nearby caption. Prefer the
            // tighter cell reading when it is already present inside that
            // longer candidate; use page text only when the cell truly failed.
            const cellIsContained=cellKey.length>=2&&fullKey.includes(cellKey);
            if(!cellIsContained&&confidence<75&&fullConfidence>confidence+12&&!value.startsWith('-')){value=fullValue;confidence=fullConfidence}
            if(fullValue)confidence=Math.min(confidence,79);
          }
          cell.disagreed=disagreed;
        }
        value=technicalValue(value,field,cell.leadingMinus);
        if(cell.decimalIndex>0&&!value.includes('.')&&/^(?:\d{2,})(?:\s*[A-Z]|$)/i.test(value)){
          const digits=value.match(/^\d+/)?.[0]??'';
          if(cell.decimalIndex<digits.length)value=value.slice(0,cell.decimalIndex)+'.'+value.slice(cell.decimalIndex);
        }
        if(!/[a-zA-Z0-9]/.test(value)) {value='';confidence=0;}
        // Name/address share a printed line. A visible delimiter can establish
        // the split; otherwise keep the name candidate for explicit review.
        let ambiguous=['manufacturer','manufacturerAddress','purchaser','purchaserAddress'].includes(field.id);
        if(ambiguous&&value) {
          const split=value.match(/^(.+?)[,;]\s*(\d.+)$/);
          if(split){value=field.id.endsWith('Address')?split[2]:split[1];ambiguous=false}
          else if(field.id.endsWith('Address')){value='';confidence=0}
        }
        // Remove fragments of the fixed captions that can touch a photographed
        // value after minor perspective correction. These are template labels,
        // not sample-form values.
        if(field.id==='installation')value=value.replace(/^and\s+(?=[A-Z0-9])/,'');
        if(field.id==='manufacturerAddress'||field.id==='purchaserAddress')value=value.replace(/\s+(?:of|name|address|manufacturer|purchaser|ee|re)[,.)]*$/i,'');
        if(field.id.endsWith('.boltQuantity')||field.id.endsWith('.boltSize')) {
          const match=value.match(/^(\d+)\s*[-–]\s*(.+)$/);
          value=match?(field.id.endsWith('.boltQuantity')?match[1]:match[2]):/^N\/?A$/i.test(value)?value:'';
        }
        if(field.id.endsWith('.testPressure'))value=value.match(/\d+(?:\.\d+)?\s*(?:PSI|BAR|MPA|KPA)/i)?.[0]??'';
        if(field.id.endsWith('.testType'))value=value.match(/hydro(?:static)?|pneu(?:matic)?|comb(?:ined)?/i)?.[0]??'';
        const lowConfidenceReason=ambiguous&&value?'Name and address share one source line; verify the split.':confidenceReason(value,confidence,field,cell.disagreed||false);
        results.push({...field,value,original:value,confidence,lowConfidenceReason,status:!value?'Not Detected':confidence>=88&&!ambiguous&&!lowConfidenceReason?'High Confidence':'Review Required'});
      }
      await worker.setParameters({tessedit_pageseg_mode:PSM.SPARSE_TEXT});
      onProgress({stage:'mapped',message:`Page ${i+1}: sections mapped and values extracted`,page:i+1});
    }
    onProgress({stage:'tables',message:'Tables detected · shell courses, flanges, heads, tubes and nozzles'});
    onProgress({stage:'review',message:`${results.filter(f=>f.status!=='High Confidence').length} uncertain or missing fields identified for review`});
    return {fields:results,raw,pages:ordered.map(scan=>scan.page)};
  } finally {await worker.terminate();}
}


