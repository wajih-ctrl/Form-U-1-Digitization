"use client"
import * as React from "react"
import { canAssess } from "@/lib/permissions"
import { toast } from "sonner"
import { useAppState } from "@/lib/store"
import type { AssessmentRecord, Change } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

export function EditAssessment({ changeId, teamKey, record }: { changeId: string; teamKey: keyof Change["assessments"]; record: AssessmentRecord }) {
  const { role, changes, updateAssessment } = useAppState()
  const [open, setOpen] = React.useState(false)
  const [text, setText] = React.useState(record.assessment)
  const change = changes.find(c => c.id === changeId)
  const [impact, setImpact] = React.useState(String(teamKey === "commercial" ? change?.combinedImpact.cost ?? 0 : change?.combinedImpact.scheduleDays ?? 0))
  const locked = ["approved", "rejected"].includes(changes.find(c => c.id === changeId)?.status ?? "")
  if (locked || !canAssess(role, teamKey)) return null
  return <>
    <Button variant="outline" className="self-start" onClick={() => { setText(record.assessment); setOpen(true) }}>Update Assessment</Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>{record.team} assessment</DialogTitle><DialogDescription>Record your findings. Completing all assessments makes this change ready for a PM decision.</DialogDescription></DialogHeader><Label htmlFor="assessment-note">Findings and recommendation *</Label><Textarea id="assessment-note" rows={6} value={text} onChange={e => setText(e.target.value)} />{["commercial", "operations"].includes(teamKey) && <div className="space-y-2"><Label htmlFor="assessment-impact">{teamKey === "commercial" ? "Mock additional cost (USD)" : "Mock execution impact (days)"}</Label><Input id="assessment-impact" type="number" min="0" step={teamKey === "operations" ? "1" : "0.01"} value={impact} onChange={e => setImpact(e.target.value)} /></div>}<DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!text.trim() || !impact.trim() || !Number.isFinite(Number(impact)) || Number(impact) < 0} onClick={() => { updateAssessment(changeId, teamKey, text.trim(), Number(impact)); setOpen(false); toast.success("Assessment completed", { description: `${record.team} findings have been saved.` }) }}>Complete Assessment</Button></DialogFooter></DialogContent></Dialog>
  </>
}
