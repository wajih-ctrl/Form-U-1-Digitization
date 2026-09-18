export type FieldStatus = 'High Confidence' | 'Review Required' | 'Verified' | 'Corrected' | 'Not Detected' | 'N/A'
export type FieldRequirement = 'required' | 'optional' | 'ignored'
export type SourceBox = [number, number, number, number]
export interface UField { id: string; label: string; section: string; table?: string; row?: number; value: string; original: string; confidence: number; status: FieldStatus; page: number; box: SourceBox; importance?: 'Key engineering' | 'Standard'; requirement?: FieldRequirement; lowConfidenceReason?: string }
export interface UPage { id: string; url: string; name: string; width: number; height: number }
export interface Audit { id: string; field: string; before: string; after: string; reviewer: string; at: string; status: string }
export interface URecord { id: string; name: string; created: string; updated: string; status: 'Captured' | 'Processing' | 'Review Required' | 'In Review' | 'Approved' | 'Database Ready'; pages: UPage[]; fields: UField[]; history: Audit[]; reviewer: string; approvedAt?: string; databaseReceipt?: string; fieldPolicies?: Record<string,FieldRequirement> }
export const resolved = (f: UField) => ['Verified', 'Corrected', 'N/A'].includes(f.status)
export const fieldValue = (r: URecord, id: string) => r.fields.find(f => f.id === id)?.value || '—'
export function formSection(f: UField): { number: number; title: string; table?: string } {
  const id=f.id
  if(id==='manufacturer'||id==='manufacturerAddress')return {number:1,title:'Manufacturer'}
  if(id==='purchaser'||id==='purchaserAddress')return {number:2,title:'Purchaser'}
  if(id==='installation')return {number:3,title:'Installation'}
  if(/^(orientation|vesselType|serial|crn|drawing|nationalBoard|year)$/.test(id))return {number:4,title:'Vessel identification'}
  if(/^(asme|edition|codeCase|specialService)$/.test(id))return {number:5,title:'Code information'}
  if(id.startsWith('shell.')||id.startsWith('bodyFlange.'))return {number:6,title:'Shell and body flanges',table:f.table?(id.startsWith('shell.')?'Table 1 · Shell courses':'Table 2 · Body flanges on shells'):undefined}
  if(id.startsWith('head.')||id.startsWith('headFlange.'))return {number:7,title:'Heads and body flanges',table:f.table?(id.startsWith('head.')?'Table 1 · Heads':'Table 2 · Body flanges on heads'):undefined}
  if(id.startsWith('jacket.'))return {number:8,title:'Jacket'}
  if(id.startsWith('design.'))return {number:id.includes('impact')?10:id.includes('test')||id.endsWith('.proof')?11:9,title:id.includes('impact')?'Impact test':id.includes('test')||id.endsWith('.proof')?'Pressure test':'Pressure and design'}
  if(id.startsWith('tubesheet.'))return {number:12,title:'Tubesheet',table:f.table}
  if(id.startsWith('tube.'))return {number:13,title:'Tubes',table:f.table}
  if(id.startsWith('inner.')||id.startsWith('innerFlange.'))return {number:14,title:'Inner chamber shell and body flanges',table:f.table?(id.startsWith('inner.')?'Table 1 · Shell courses':'Table 2 · Body flanges on shells'):undefined}
  if(id.startsWith('innerHead.')||id.startsWith('innerHeadFlange.'))return {number:15,title:'Inner chamber heads and body flanges',table:f.table?(id.startsWith('innerHead.')?'Table 1 · Heads':'Table 2 · Body flanges on heads'):undefined}
  if(id.startsWith('innerDesign.'))return {number:id.includes('impact')?17:id.includes('test')||id.endsWith('.proof')?18:16,title:id.includes('impact')?'Inner chamber impact test':id.includes('test')||id.endsWith('.proof')?'Inner chamber pressure test':'Inner chamber pressure and design'}
  if(id.startsWith('nozzle.'))return {number:19,title:'Nozzles, inspection and safety valve openings',table:'Nozzles / openings'}
  if(id.startsWith('supports.'))return {number:20,title:'Supports'}
  if(id==='notes')return {number:21,title:'Supporting reports'}
  if(id==='remarks'||id.startsWith('remarks.'))return {number:22,title:'Remarks',table:f.table}
  return {number:23,title:'Certification',table:f.table}
}
export function exportFieldPath(f: UField): string[] {
  if(f.id.startsWith('nozzle.')){
    const key=f.id.split('.').at(-1)
    if(key==='flangeMaterial')return ['Flange','Material']
    if(key==='reinforcement')return ['Reinforcement','Type']
    if(key==='attachmentDetails')return ['Reinforcement','Nozzle / flange attachment details']
    if(key==='type')return ['Flange','Type']
    if(key==='location')return ['Nozzle','Location']
    if(key==='material')return ['Nozzle','Material']
    if(key==='size')return ['Nozzle','Diameter / size']
    if(key==='thickness')return ['Nozzle','Thickness']
    if(key==='corrosion')return ['Nozzle','Corrosion allowance']
    return ['Nozzle',f.label]
  }
  return [f.label]
}
export function exportRecord(r: URecord) {
  const included=r.fields.filter(f=>(r.fieldPolicies?.[f.id]??f.requirement??'optional')!=='ignored')
  const sections: Record<string,{number:number;title:string;fields:Record<string,string>;tables:Record<string,Array<Record<string,unknown>>>}>={}
  for(const f of included){
    const info=formSection(f),key=`Section ${info.number}`
    const group=sections[key]??={number:info.number,title:info.title,fields:{},tables:{}}
    if(info.table&&f.row){
      const rows=group.tables[info.table]??=[]
      const row=rows[f.row-1]??={row:f.row}
      const path=exportFieldPath(f)
      let target=row
      for(const part of path.slice(0,-1))target=(target[part]??={}) as Record<string,unknown>
      target[path.at(-1)!]=f.value
    }else group.fields[f.label]=f.value
  }
  const ordered=Object.fromEntries(Object.entries(sections).sort((a,b)=>a[1].number-b[1].number))
  return { recordId: r.id, formType: 'U-1', supportedLayout: 'U1-15', status: r.status, reviewer: r.reviewer, approvedAt: r.approvedAt, sections:ordered, reviewHistory: r.history, provenance: included.map(({id, page, box, confidence, original, status, importance, requirement, lowConfidenceReason}) => ({id, page, box, confidence, original, status, importance, requirement:r.fieldPolicies?.[id]??requirement??'optional',lowConfidenceReason})) }
}

