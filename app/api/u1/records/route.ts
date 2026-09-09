import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { dataDir, saveRecord } from '@/lib/u1/engine.mjs'
import type { URecord } from '@/lib/u1/types'
export const runtime = 'nodejs'
export async function GET() {
  const dir=path.join(dataDir,'records')
  const files=await readdir(dir).catch(()=>[])
  const records=await Promise.all(files.filter(f=>f.endsWith('.json')).map(async f=>JSON.parse(await readFile(path.join(dir,f),'utf8'))))
  return Response.json({records:records.sort((a,b)=>b.updated.localeCompare(a.updated))},{headers:{'Cache-Control':'no-store'}})
}
export async function POST(request: Request) {
  try {
    const body=await request.json()
    if(!Array.isArray(body.pages)||body.pages.length!==3) throw new Error('Exactly three pages are required.')
    for(const page of body.pages) {
      if(!/^[a-f0-9-]{36}$/.test(page.id)) throw new Error('Invalid page.')
      await readFile(path.join(dataDir,'pages',`${page.id}.png`))
    }
    const now=new Date().toISOString()
    const record:URecord={id:`U1-${crypto.randomUUID().slice(0,8).toUpperCase()}`,name:String(body.name||'Untitled Form U-1').slice(0,140),pages:body.pages,created:now,updated:now,status:'Captured',fields:[],history:[],reviewer:'Prototype Engineer'}
    await saveRecord(record)
    return Response.json({record})
  } catch(error) {return Response.json({error:error instanceof Error?error.message:'Unable to create record'},{status:400})}
}
