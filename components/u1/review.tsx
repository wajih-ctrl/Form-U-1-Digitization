'use client'
import { useEffect, useRef, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Edit3, Flag, Minus, Plus, ScanLine, ShieldCheck, X, CheckCheck, Maximize2 } from 'lucide-react'
import { resolved, type URecord, type UField, type FieldStatus } from '@/lib/u1/types'

export function Status({status}:{status:string}) {return <span className={`u-badge ${['Verified','Corrected','Approved','Database Ready','N/A'].includes(status)?'good':['Review Required','Not Detected','In Review'].includes(status)?'warn':'neutral'}`}><span/>{status}</span>}
export function FieldEditor({field,locked,busy,onSave}:{field:UField;locked:boolean;busy:boolean;onSave:(f:UField,value:string,status:FieldStatus)=>void}) {
  const [value,setValue]=useState(field.value)
  useEffect(()=>setValue(field.value),[field.id,field.value])
  return <div className="u-field-editor"><label htmlFor={'edit-'+field.id}>{field.label}</label><div className="u-edit-input"><input id={'edit-'+field.id} aria-label={`Edit ${field.label}`} value={value} disabled={locked||busy} placeholder="Not detected — enter a value" onChange={e=>setValue(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&value.trim())onSave(field,value,value!==field.original?'Corrected':'Verified')}}/><Edit3 size={15}/></div><div className="u-field-actions"><button className="u-btn primary small" disabled={locked||busy||!value.trim()} onClick={()=>onSave(field,value,value!==field.original?'Corrected':'Verified')}><Check size={14}/>{value!==field.value?'Save correction':'Confirm'}</button><button className="u-btn small" disabled={locked||busy} onClick={()=>onSave(field,value,'Review Required')}><Flag size={13}/>Flag</button><button className="u-btn small" disabled={locked||busy} onClick={()=>onSave(field,'N/A','N/A')}>Mark N/A</button></div>{field.original!==field.value&&<small>Originally extracted: <code>{field.original||'(blank)'}</code></small>}</div>
}
export function Review({record,onPatch,busy,onApproval}:{record:URecord;onPatch:(body:Record<string,unknown>)=>void;busy:boolean;onApproval:()=>void}) {
  const sections=[...new Set(record.fields.map(f=>f.section))]
  const initial=record.fields.find(f=>!resolved(f))||record.fields[0]
  const [section,setSection]=useState(initial?.section||sections[0]),[selected,setSelected]=useState(initial?.id),[page,setPage]=useState(initial?.page||1),[zoom,setZoom]=useState(100),[filter,setFilter]=useState('All fields'),[hovered,setHovered]=useState<string>(),[sourceOptions,setSourceOptions]=useState<string[]>([])
  const active=record.fields.find(f=>f.id===selected),hoveredField=record.fields.find(f=>f.id===hovered),viewport=useRef<HTMLDivElement>(null),highlight=useRef<HTMLDivElement>(null),fieldPane=useRef<HTMLDivElement>(null),revealField=useRef(false)
  const locked=['Approved','Database Ready'].includes(record.status)
  const done=record.fields.filter(resolved).length
  const fields=record.fields.filter(f=>f.section===section&&(filter!=='Needs review'||!resolved(f)))
  const plain=fields.filter(f=>!f.table),tables=[...new Set(fields.filter(f=>f.table).map(f=>f.table!))]
  function select(f:UField,fromDocument=false){if(!fromDocument)setSourceOptions([]);revealField.current=fromDocument;setSelected(f.id);setSection(f.section);setPage(f.page);if(filter==='Needs review'&&resolved(f))setFilter('All fields')}
  function fieldAtPoint(clientX:number,clientY:number,sheet:HTMLDivElement){
    const rect=sheet.getBoundingClientRect(),x=(clientX-rect.left)/rect.width,y=(clientY-rect.top)/rect.height
    if(x<0||x>1||y<0||y>1)return
    const onPage=record.fields.filter(f=>f.page===page)
    const distance=(f:UField)=>{
      const [bx,by,bw,bh]=f.box,px=x*rect.width,py=y*rect.height,left=bx*rect.width,right=(bx+bw)*rect.width,top=by*rect.height,bottom=(by+bh)*rect.height
      return Math.hypot(Math.max(left-px,0,px-right),Math.max(top-py,0,py-bottom))
    }
    const centerDistance=(f:UField)=>Math.hypot((x-f.box[0]-f.box[2]/2)*rect.width,(y-f.box[1]-f.box[3]/2)*rect.height)
    const ranked=onPage.map(field=>({field,distance:distance(field)})).sort((a,b)=>a.distance-b.distance||centerDistance(a.field)-centerDistance(b.field)||a.field.box[2]*a.field.box[3]-b.field.box[2]*b.field.box[3])
    if(!ranked[0]||ranked[0].distance>18)return
    const field=ranked[0].field,sameBox=(f:UField)=>f.box.every((value,i)=>Math.abs(value-field.box[i])<.000001)
    return {field,related:onPage.filter(sameBox)}
  }
  const navigable=record.fields.filter(f=>filter!=='Needs review'||!resolved(f))
  function step(d:number){const i=navigable.findIndex(f=>f.id===selected);const f=navigable[i+d];if(f)select(f)}
  function nextReview(){const i=record.fields.findIndex(f=>f.id===selected);const f=[...record.fields.slice(i+1),...record.fields.slice(0,i+1)].find(f=>!resolved(f));if(f)select(f)}
  useEffect(()=>{if(active?.page===page&&highlight.current&&viewport.current){const c=viewport.current,el=highlight.current;c.scrollTo({top:Math.max(0,el.offsetTop-c.clientHeight*.35),behavior:'smooth'})}},[active?.id,page,zoom])
  useEffect(()=>{
    if(!revealField.current||!active||!fieldPane.current)return
    const frame=requestAnimationFrame(()=>{
      const pane=fieldPane.current,item=pane?.querySelector<HTMLElement>(`[data-field-id="${active.id}"]`)
      if(!pane||!item)return
      revealField.current=false
      if(pane.scrollHeight>pane.clientHeight+2){
        const target=pane.scrollTop+item.getBoundingClientRect().top-pane.getBoundingClientRect().top-pane.clientHeight/2+item.clientHeight/2
        pane.scrollTo({top:Math.max(0,target),behavior:'smooth'})
      }else item.scrollIntoView({behavior:'smooth',block:'center'})
    })
    return()=>cancelAnimationFrame(frame)
  },[active?.id,section,filter])
  const save=(f:UField,value:string,status:FieldStatus)=>onPatch({action:'field',fieldId:f.id,value,status})
  return <>
    <div className="u-review-heading"><div><span className="u-eyebrow">ENGINEERING REVIEW / {record.id}</span><h1>Review against the original</h1></div><button className="u-btn primary" onClick={onApproval}><ShieldCheck size={17}/>Review approval <ChevronRight size={16}/></button></div>
    <div className="u-review-progress"><span><b>{done}</b> / {record.fields.length} fields reviewed</span><div><i style={{width:`${done/record.fields.length*100}%`}}/></div><span>{record.fields.length-done} remaining</span><button className="u-next-pending" disabled={done===record.fields.length} onClick={nextReview}>Next review item<ChevronRight size={15}/></button><Status status={record.status}/></div>
    <div className="u-review-layout"><section className="u-document-panel"><div className="u-doc-toolbar"><span><FileIcon/>Original document</span><a href={record.pages[page-1]?.url} target="_blank" rel="noreferrer" aria-label="Open full-resolution page"><Maximize2 size={16}/></a></div><div className="u-doc-controls"><div>{record.pages.map((p,i)=><button key={p.id} className={page===i+1?'active':''} onClick={()=>{setHovered(undefined);setSourceOptions([]);setPage(i+1)}}>Page {i+1}</button>)}</div><div><button aria-label="Zoom out" disabled={zoom<=75} onClick={()=>setZoom(zoom-25)}><Minus size={15}/></button><span>{zoom}%</span><button aria-label="Zoom in" disabled={zoom>=250} onClick={()=>setZoom(zoom+25)}><Plus size={15}/></button></div></div><div className="u-document-viewport" ref={viewport} tabIndex={0} role="region" aria-label="Scrollable original document"><div className="u-document-sheet interactive" style={{width:`${zoom}%`}} onPointerMove={e=>setHovered(fieldAtPoint(e.clientX,e.clientY,e.currentTarget)?.field.id)} onPointerLeave={()=>setHovered(undefined)} onClick={e=>{const hit=fieldAtPoint(e.clientX,e.clientY,e.currentTarget);if(hit){select(hit.field,true);setSourceOptions(hit.related.map(f=>f.id))}}}><img src={record.pages[page-1]?.url} alt={`Original Form U-1, page ${page}`}/>{hoveredField&&hoveredField.page===page&&hoveredField.id!==active?.id&&<div className="u-source-hover" style={{left:hoveredField.box[0]*100+'%',top:hoveredField.box[1]*100+'%',width:hoveredField.box[2]*100+'%',height:hoveredField.box[3]*100+'%'}}><span>{hoveredField.label}</span></div>}{active&&active.page===page&&<div ref={highlight} className="u-source-highlight" style={{left:active.box[0]*100+'%',top:active.box[1]*100+'%',width:active.box[2]*100+'%',height:active.box[3]*100+'%'}}><span>{active.label}</span></div>}</div></div>{sourceOptions.length>1?<div className="u-source-options"><span><ScanLine size={14}/>{sourceOptions.length} fields share this source</span><div>{sourceOptions.map(id=>{const f=record.fields.find(field=>field.id===id)!;return <button key={id} className={selected===id?'active':''} onClick={()=>{select(f,true);setSourceOptions([])}}>Select {f.label}</button>})}</div></div>:<div className="u-doc-note"><ScanLine size={14}/>Click a mapped value to select its field · source areas are approximate</div>}</section>
    <section className="u-fields-panel"><div className="u-doc-toolbar"><span><CheckCheck size={17}/>Extracted structured data</span><span className="u-badge neutral">U1-15</span></div><div className="u-section-select"><label>Section<select aria-label="Review section" value={section} onChange={e=>{const f=record.fields.find(f=>f.section===e.target.value);if(f)select(f)}}>{sections.map((s,i)=><option key={s} value={s}>{String(i+1).padStart(2,'0')} · {s} ({record.fields.filter(f=>f.section===s&&!resolved(f)).length} remaining)</option>)}</select></label><label>Show<select aria-label="Field filter" value={filter} onChange={e=>{setFilter(e.target.value);if(e.target.value==='Needs review'){const f=record.fields.find(f=>f.section===section&&!resolved(f));setSelected(f?.id||'');if(f)setPage(f.page)}}}><option>All fields</option><option>Needs review</option></select></label></div><div className="u-field-scroll" ref={fieldPane}><div className="u-section-heading"><h2>{section}</h2><span>{record.fields.filter(f=>f.section===section&&resolved(f)).length} / {record.fields.filter(f=>f.section===section).length} reviewed</span></div>
      <div className="u-section-batch"><button disabled={busy||locked||!record.fields.some(f=>f.section===section&&f.status==='High Confidence')} onClick={()=>onPatch({action:'batch',section,kind:'high'})}><CheckCheck size={14}/>Confirm high confidence in section</button><button disabled={busy||locked||!record.fields.some(f=>f.section===section&&/^N\/?A$/i.test(f.value)&&!resolved(f))} onClick={()=>onPatch({action:'batch',section,kind:'na'})}>Accept detected N/A</button></div>
      {plain.map(f=><article key={f.id} data-field-id={f.id} className={`u-field ${selected===f.id?'selected':''}`}><button className="u-field-summary" onClick={()=>select(f)}><span><b>{f.label}</b><code className={!f.value?'missing':''}>{f.value||'Not detected'}</code></span><span><Status status={f.status}/><small>{f.confidence?`${f.confidence}% OCR confidence`:'Human input needed'}</small></span></button>{selected===f.id&&<FieldEditor field={f} locked={locked} busy={busy} onSave={save}/>}</article>)}
      {tables.map(table=>{const fs=fields.filter(f=>f.table===table),rows=[...new Set(fs.map(f=>f.row!))],cols=[...new Set(fs.map(f=>f.label))];return <div className="u-review-table" key={table}><h3>{table}<small>Select a cell to inspect and edit its source.</small></h3><div className="u-table-scroll"><table><thead><tr><th>Row</th>{cols.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{rows.map(row=><tr key={row}><td>{row}</td>{cols.map(col=>{const f=fs.find(f=>f.row===row&&f.label===col);return <td key={col}>{f&&<button data-field-id={f.id} className={`u-table-cell ${resolved(f)?'verified':'pending'} ${selected===f.id?'active':''}`} onClick={()=>select(f)} aria-label={`${table} row ${row} ${col}: ${f.value||'Not detected'}`}><span>{f.value||'—'}</span>{resolved(f)?<Check size={11}/>:<span className="u-cell-dot"/>}</button>}</td>})}</tr>)}</tbody></table></div>{active?.table===table&&<div className="u-table-editor"><div className="u-card-head"><span>Row {active.row} · {active.label}<small className="u-cell-confidence">{active.confidence?`${active.confidence}% OCR confidence`:'Human input needed'}</small></span><Status status={active.status}/></div><FieldEditor field={active} locked={locked} busy={busy} onSave={save}/></div>}</div>})}
      {!fields.length&&<div className="u-empty"><CheckCheck/><h3>This section is reviewed</h3><p>Select the next section to continue.</p><button className="u-btn" disabled={done===record.fields.length} onClick={nextReview}>Continue to next review item<ChevronRight size={15}/></button></div>}
      <div className="u-review-hint">OCR confidence is an estimate. Confirm values against the document; resolve redacted or blank fields explicitly.</div>
    </div><div className="u-field-nav"><button className="u-btn small" disabled={!selected||selected===navigable[0]?.id} onClick={()=>step(-1)}><ChevronLeft size={15}/>Previous field</button><span>{record.fields.findIndex(f=>f.id===selected)+1} / {record.fields.length}</span><button className="u-btn small" disabled={!navigable.length||selected===navigable.at(-1)?.id} onClick={()=>step(1)}>Next field<ChevronRight size={15}/></button></div></section></div>
  </>
}
function FileIcon(){return <ScanLine size={17}/>}