/** A readable outline that keeps form relationships visible in a spreadsheet. */
export function exportCsvOutline(r: URecord): string[][] {
  const rows: string[][] = [['Level','Form hierarchy','Value','Review status','OCR confidence','Source page']]
  const included=r.fields.filter(f=>(r.fieldPolicies?.[f.id]??f.requirement??'optional')!=='ignored')
  const sections=new Map<number,{title:string;fields:UField[]}>()
  for(const field of included){
    const info=formSection(field)
    const section=sections.get(info.number)??{title:info.title,fields:[]}
    section.fields.push(field)
    sections.set(info.number,section)
  }
  const heading=(level:string,depth:number,label:string)=>rows.push([level,'  '.repeat(depth)+label,'','','',''])
  const value=(depth:number,label:string,field:UField)=>rows.push(['Field','  '.repeat(depth)+label,field.value,field.status,String(field.confidence),String(field.page)])
  for(const [number,section] of [...sections].sort((a,b)=>a[0]-b[0])){
    heading('Section',0,`Section ${number} · ${section.title}`)
    for(const field of section.fields.filter(f=>!formSection(f).table||!f.row))value(1,field.label,field)
    const tables=new Map<string,UField[]>()
    for(const field of section.fields){
      const info=formSection(field)
      if(!info.table||!field.row)continue
      const fields=tables.get(info.table)??[]
      fields.push(field)
      tables.set(info.table,fields)
    }
    for(const [table,fields] of tables){
      heading('Table',1,table)
      const byRow=new Map<number,UField[]>()
      for(const field of fields){const cells=byRow.get(field.row!)??[];cells.push(field);byRow.set(field.row!,cells)}
      for(const [row,cells] of [...byRow].sort((a,b)=>a[0]-b[0])){
        heading('Row',2,`Row ${row}`)
        for(const field of cells.filter(f=>exportFieldPath(f).length===1))value(3,exportFieldPath(field)[0],field)
        const components=new Map<string,UField[]>()
        for(const field of cells){
          const path=exportFieldPath(field)
          if(path.length<2)continue
          const group=components.get(path[0])??[]
          group.push(field)
          components.set(path[0],group)
        }
        const order=['Nozzle','Reinforcement','Flange']
        for(const [component,group] of [...components].sort((a,b)=>{
          const left=order.indexOf(a[0]),right=order.indexOf(b[0])
          return (left<0?order.length:left)-(right<0?order.length:right)
        })){
          heading('Component',3,component)
          for(const field of group)value(4,exportFieldPath(field).slice(1).join(' / '),field)
        }
      }
    }
  }
  return rows
}
