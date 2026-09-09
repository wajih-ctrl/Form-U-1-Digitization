import { getRecord, saveRecord } from '@/lib/u1/engine.mjs'
import { resolved, type URecord, type FieldStatus } from '@/lib/u1/types'
export const runtime = 'nodejs'
const locks=new Set<string>()
export async function PATCH(request: Request, context:{params:Promise<{id:string}>}) {
  const {id}=await context.params
  if(locks.has(id)) return Response.json({error:'A change is already being saved. Please retry.'},{status:409})
  locks.add(id)
  try {
    const record:URecord=await getRecord(id),body=await request.json(),now=new Date().toISOString()
    const reviewer=String(body.reviewer||record.reviewer).trim().slice(0,100)
    if(!reviewer) throw new Error('Enter a reviewer name.')
    if(body.action==='field') {
      if(['Approved','Database Ready'].includes(record.status)) throw new Error('Reopen the record before changing an approved field.')
      const field=record.fields.find(f=>f.id===body.fieldId)
      if(!field) throw new Error('Field not found.')
      const status=body.status as FieldStatus
      if(!['Verified','Corrected','Review Required','N/A'].includes(status)) throw new Error('Invalid review action.')
      const value=status==='N/A'?'N/A':String(body.value??field.value).trim().slice(0,5000)
      if(['Verified','Corrected'].includes(status)&&!value) throw new Error('Enter a value or explicitly mark this field N/A.')
      const finalStatus=status==='Verified'&&value!==field.original?'Corrected':status
      record.history.push({id:crypto.randomUUID(),field:field.id,before:field.value,after:value,reviewer,at:now,status:finalStatus})
      field.value=value; field.status=finalStatus; record.status='In Review'
    } else if(body.action==='batch') {
      if(['Approved','Database Ready'].includes(record.status)) throw new Error('Reopen the record before editing.')
      if(!['high','na'].includes(body.kind)) throw new Error('Unknown batch action.')
      const candidates=record.fields.filter(f=>f.section===body.section&&(body.kind==='high'?f.status==='High Confidence':/^N\/?A$/i.test(f.value)&&!resolved(f)))
      for(const field of candidates) {
        const status=body.kind==='na'?'N/A':'Verified'
        record.history.push({id:crypto.randomUUID(),field:field.id,before:field.value,after:field.value,reviewer,at:now,status})
        field.status=status
      }
      record.status='In Review'
    } else if(body.action==='approve') {
      if(!record.fields.length||record.fields.some(f=>!resolved(f))) throw new Error('Resolve every unconfirmed, flagged and missing field before approval.')
      if(['Approved','Database Ready'].includes(record.status)) throw new Error('This record is already approved.')
      record.status='Approved';record.approvedAt=now
      record.history.push({id:crypto.randomUUID(),field:'Record',before:'In Review',after:'Approved · Ready for Database Entry',reviewer,at:now,status:'Approved'})
    } else if(body.action==='database') {
      if(!['Approved','Database Ready'].includes(record.status)) throw new Error('Approve the record before sending it to the database.')
      record.status='Database Ready';record.databaseReceipt=`SIM-${crypto.randomUUID().slice(0,8)}`
      record.history.push({id:crypto.randomUUID(),field:'Record',before:'Approved',after:record.databaseReceipt,reviewer,at:now,status:'Simulated database handoff'})
    } else if(body.action==='reopen') {
      if(!['Approved','Database Ready'].includes(record.status)) throw new Error('Only approved records can be reopened.')
      record.history.push({id:crypto.randomUUID(),field:'Record',before:record.status,after:'In Review',reviewer,at:now,status:'Approval revoked'})
      record.status='In Review';delete record.approvedAt;delete record.databaseReceipt
    } else throw new Error('Unknown action.')
    record.reviewer=reviewer;record.updated=now;await saveRecord(record)
    return Response.json({record})
  } catch(error) {return Response.json({error:error instanceof Error?error.message:'Unable to save review'},{status:400})}
  finally {locks.delete(id)}
}
