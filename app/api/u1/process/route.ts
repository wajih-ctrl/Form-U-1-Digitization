import { spawn } from 'node:child_process'
import path from 'node:path'
// The child script loads this module outside Next's module graph. Import it
// here as well so deployment tracing includes its native/OCR dependencies.
import '@/lib/u1/engine.mjs'
import { getRecord, saveRecord } from '@/lib/u1/storage.mjs'
export const runtime = 'nodejs'
export const maxDuration = 300
const running=new Set<string>()
export async function POST(request: Request) {
  const {id}=await request.json()
  if(running.has(id)) return Response.json({error:'This record is already processing.'},{status:409})
  try {
    const record=await getRecord(id)
    if(record.fields.length) return Response.json({error:'This record has already been extracted. Create a new form to process new pages.'},{status:400})
    running.add(id); record.status='Processing';await saveRecord(record)
    const encoder=new TextEncoder()
    const stream=new ReadableStream({
      start(controller) {
        let disconnected=false,errors=''
        const send=(data:string)=>{if(!disconnected)try{controller.enqueue(encoder.encode(data))}catch{disconnected=true}}
        const oidcToken=request.headers.get('x-vercel-oidc-token')
        const child=spawn(process.execPath,[path.join(process.cwd(),'scripts/u1-process.mjs'),id],{
          cwd:process.cwd(),windowsHide:true,stdio:['ignore','pipe','pipe'],
          env:{...process.env,...(oidcToken?{VERCEL_OIDC_TOKEN:oidcToken}:{})},
        })
        const timer=setTimeout(()=>{errors='OCR timed out. Try clearer images.';child.kill()},240000)
        child.stdout.on('data',chunk=>send(chunk.toString()))
        child.stderr.on('data',chunk=>{errors+=chunk.toString()})
        child.on('error',error=>{errors=error.message})
        child.on('close',async code=>{
          clearTimeout(timer);running.delete(id)
          if(code!==0) {
            try {const current=await getRecord(id);current.status='Captured';await saveRecord(current)}
            catch {errors+=' Unable to save the failed processing state.'}
            send(JSON.stringify({stage:'error',message:errors||'Processing failed. Check page order and image clarity, then retry.'})+'\n')
          }
          if(!disconnected)try{controller.close()}catch{}
        })
      },
    })
    return new Response(stream,{headers:{'Content-Type':'application/x-ndjson','Cache-Control':'no-store','X-Accel-Buffering':'no'}})
  } catch(error) {running.delete(id);return Response.json({error:error instanceof Error?error.message:'Unable to process document'},{status:400})}
}
