"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { AddRecord } from "@/components/shared/add-record"
import Link from "next/link"
import { FileText, Search } from "lucide-react"
import { useAppState, formatLong } from "@/lib/store"
import { PageHeader } from "@/components/shared/page-header"
import { StatusChip } from "@/components/shared/status-chip"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { documentStatusMeta } from "@/lib/status-meta"
import type { DocumentRecord } from "@/lib/types"

export default function DocumentsPage() {
  const { documents } = useAppState()
  const [search, setSearch] = React.useState("")
  const [preview, setPreview] = React.useState<DocumentRecord | null>(null)

  const searchParams = useSearchParams()
  React.useEffect(() => { const id = searchParams.get("record"); if (id) setPreview(documents.find(d => d.id === id) ?? null) }, [documents, searchParams])

  const filtered = documents.filter((d) => `${d.name} ${d.type} ${d.stage}`.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader actions={<AddRecord />} title="Documents & Technical Records" description="Register of technical, commercial, and change-related project documentation." />

      <Card className="p-4">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search documents…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </Card>

      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Document</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Added By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Project Stage</TableHead>
              <TableHead>Related</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((doc) => {
              const meta = documentStatusMeta(doc.status)
              return (
                <TableRow key={doc.id}>
                  <TableCell className="max-w-[260px]">
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate font-medium text-foreground">{doc.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{doc.type}</TableCell>
                  <TableCell className="text-muted-foreground">{doc.addedBy}</TableCell>
                  <TableCell className="text-muted-foreground">{formatLong(doc.date)}</TableCell>
                  <TableCell className="text-muted-foreground">{doc.stage}</TableCell>
                  <TableCell>
                    {doc.relatedId ? (
                      <Link href={`/changes/${doc.relatedId}`} className="text-primary hover:underline">
                        {doc.relatedLabel}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusChip label={meta.label} tone={meta.tone} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => setPreview(doc)}>
                      Preview
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
            {filtered.length === 0 && <TableRow><TableCell colSpan={8} className="py-12 text-center text-muted-foreground">No documents match your search. Try a different name or clear the search field.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="sm:max-w-lg">
          {preview && (
            <>
              <DialogHeader>
                <DialogTitle>{preview.name}</DialogTitle>
                <DialogDescription>
                  {preview.type} · Added by {preview.addedBy} on {formatLong(preview.date)}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <span className="text-sm font-medium text-foreground">Status</span>
                  <StatusChip label={documentStatusMeta(preview.status).label} tone={documentStatusMeta(preview.status).tone} />
                </div>
                <div className="rounded-lg border border-border bg-muted/40 p-4">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Document Summary</p>
                  <p className="text-sm leading-relaxed text-foreground">{preview.summary}</p>
                </div>
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                  This sample record contains a summary only. No source file is attached.
                </div>
              </div>
              <DialogFooter>
                {preview.relatedId && (
                  <Button variant="outline" render={<Link href={`/changes/${preview.relatedId}`} />}>
                    View {preview.relatedLabel}
                  </Button>
                )}
                <Button onClick={() => setPreview(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
