import { listRecords, getPage, saveRecord } from '@/lib/u1/storage.mjs'
import type { URecord } from '@/lib/u1/types'
export const runtime = 'nodejs'
export async function GET() {
  try {return Response.json({records:await listRecords()},{headers:{'Cache-Control':'no-store'}})}
  catch(error){return Response.json({error:error instanceof Error?error.message:'Unable to load records'},{status:503})}
}
export async function POST(request: Request) {
  try {
    const body=await request.json()
    if(!Array.isArray(body.pages)||body.pages.length!==3) throw new Error('Exactly three pages are required.')
    for(const page of body.pages) {
      if(!/^[a-f0-9-]{36}$/.test(page.id)) throw new Error('Invalid page.')
      await getPage(page.id)
    }
    const now=new Date().toISOString()
    const record:URecord={id:`U1-${crypto.randomUUID().slice(0,8).toUpperCase()}`,name:String(body.name||'Untitled Form U-1').slice(0,140),pages:body.pages,created:now,updated:now,status:'Captured',fields:[],history:[],reviewer:'Prototype Engineer'}
    await saveRecord(record)
    return Response.json({record})
  } catch(error) {return Response.json({error:error instanceof Error?error.message:'Unable to create record'},{status:400})}
}
