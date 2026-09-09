import { readFile } from 'node:fs/promises'
import { pagePath } from '@/lib/u1/engine.mjs'
export const runtime = 'nodejs'
export async function GET(_: Request, context: {params:Promise<{id:string}>}) {
  try { const {id}=await context.params; return new Response(await readFile(pagePath(id)),{headers:{'Content-Type':'image/png','Cache-Control':'private, max-age=3600'}}) }
  catch {return new Response('Page not found',{status:404})}
}
