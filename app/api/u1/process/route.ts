import { extract } from '@/lib/u1/engine.mjs'
import { getRecord, saveRecord } from '@/lib/u1/storage.mjs'

export const runtime = 'nodejs'
export const maxDuration = 300
const running=new Set<string>()
const runExtraction=extract as unknown as (
  pages:unknown[],
  progress:(event:Record<string,unknown>)=>void,
  signal:AbortSignal,
)=>Promise<{fields:unknown[]}>

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
        let disconnected=false
        const send=(event:Record<string,unknown>)=>{
          if(!disconnected)try{controller.enqueue(encoder.encode(JSON.stringify(event)+'\n'))}catch{disconnected=true}
        }
        void (async()=>{
          const abort=new AbortController()
          const timer=setTimeout(()=>abort.abort(new Error('OCR timed out. Try clearer images.')),240000)
          try {
            // Keep OCR inside the packaged Next.js Function. A standalone
            // child cannot resolve Vercel's hashed external package aliases.
            const {fields}=await runExtraction(record.pages,event=>send(event),abort.signal)
            record.fields=fields;record.status='Review Required';record.updated=new Date().toISOString()
            record.history.push({id:crypto.randomUUID(),field:'Document',before:'Captured',after:'Review Required',reviewer:'Local OCR',at:record.updated,status:'Extracted'})
            await saveRecord(record)
            send({stage:'complete',message:'Ready for engineering review',record})
          } catch(error) {
            try{record.status='Captured';record.updated=new Date().toISOString();await saveRecord(record)}catch{}
            send({stage:'error',message:error instanceof Error?error.message:'Processing failed. Check page order and image clarity, then retry.'})
          } finally {
            clearTimeout(timer);running.delete(id)
            if(!disconnected)try{controller.close()}catch{}
          }
        })()
      },
    })
    return new Response(stream,{headers:{'Content-Type':'application/x-ndjson','Cache-Control':'no-store','X-Accel-Buffering':'no'}})
  } catch(error) {running.delete(id);return Response.json({error:error instanceof Error?error.message:'Unable to process document'},{status:400})}
}
