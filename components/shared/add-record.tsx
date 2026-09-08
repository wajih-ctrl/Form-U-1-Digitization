"use client"

import * as React from "react"
import { DOCUMENT_TYPES } from "@/lib/document-types"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { canAddRecord } from "@/lib/permissions"
import { FilePlus2 } from "lucide-react"
import { toast } from "sonner"
import { useAppState } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

export function AddRecord({ stage = "General" }: { stage?: string }) {
  const { addDocument, role } = useAppState()
  const [type, setType] = React.useState("Technical Evaluation")
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [summary, setSummary] = React.useState("")
  if (!canAddRecord(role)) return null
  return <>
    <Button variant="outline" onClick={() => setOpen(true)}><FilePlus2 />Add Technical Record</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Add technical record</DialogTitle><DialogDescription>Save a written record for {stage}. It will appear in Documents.</DialogDescription></DialogHeader>
        <form onSubmit={e => { e.preventDefault(); if (!name.trim() || !summary.trim()) return; addDocument({ name: name.trim(), summary: summary.trim(), stage, type, status: "draft" }); setOpen(false); setName(""); setSummary(""); toast.success("Technical record saved", { description: "Your draft is available in Documents." }) }}>
          <div className="space-y-4 pb-5"><div className="space-y-2"><Label>Record type</Label><Select value={type} onValueChange={v => v && setType(v)}><SelectTrigger aria-label="Record type" className="w-full"><SelectValue /></SelectTrigger><SelectContent>{DOCUMENT_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="record-name">Record title *</Label><Input id="record-name" required maxLength={160} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Secondary train test results" /></div><div className="space-y-2"><Label htmlFor="record-summary">Summary *</Label><Textarea id="record-summary" required rows={5} value={summary} onChange={e => setSummary(e.target.value)} placeholder="Describe the findings and next steps…" /></div></div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={!name.trim() || !summary.trim()}>Save Record</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </>
}
