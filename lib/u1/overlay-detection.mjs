import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const WIDTH=1844,HEIGHT=2374;
const referencePages=[1,2,3].map(number=>path.join(process.cwd(),'lib','u1','ocr',`reference-page-${number}.png`));
const referenceCache=new Map();

async function referencePixels(pageNumber){
  if(!referenceCache.has(pageNumber))referenceCache.set(pageNumber,sharp(await fs.readFile(/* turbopackIgnore: true */ referencePages[pageNumber-1])).greyscale().raw().toBuffer());
  return referenceCache.get(pageNumber);
}

// Some raster training documents retain the filled reference sheet underneath
// newly printed answers. Ordinary OCR can confidently return the old answer.
// Comparing image pixels identifies new ink without encoding any sample values.
export async function detectChangedInk(buffer,pageNumber){
  const [reference,current]=await Promise.all([referencePixels(pageNumber),sharp(buffer).greyscale().resize(WIDTH,HEIGHT,{fit:'fill'}).raw().toBuffer()]);
  const n=WIDTH*HEIGHT,changed=new Uint8Array(n);
  let matching=0,added=0;
  for(let i=0;i<n;i++){
    const a=reference[i],b=current[i];
    if(Math.abs(a-b)<15)matching++;
    if(a-b>90&&a>190&&b<120){changed[i]=1;added++}
  }
  const similarity=matching/n,addedRatio=added/n;
  // A photographed or re-scanned page has widespread pixel changes from
  // resampling. The fallback is only for nearly identical raster backgrounds.
  if(similarity<.85||addedRatio<.004||addedRatio>.015)return null;

  const visible=new Uint8Array(n),image=Buffer.alloc(n,255);
  for(let y=1;y<HEIGHT-1;y++)for(let x=1;x<WIDTH-1;x++){
    const i=y*WIDTH+x;
    if(!changed[i])continue;
    let neighbors=0;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)neighbors+=changed[i+dy*WIDTH+dx];
    if(neighbors>=5){visible[i]=1;image[i]=0}
  }
  return {
    similarity,addedRatio,width:WIDTH,height:HEIGHT,visible,
    image:await sharp(image,{raw:{width:WIDTH,height:HEIGHT,channels:1}}).png().toBuffer(),
    inkIn(box){
      const [x,y,w,h]=box;
      const left=Math.max(0,Math.floor(x*WIDTH)),right=Math.min(WIDTH,Math.ceil((x+w)*WIDTH));
      const top=Math.max(0,Math.floor((y-h*.8)*HEIGHT)),bottom=Math.min(HEIGHT,Math.ceil((y+h*.8)*HEIGHT));
      let count=0;
      for(let yy=top;yy<bottom;yy++)for(let xx=left;xx<right;xx++)count+=visible[yy*WIDTH+xx];
      return {count,ratio:count/Math.max(1,(right-left)*(bottom-top))};
    },
  };
}

export function changedInkCandidate(words,field,width,height){
  const [x,y,w,h]=field.box;
  const nearby=words.filter(word=>{
    const b=word.bbox,cx=(b.x0+b.x1)/2/width,cy=(b.y0+b.y1)/2/height;
    return cx>=x&&cx<=x+w&&cy>=y-h*.9&&cy<=y+h*.65&&word.confidence>=25;
  });
  if(!nearby.length)return null;
  const lines=[];
  for(const word of nearby.sort((a,b)=>a.bbox.y0-b.bbox.y0||a.bbox.x0-b.bbox.x0)){
    const cy=(word.bbox.y0+word.bbox.y1)/2;
    let line=lines.find(row=>Math.abs(row.cy-cy)<height*.006);
    if(!line){line={cy,words:[]};lines.push(line)}
    line.words.push(word);
  }
  const ranked=lines.map(line=>{
    const value=line.words.sort((a,b)=>a.bbox.x0-b.bbox.x0).map(word=>word.text).join(' ').trim();
    const confidence=Math.round(line.words.reduce((sum,word)=>sum+word.confidence,0)/line.words.length);
    const distance=Math.abs(line.cy/height-(y-h*.25))/h;
    return {value,confidence,score:confidence-Math.max(0,distance-.25)*30};
  }).filter(item=>/[a-zA-Z0-9]/.test(item.value)).sort((a,b)=>b.score-a.score);
  return ranked[0]??null;
}
