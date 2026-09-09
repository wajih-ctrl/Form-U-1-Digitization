'use client'
import { useEffect, useRef, useState } from 'react'
import { Camera, Upload, ArrowRight, RotateCw, Trash2, ChevronLeft, ChevronRight, Crop, Check, X, Plus, ScanLine, FileText, Loader2 } from 'lucide-react'
import type { UPage } from '@/lib/u1/types'
import { useDialog } from './use-dialog'

type Bounds = {left:number;top:number;right:number;bottom:number}
const full:Bounds={left:0,top:0,right:100,bottom:100}
// Estimate a bright document against its surroundings. The user can correct
// all four edges before use; low-contrast scenes fall back to the entire frame.
function detect(canvas:HTMLCanvasElement):Bounds {
  const small=document.createElement('canvas');small.width=240;small.height=Math.round(canvas.height/canvas.width*240)
  const ctx=small.getContext('2d')!;ctx.drawImage(canvas,0,0,small.width,small.height)
  const {data}=ctx.getImageData(0,0,small.width,small.height),xs:number[]=[],ys:number[]=[]
  for(let y=0;y<small.height;y++)for(let x=0;x<small.width;x++){const i=(y*small.width+x)*4;if(Math.min(data[i],data[i+1],data[i+2])>180&&Math.max(data[i],data[i+1],data[i+2])-Math.min(data[i],data[i+1],data[i+2])<45){xs.push(x);ys.push(y)}}
  if(xs.length<small.width*small.height*.2)return full
  xs.sort((a,b)=>a-b);ys.sort((a,b)=>a-b)
  const q=(a:number[],p:number)=>a[Math.floor(a.length*p)]
  return {left:Math.max(0,q(xs,.005)/small.width*100-1),right:Math.min(100,q(xs,.995)/small.width*100+1),top:Math.max(0,q(ys,.005)/small.height*100-1),bottom:Math.min(100,q(ys,.995)/small.height*100+1)}
}
export function Capture({pages,setPages,onProcess,onCancel,notify}:{pages:UPage[];setPages:(p:UPage[])=>void;onProcess:(name:string)=>void;onCancel:()=>void;notify:(s:string)=>void}) {
  const [busy,setBusy]=useState(false),[camera,setCamera]=useState(false),[editing,setEditing]=useState<{src:string;index?:number;name:string}|null>(null),[bounds,setBounds]=useState<Bounds>(full),[name,setName]=useState(''),[dragging,setDragging]=useState(false),[imageReady,setImageReady]=useState(false)
  const video=useRef<HTMLVideoElement>(null),stream=useRef<MediaStream|null>(null),input=useRef<HTMLInputElement>(null),native=useRef<HTMLInputElement>(null),img=useRef<HTMLImageElement>(null),replacement=useRef<number|undefined>(undefined)
  const stop=()=>{stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;setCamera(false)}
  useDialog(camera||!!editing,()=>{if(!busy){stop();setEditing(null)}})
  useEffect(()=>{setName(localStorage.getItem('u1-capture-name')||'')},[])
  useEffect(()=>()=>{stream.current?.getTracks().forEach(t=>t.stop())},[])
  useEffect(()=>{if(camera&&video.current&&stream.current)video.current.srcObject=stream.current},[camera])
  useEffect(()=>setImageReady(false),[editing?.src])
  async function takePhotos(index?:number) {
    replacement.current=index
    if(pages.length>=3&&index===undefined){notify('All three pages are captured. Select a page to retake it.');return}
    try {stream.current=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:2400},height:{ideal:3200}},audio:false});setCamera(true)}
    catch {notify('Live camera unavailable. Use your device camera or choose a photo.');native.current?.click()}
  }
  async function upload(files:File[]) {
    if(!files.length)return
    setBusy(true)
    try {
      if(files.some(f=>f.size>4*1024*1024))throw new Error('Each file must be 4 MB or smaller. Compress the PDF or use smaller page images.')
      const added:UPage[]=[]
      for(const file of files){
        const form=new FormData();form.append('files',file)
        const response=await fetch('/api/u1/upload',{method:'POST',body:form}),data=await response.json()
        if(!response.ok)throw new Error(data.error)
        added.push(...data.pages)
        if(pages.length+added.length>3)throw new Error('Only three pages are needed. Remove a page before adding another.')
      }
      setPages([...pages,...added]);notify(`${added.length} page(s) added. Check crop and page order before processing.`)
    }catch(e){notify(e instanceof Error?e.message:'Upload failed')}finally{setBusy(false)}
  }
  function snap() {
    const v=video.current;if(!v||!v.videoWidth)return
    const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;c.getContext('2d')!.drawImage(v,0,0)
    setBounds(detect(c));setEditing({src:c.toDataURL('image/jpeg',.95),index:replacement.current,name:`Camera page ${(replacement.current??pages.length)+1}`});stop()
  }
  function imageCanvas() {
    const image=img.current!;const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;c.getContext('2d')!.drawImage(image,0,0);return c
  }
  function rotate() {
    const src=imageCanvas(),c=document.createElement('canvas');c.width=src.height;c.height=src.width;const ctx=c.getContext('2d')!;ctx.translate(c.width,0);ctx.rotate(Math.PI/2);ctx.drawImage(src,0,0);setEditing({...editing!,src:c.toDataURL('image/png')});setBounds(full)
  }
  async function usePhoto() {
    setBusy(true)
    try {
      const source=imageCanvas(),c=document.createElement('canvas'),sx=source.width*bounds.left/100,sy=source.height*bounds.top/100
      c.width=Math.round(source.width*(bounds.right-bounds.left)/100);c.height=Math.round(source.height*(bounds.bottom-bounds.top)/100)
      if(c.width<200||c.height<200)throw new Error('The crop is too small. Include the full document page.')
      c.getContext('2d')!.drawImage(source,sx,sy,c.width,c.height,0,0,c.width,c.height)
      const blob=await new Promise<Blob|null>(resolve=>c.toBlob(resolve,'image/jpeg',.92));if(!blob)throw new Error('Could not capture image.')
      if(blob.size>4*1024*1024)throw new Error('This photo exceeds 4 MB. Retake at a lower camera resolution or upload a smaller image.')
      const form=new FormData();form.append('files',blob,editing!.name+'.jpg')
      const response=await fetch('/api/u1/upload',{method:'POST',body:form}),data=await response.json();if(!response.ok)throw new Error(data.error)
      const next=[...pages];if(editing!.index!==undefined)next[editing!.index]=data.pages[0];else next.push(data.pages[0]);setPages(next);setEditing(null);notify('Page saved. Check that every form edge is visible.')
    }catch(e){notify(e instanceof Error?e.message:'Could not save photo')}finally{setBusy(false)}
  }
  async function reference() {setBusy(true);try{const r=await fetch('/reference-u1.pdf');await upload([new File([await r.blob()],'Reference Form U-1.pdf',{type:'application/pdf'})])}finally{setBusy(false)}}
  function move(i:number,d:number){const next=[...pages];[next[i],next[i+d]]=[next[i+d],next[i]];setPages(next)}
  return <>
    <div className="u-heading"><div><div className="u-eyebrow">DOCUMENT INTAKE / FORM U-1</div><h1>Capture a new form</h1><p>Three pages. One complete engineering record.</p></div><button className="u-btn" onClick={onCancel}>Back to overview</button></div>
    <div className="u-intake-steps"><span className="active">01 <b>Capture pages</b></span><i/><span>02 <b>Extract & review</b></span><i/><span>03 <b>Approve record</b></span></div>
    <div className="u-capture-grid">
      <div className="u-card u-capture-primary"><div className="u-icon-block"><Camera size={27}/></div><div className="u-eyebrow">RECOMMENDED FOR PHYSICAL FORMS</div><h2>From paper to a vessel record.</h2><p>Photograph each page in good light. Keep the form flat and include all four edges.</p><button className="u-btn primary large" disabled={busy||pages.length===3} onClick={()=>takePhotos()}><Camera size={18}/>Take Photos <ArrowRight size={17}/></button><small>Camera capture · edge detection · crop & rotate</small></div>
      <div className={`u-card u-upload ${dragging?'dragging':''}`} onDragOver={e=>{e.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);void upload([...e.dataTransfer.files])}}><Upload size={29}/><h3>Already have a digital copy?</h3><p>Drop your three-page PDF or page images here.</p><button className="u-btn" disabled={busy||pages.length===3} onClick={()=>input.current?.click()}>{busy?<Loader2 className="u-spin" size={16}/>:<Upload size={16}/>}Upload PDF / Images</button><small>PDF, JPG, PNG, WebP · up to 4 MB per file</small><button className="u-text-btn" disabled={busy||pages.length>0} onClick={reference}><FileText size={14}/>Try the supplied reference form</button></div>
    </div>
    <input ref={input} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" multiple hidden onChange={e=>{void upload([...e.target.files??[]]);e.target.value=''}}/>
    <input ref={native} type="file" accept="image/*" capture="environment" hidden onChange={e=>{const file=e.target.files?.[0];if(file){const reader=new FileReader();reader.onload=()=>{setBounds(full);setEditing({src:String(reader.result),index:replacement.current,name:`Camera page ${(replacement.current??pages.length)+1}`})};reader.readAsDataURL(file)}e.target.value=''}}/>
    <section className="u-card"><div className="u-card-head"><div><h3>Captured pages <span className="u-counter">{pages.length} / 3</span></h3><p>Order: vessel & design → nozzles & supports → certification</p></div><div className="u-crop-tools">{pages.length>0&&pages.length<3&&<button className="u-btn small" disabled={busy} onClick={()=>takePhotos()}><Plus size={14}/>Add Next Page</button>}<span className="u-badge neutral">{pages.length===3?'Ready to process':'Waiting for pages'}</span></div></div><div className="u-pages-grid">{[0,1,2].map(i=>pages[i]?<div className="u-page-tile" key={pages[i].id}><button className="u-page-preview" aria-label={`Preview page ${i+1}`} onClick={()=>{setBounds(full);setEditing({src:pages[i].url,index:i,name:pages[i].name})}}><img src={pages[i].url} alt={`Captured Form U-1 page ${i+1}`}/><span>Preview & crop</span></button><div className="u-page-title"><b>Page {i+1}</b><Check size={15}/></div><small>{pages[i].name}</small><div className="u-page-tools"><button aria-label={`Move page ${i+1} earlier`} disabled={i===0} onClick={()=>move(i,-1)}><ChevronLeft size={16}/></button><button aria-label={`Move page ${i+1} later`} disabled={i===pages.length-1} onClick={()=>move(i,1)}><ChevronRight size={16}/></button><button onClick={()=>{setBounds(full);setEditing({src:pages[i].url,index:i,name:pages[i].name})}}><Crop size={15}/>Edit</button><button aria-label={`Remove page ${i+1}`} onClick={()=>setPages(pages.filter((_,n)=>n!==i))}><Trash2 size={15}/></button></div></div>:<button key={i} className="u-page-empty" disabled={busy} onClick={()=>takePhotos()}><Plus size={24}/><b>Page {i+1}</b><span>{['Vessel & design','Nozzles & supports','Certification'][i]}</span></button>)}</div><div className="u-capture-footer"><label>Record name <input aria-label="Record name" value={name} onChange={e=>{setName(e.target.value);localStorage.setItem('u1-capture-name',e.target.value)}} placeholder="e.g. Heat exchanger · inspection intake"/></label><button className="u-btn primary" disabled={pages.length!==3||busy} onClick={()=>onProcess(name||'Form U-1 · '+new Date().toLocaleDateString())}>Process Form <ArrowRight size={17}/></button></div></section>
    {camera&&<div className="u-modal-backdrop"><section className="u-modal camera" role="dialog" aria-modal="true" aria-label="Take Photos"><div className="u-card-head"><h3>Take photo · Page {(replacement.current??pages.length)+1} of 3</h3><button aria-label="Close camera" onClick={stop}><X/></button></div><div className="u-camera-stage"><video ref={video} autoPlay playsInline muted/><div className="u-camera-guide"/></div><p>Keep the full page inside the guide. Edges will be detected after capture.</p><div className="u-modal-actions"><span>{pages.length} pages captured</span><button className="u-btn primary" onClick={snap}><Camera size={18}/>Capture page</button></div></section></div>}
    {editing&&<div className="u-modal-backdrop"><section className="u-modal" role="dialog" aria-modal="true" aria-label="Page preview and crop"><div className="u-card-head"><div><h3>Page {(editing.index??pages.length)+1} preview</h3><p>Adjust the boundary so the full form remains visible.</p></div><button aria-label="Close preview" onClick={()=>setEditing(null)}><X/></button></div><div className="u-crop-preview"><div><img ref={img} src={editing.src} alt="Page to crop" onLoad={()=>setImageReady(true)} onError={()=>notify("The page image could not load. Please upload it again.")}/><div className="u-crop-boundary" style={{left:bounds.left+'%',top:bounds.top+'%',width:(bounds.right-bounds.left)+'%',height:(bounds.bottom-bounds.top)+'%'}}/></div></div><div className="u-crop-tools"><button className="u-btn" disabled={!imageReady||busy} onClick={()=>setBounds(detect(imageCanvas()))}><ScanLine size={16}/>Detect edges</button><button className="u-btn" disabled={!imageReady||busy} onClick={rotate}><RotateCw size={16}/>Rotate 90°</button><button className="u-btn" onClick={()=>setBounds(full)}>Reset crop</button></div><div className="u-crop-sliders">{(['left','top','right','bottom'] as const).map(edge=><label key={edge}>{edge}<input type="range" aria-label={`Crop ${edge}`} min={edge==='right'?bounds.left+15:edge==='bottom'?bounds.top+15:0} max={edge==='left'?bounds.right-15:edge==='top'?bounds.bottom-15:100} step="0.5" value={bounds[edge]} onChange={e=>setBounds({...bounds,[edge]:Number(e.target.value)})}/></label>)}</div><div className="u-modal-actions"><button className="u-btn" onClick={()=>{const i=editing.index;setEditing(null);void takePhotos(i)}}>Retake</button><button className="u-btn primary" disabled={busy||!imageReady} onClick={usePhoto}>{busy?<Loader2 size={17} className="u-spin"/>:<Check size={17}/>}Use Photo</button></div></section></div>}
  </>
}




