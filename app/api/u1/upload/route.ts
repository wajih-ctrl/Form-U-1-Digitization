import { prepareFile } from '@/lib/u1/engine.mjs'
export const runtime = 'nodejs'
export const maxDuration = 120
export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const files = form.getAll('files').filter((f): f is File => f instanceof File)
    if (!files.length || files.length > 3) return Response.json({error:'Select one PDF or up to three page images.'},{status:400})
    if (files.reduce((sum,f)=>sum+f.size,0)>4*1024*1024) return Response.json({error:'Upload at most 4 MB per request. Compress the PDF or send page images individually.'},{status:400})
    const pages=[]
    for(const file of files) pages.push(...await prepareFile(Buffer.from(await file.arrayBuffer()),file.name))
    if(pages.length>3) return Response.json({error:'Upload only the three pages of one Form U-1.'},{status:400})
    return Response.json({pages})
  } catch(error) { return Response.json({error:error instanceof Error?error.message:'Unable to read the file. Use PDF, JPG, PNG or WebP.'},{status:400}) }
}
