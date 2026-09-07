"use client"

import * as React from "react"
import Link from "next/link"
import { Search, ArrowUpRight } from "lucide-react"
import { useAppState } from "@/lib/store"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const { projects, changes, issues, documents, actions } = useAppState()
  React.useEffect(() => {
    const listener = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen(v => !v) } }
    window.addEventListener("keydown", listener)
    return () => window.removeEventListener("keydown", listener)
  }, [])
  const records = [
    ...projects.map(p => ({ id: p.id, title: p.name, type: "Project", href: `/projects/${p.id}` })),
    ...changes.map(c => ({ id: c.id, title: c.title, type: "Change", href: `/changes/${c.id}` })),
    ...issues.map(i => ({ id: i.id, title: i.title, type: "Issue", href: `/issues?record=${i.id}` })),
    ...documents.map(d => ({ id: d.id, title: d.name, type: "Document", href: `/documents?record=${d.id}` })),
    ...actions.map(a => ({ id: a.id, title: a.title, type: "Action", href: `/actions?search=${encodeURIComponent(a.title)}` })),
  ]
  const results = records.filter(r => `${r.id} ${r.title} ${r.type}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 12)
  return <>
    <Button variant="outline" onClick={() => setOpen(true)} className="min-w-0 justify-start text-muted-foreground" aria-label="Search workspace">
      <Search /><span className="hidden sm:inline">Search workspace</span><kbd className="ml-8 hidden text-xs lg:inline">Ctrl K</kbd>
    </Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader><DialogTitle>Search workspace</DialogTitle><DialogDescription>Find projects, changes, issues, actions, and documents.</DialogDescription></DialogHeader>
        <Input autoFocus aria-label="Search all records" placeholder="Search by name, type, or ID…" value={query} onChange={e => setQuery(e.target.value)} />
        <div className="max-h-[55dvh] overflow-y-auto" aria-live="polite">
          {results.map(r => <Link key={`${r.type}-${r.id}`} href={r.href} onClick={() => { setOpen(false); setQuery("") }} className="group flex items-center gap-3 rounded-lg p-3 hover:bg-accent focus-visible:bg-accent">
            <div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground">{r.type} · {r.id.toUpperCase()}</p><p className="text-sm font-medium">{r.title}</p></div><ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>)}
          {!results.length && <p className="py-10 text-center text-sm text-muted-foreground">No records match “{query}”. Try a shorter name or an ID.</p>}
        </div>
      </DialogContent>
    </Dialog>
  </>
}
