"use client"
import * as React from "react"
import Link from "next/link"
import { CheckCircle2, CircleDashed } from "lucide-react"
import { toast } from "sonner"
import { useAppState } from "@/lib/store"
import { canRecordExternal } from "@/lib/permissions"
import { CLOSEOUT_STEPS, canCompleteStep } from "@/lib/completion"
import { PageHeader } from "@/components/shared/page-header"
import { MetricStat } from "@/components/shared/metric-stat"
import { PersonChip } from "@/components/shared/person-chip"
import { StatusChip } from "@/components/shared/status-chip"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

export default function CompletionWorkflow() {
  const state = useAppState()
  const [active, setActive] = React.useState<(typeof CLOSEOUT_STEPS)[number] | null>(null)
  const [note, setNote] = React.useState("")
  const openIssues = state.issues.filter(i => i.status !== "resolved").length
  const openActions = state.actions.filter(a => a.status !== "complete").length
  const prerequisites = [
    { label: "Technical Activities Complete", done: state.technicalStages.every(s => s.status === "completed"), href: "/technical", detail: `${state.technicalStages.filter(s => s.status !== "completed").length} stages remaining`, owner: "Technical / Lab" },
    { label: "Field Execution Complete", done: state.milestones.find(m => m.name === "Field Execution")?.status === "completed", href: "/timeline", detail: "Operations records field progress in the timeline", owner: "Operations" },
    { label: "Outstanding Issues", done: openIssues === 0, href: "/issues", detail: `${openIssues} issues remaining`, owner: "Project Manager / responsible teams" },
    { label: "Outstanding Actions", done: openActions === 0, href: "/actions", detail: `${openActions} actions remaining`, owner: "Project Manager / responsible teams" },
  ]
  const count = prerequisites.filter(p => p.done).length + Object.keys(state.completionRecords).length
  return <div className="space-y-6">
    <PageHeader title="Completion & Client Validation" description="Specialist completion, external client validation, and formal project closeout. Each step records its owner and evidence." />
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4"><MetricStat label="Overall Completion" value={`${Math.round(count/10*100)}%`} /><MetricStat label="Outstanding Issues" value={openIssues} tone={openIssues ? "warning" : "success"} /><MetricStat label="Outstanding Actions" value={openActions} tone={openActions ? "warning" : "success"} /><MetricStat label="Steps Complete" value={`${count} / 10`} /></div>
    <Card className="gap-0 py-0"><ol className="divide-y divide-border">
      {prerequisites.map(p => <li key={p.label} className="flex flex-wrap items-start justify-between gap-4 p-5"><div className="flex gap-3">{p.done ? <CheckCircle2 className="mt-1 size-5 shrink-0 text-success-foreground" /> : <CircleDashed className="mt-1 size-5 shrink-0 text-muted-foreground" />}<div><h2 className="font-semibold">{p.label}</h2><p className="text-sm text-muted-foreground">{p.detail}</p><p className="mt-1 text-xs text-muted-foreground">Owner: {p.owner}</p></div></div><Button variant="outline" render={<Link href={p.href} />}>{p.done ? "View Record" : "Review Work"}</Button></li>)}
      {CLOSEOUT_STEPS.map(step => {
        const done = !!state.completionRecords[step.id]
        const ready = canCompleteStep(step.id, state.completionRecords, state.technicalStages, state.milestones, state.issues, state.actions)
        const allowed = canRecordExternal(state.role, step.team)
        return <li key={step.id} className="flex flex-col justify-between gap-4 p-5 sm:flex-row"><div className="flex min-w-0 gap-3">{done ? <CheckCircle2 className="mt-1 size-5 shrink-0 text-success-foreground" /> : <CircleDashed className="mt-1 size-5 shrink-0 text-muted-foreground" />}<div className="space-y-2"><h2 className="font-semibold">{step.label}</h2><p className="max-w-2xl text-sm text-muted-foreground">{done ? state.completionRecords[step.id] : step.note}</p><p className="text-xs text-muted-foreground">Dependency: {step.dependency}</p><PersonChip personId={step.person} /></div></div><div className="flex shrink-0 flex-col items-start gap-3 sm:items-end"><StatusChip label={done ? "Complete" : ready ? "Ready for review" : "Waiting on dependency"} tone={done ? "success" : ready ? "info" : "neutral"} />{!done && allowed && <Button size="sm" disabled={!ready} onClick={() => {setNote("");setActive(step)}}>{step.team === "Client" ? "Record Client Confirmation" : "Record Completion"}</Button>}{!done && !allowed && <span className="text-xs text-muted-foreground">Recorded by {step.team === "Client" ? "Project Manager" : step.team}</span>}{done && <Link className="text-sm text-primary hover:underline" href="/documents">View supporting record</Link>}</div></li>
      })}
    </ol></Card>
    <Dialog open={!!active} onOpenChange={o => !o && setActive(null)}><DialogContent><DialogHeader><DialogTitle>{active?.label}</DialogTitle><DialogDescription>Record the confirmation received and its supporting reference. All records are mocked for this prototype.</DialogDescription></DialogHeader><Label htmlFor="closeout-note">Confirmation / reference *</Label><Textarea id="closeout-note" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Client validation received; reference CV-2026-01." /><DialogFooter><Button variant="outline" onClick={() => setActive(null)}>Cancel</Button><Button disabled={!note.trim()} onClick={() => {if(active){state.completeCloseout(active.id,note);toast.success(`${active.label} recorded`);setActive(null)}}}>Confirm Completion</Button></DialogFooter></DialogContent></Dialog>
  </div>
}
