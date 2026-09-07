"use client"
import * as React from "react"
import { toast } from "sonner"
import { useAppState } from "@/lib/store"
import type { AssessmentRecord, Change } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

export function EditAssessment({ changeId, teamKey, record }: { changeId: string; teamKey: keyof Change["assessments"]; record: AssessmentRecord }) {
  const { role, changes, updateAssessment } = useAppState()
  const [open, setOpen] = React.useState(false)
  const [text, setText] = React.useState(record.assessment)
  const locked = ["approved", "rejected"].includes(changes.find(c => c.id === changeId)?.status ?? "")
  if (locked || ![teamKey, "project-manager", "admin"].includes(role)) return null
  return <>
    <Button variant="outline" className="self-start" onClick={() => { setText(record.assessment); setOpen(true) }}>Update Assessment</Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>{record.team} assessment</DialogTitle><DialogDescription>Record your findings. Completing all assessments makes this change ready for a PM decision.</DialogDescription></DialogHeader><Label htmlFor="assessment-note">Findings and recommendation *</Label><Textarea id="assessment-note" rows={6} value={text} onChange={e => setText(e.target.value)} /><DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!text.trim()} onClick={() => { updateAssessment(changeId, teamKey, text.trim()); setOpen(false); toast.success("Assessment completed", { description: `${record.team} findings have been saved.` }) }}>Complete Assessment</Button></DialogFooter></DialogContent></Dialog>
  </>
}
