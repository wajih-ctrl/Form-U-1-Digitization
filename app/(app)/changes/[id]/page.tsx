"use client"

import * as React from "react"
import Link from "next/link"
import { canDecide } from "@/lib/permissions"
import { EditAssessment } from "@/components/shared/edit-assessment"
import { notFound, useParams } from "next/navigation"
import { toast } from "sonner"
import { CheckCircle2, CircleDashed, Clock } from "lucide-react"
import { cn } from "cn"
import { useAppState, formatLong, formatCurrency } from "@/lib/store"
import { PageHeader } from "@/components/shared/page-header"
import { StatusChip } from "@/components/shared/status-chip"
import { PersonBlock } from "@/components/shared/person-chip"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { changeMeta } from "@/lib/status-meta"
import type { AssessmentRecord } from "@/lib/types"

type DialogKind = "approve" | "reject" | "clarify" | "escalate" | null

export default function ChangeDetailPage() {
  const params = useParams<{ id: string }>()
  const state = useAppState()
  const change = state.changes.find((c) => c.id === params.id)
  if (!change) return notFound()

  const meta = changeMeta(change.status)
  const [dialog, setDialog] = React.useState<DialogKind>(null)
  const [note, setNote] = React.useState("")
  const [clarifyTeam, setClarifyTeam] = React.useState("Technical")
  const [escalationLevel, setEscalationLevel] = React.useState("Management Review")

  const decisionPending = ["awaiting-pm-decision", "impact-review-complete", "clarification-requested", "escalated"].includes(change.status) && canDecide(state.role) && Object.values(change.assessments).every(a => a.status === "complete")
  const allAssessmentsComplete = Object.values(change.assessments).every((a) => a.status === "complete")

  const processSteps = [
    { label: "Client Request Received", done: true },
    { label: "Technical Assessment", done: change.assessments.technical.status === "complete" },
    { label: "Procurement / Logistics Assessment", done: change.assessments.procurement.status === "complete" },
    { label: "Operations Assessment", done: change.assessments.operations.status === "complete" },
    { label: "Commercial Assessment", done: change.assessments.commercial.status === "complete" },
    { label: "PM Decision", done: ["approved", "rejected"].includes(change.status), pending: !["approved", "rejected"].includes(change.status) && allAssessmentsComplete },
  ]

  function closeAndReset() {
    setDialog(null)
    setNote("")
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${change.id.toUpperCase()} · ${change.title}`}
        description={`Source: ${change.source} · Requested ${formatLong(change.dateRequested)}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => document.getElementById("combined-impact")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Review Impact</Button>
            {change.highImpact && <StatusChip label="High Impact" tone="danger" />}
            <StatusChip label={meta.label} tone={meta.tone} />
          </div>
        }
      />

      {state.role === "project-manager" && change.id === "cr-003" && !change.reviewStarted && !["approved", "rejected"].includes(change.status) && <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-primary/20 bg-accent p-5"><div><h2 className="font-semibold">Client scope-change scenario</h2><p className="text-sm text-muted-foreground">Preview the completed impact below, or begin the specialist review to walk through each team’s work.</p></div><Button onClick={() => { state.startChangeReview(); toast.success("Specialist review opened", { description: "Switch to each specialist role to complete its assessment." }) }}>Begin Specialist Review</Button></div>}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Requested Change</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 p-4 pt-0 sm:grid-cols-2">
              <InfoBlock label="Original Scope" value={change.originalScope} />
              <InfoBlock label="Requested Change" value={change.requestedChange} />
              <InfoBlock label="Reason" value={change.reason} />
              <InfoBlock label="Requested By" value={change.requestedBy} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Impact Assessment Status</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <ol className="flex flex-col gap-0">
                {processSteps.map((step, i) => (
                  <li key={step.label} className="relative flex gap-3 pb-5 last:pb-0">
                    <div className="flex flex-col items-center">
                      <span
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-full",
                          step.done
                            ? "bg-success text-success-foreground"
                            : step.pending
                              ? "bg-warning text-warning-foreground"
                              : "bg-neutral-status text-neutral-status-foreground"
                        )}
                      >
                        {step.done ? <CheckCircle2 className="size-3.5" /> : step.pending ? <Clock className="size-3.5" /> : <CircleDashed className="size-3.5" />}
                      </span>
                      {i < processSteps.length - 1 && <span className="mt-1 h-full w-px flex-1 bg-border" />}
                    </div>
                    <div className={cn("flex flex-1 items-center justify-between", i === processSteps.length - 1 && "font-semibold")}>
                      <span className={cn("text-sm", step.done ? "text-foreground" : step.pending ? "text-warning-foreground" : "text-muted-foreground")}>
                        {step.label}
                      </span>
                      <StatusChip
                        label={step.done ? "Complete" : step.pending ? "Pending" : "Not Started"}
                        tone={step.done ? "success" : step.pending ? "warning" : "neutral"}
                      />
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <AssessmentCard title="Technical Assessment" record={change.assessments.technical} editor={<EditAssessment changeId={change.id} teamKey="technical" record={change.assessments.technical} />} />
          <AssessmentCard title="Procurement / Logistics Assessment" record={change.assessments.procurement} editor={<EditAssessment changeId={change.id} teamKey="procurement" record={change.assessments.procurement} />} />
          <AssessmentCard title="Operations Assessment" record={change.assessments.operations} editor={<EditAssessment changeId={change.id} teamKey="operations" record={change.assessments.operations} />} />
          <AssessmentCard title="Commercial Assessment" record={change.assessments.commercial} editor={<EditAssessment changeId={change.id} teamKey="commercial" record={change.assessments.commercial} />} />
        </div>

        <div className="flex flex-col gap-6">
          <Card id="combined-impact" className="scroll-mt-6 border-primary/30">
            <CardHeader>
              <CardTitle className="text-base">Combined Impact</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 p-4 pt-0">
              <div className="grid grid-cols-2 gap-3">
                <ImpactStat label="Schedule Impact" value={`+${change.combinedImpact.scheduleDays} Days`} tone="warning" />
                <ImpactStat label="Cost Exposure" value={formatCurrency(change.combinedImpact.cost)} tone="warning" />
                <ImpactStat label="Original Completion" value={formatLong(change.combinedImpact.originalCompletion)} />
                <ImpactStat label="Forecast Completion" value={formatLong(change.combinedImpact.forecastCompletion)} tone="warning" />
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">Affected Milestones</p>
                <div className="flex flex-col gap-1.5">
                  {change.affectedMilestoneIds.map(id => state.milestones.find(m => m.id === id)?.name ?? id).map((m) => (
                    <span key={m} className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-warning-foreground/20 bg-warning p-3">
                <span className="text-xs font-medium text-warning-foreground">Project Health</span>
                <span className="text-xs font-semibold text-warning-foreground">On Track → At Risk</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="text-base">Project Manager Decision</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 p-4 pt-0">
              {change.pmDecision && ["approved", "rejected"].includes(change.status) ? (
                <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground capitalize">{change.pmDecision.status.replace("-", " ")}</span>
                    <span className="text-xs text-muted-foreground">{change.pmDecision.decidedAt}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{change.pmDecision.note}</p>
                  <p className="text-xs text-muted-foreground">Decided by {change.pmDecision.decidedBy}</p>
                  {change.pmDecision.extra &&
                    Object.entries(change.pmDecision.extra).map(([k, v]) => (
                      <p key={k} className="text-xs text-muted-foreground">
                        {k}: <span className="font-medium text-foreground">{v}</span>
                      </p>
                    ))}
                </div>
              ) : (
                <>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {!["project-manager", "admin"].includes(state.role) ? "Only the Project Manager can record this project-level decision." : allAssessmentsComplete ? "Review the completed assessments and combined impact before recording your decision." : "Complete the specialist assessments before approving this change."}
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button disabled={!decisionPending} onClick={() => setDialog("approve")}>
                      Approve Change
                    </Button>
                    <Button variant="outline" disabled={!decisionPending} onClick={() => setDialog("reject")}>
                      Reject
                    </Button>
                    <Button variant="outline" disabled={!decisionPending} onClick={() => setDialog("clarify")}>
                      Request Clarification
                    </Button>
                    <Button variant="outline" disabled={!decisionPending} onClick={() => setDialog("escalate")}>
                      Escalate
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Required Actions & Linked Documents</CardTitle></CardHeader><CardContent className="space-y-4">{state.actions.filter(a => a.linkedHref === `/changes/${change.id}`).map(a => <Link key={a.id} href={`/actions?search=${encodeURIComponent(a.title)}`} className="block rounded-lg border p-3 hover:bg-accent"><p className="text-sm font-medium">{a.title}</p><p className="text-xs text-muted-foreground">{a.team} · Due {formatLong(a.dueDate)} · {a.status}</p></Link>)}{!state.actions.some(a => a.linkedHref === `/changes/${change.id}`) && <p className="text-sm text-muted-foreground">No follow-up actions assigned yet.</p>}{state.documents.filter(d => d.relatedId === change.id).map(d => <Link key={d.id} href={`/documents?record=${d.id}`} className="block text-sm text-primary hover:underline">{d.name} · {d.addedBy}</Link>)}</CardContent></Card>
        <Card><CardHeader><CardTitle>Decision & Assessment History</CardTitle></CardHeader><CardContent className="space-y-4">{state.activity.filter(a => a.event.toLowerCase().includes(change.id) || a.relatedObject?.href === `/changes/${change.id}`).map(a => <div key={a.id} className="border-l-2 border-primary/20 pl-3"><p className="text-xs text-muted-foreground">{a.timestamp} · {a.person} · {a.team}</p><p className="text-sm">{a.event}</p></div>)}{change.pmDecision && <div className="text-sm"><p className="font-medium">{change.pmDecision.decidedBy} · {change.pmDecision.decidedAt}</p><p>{change.pmDecision.note}</p></div>}</CardContent></Card>
      </div>
      <Dialog open={dialog === "approve"} onOpenChange={(o) => !o && closeAndReset()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Confirm Approval</DialogTitle>
            <DialogDescription>Review the combined impact before approving {change.id.toUpperCase()}.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/40 p-3 text-sm">
              <SummaryRow label="Change" value={`${change.id.toUpperCase()} — ${change.title}`} />
              <SummaryRow label="Cost Impact" value={formatCurrency(change.combinedImpact.cost)} />
              <SummaryRow label="Timeline Impact" value={`+${change.combinedImpact.scheduleDays} Days`} />
              <SummaryRow label="New Forecast Completion" value={formatLong(change.combinedImpact.forecastCompletion)} />
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">Affected Teams</p>
              <div className="flex flex-wrap gap-1.5">
                {["Technical", "Procurement", "Operations", "Commercial"].map((t) => (
                  <span key={t} className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="approve-note">Decision Note</Label>
              <Textarea
                id="approve-note"
                placeholder="Add context for this decision…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAndReset}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                state.approveChange(change.id, note || "Approved — combined impact reviewed and accepted.")
                toast.success("Change approved", { description: "Timeline, actions, and activity history have been updated." })
                closeAndReset()
              }}
            >
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "reject"} onOpenChange={(o) => !o && closeAndReset()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Change</DialogTitle>
            <DialogDescription>Record the reason for rejecting {change.id.toUpperCase()}.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reject-note">Reason / Decision Note *</Label>
            <Textarea id="reject-note" placeholder="Explain the rejection…" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAndReset}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!note.trim()}
              onClick={() => {
                state.rejectChange(change.id, note)
                toast.success("Change rejected", { description: "The reason has been saved in project history." })
                closeAndReset()
              }}
            >
              Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "clarify"} onOpenChange={(o) => !o && closeAndReset()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Clarification</DialogTitle>
            <DialogDescription>Send this back to a specialist team before deciding on {change.id.toUpperCase()}.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Select Team</Label>
              <Select value={clarifyTeam} onValueChange={(v) => { if (v !== null) setClarifyTeam(v) }}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Technical">Technical</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                  <SelectItem value="Procurement">Procurement</SelectItem>
                  <SelectItem value="Commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="clarify-note">Question / Clarification *</Label>
              <Textarea id="clarify-note" placeholder="What do you need clarified?" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAndReset}>
              Cancel
            </Button>
            <Button
              disabled={!note.trim()}
              onClick={() => {
                state.requestClarification(change.id, clarifyTeam, note)
                toast.success("Clarification requested", { description: `Waiting on ${clarifyTeam}.` })
                closeAndReset()
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "escalate"} onOpenChange={(o) => !o && closeAndReset()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Escalate to Management</DialogTitle>
            <DialogDescription>Raise {change.id.toUpperCase()} for management-level attention.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="escalate-reason">Escalation Reason *</Label>
              <Textarea id="escalate-reason" placeholder="Why does this need management attention?" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Management Attention Level</Label>
              <Select value={escalationLevel} onValueChange={(v) => { if (v !== null) setEscalationLevel(v) }}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Management Review">Management Review</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                  <SelectItem value="Executive Attention">Executive Attention</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAndReset}>
              Cancel
            </Button>
            <Button
              disabled={!note.trim()}
              onClick={() => {
                state.escalateChange(change.id, note, escalationLevel, note)
                toast.success("Change escalated", { description: "Visible in Management Overview." })
                closeAndReset()
              }}
            >
              Confirm Escalation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <p className="text-sm leading-relaxed text-foreground">{value}</p>
    </div>
  )
}

function ImpactStat({ label, value, tone }: { label: string; value: string; tone?: "warning" }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className={cn("text-lg font-semibold", tone === "warning" ? "text-warning-foreground" : "text-foreground")}>{value}</span>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="col-span-2 flex items-center justify-between sm:col-span-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-semibold text-foreground">{value}</span>
    </div>
  )
}

function AssessmentCard({ title, record, editor }: { title: string; record: AssessmentRecord; editor?: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        <StatusChip label={record.status === "complete" ? "Complete" : record.status === "in-progress" ? "In Progress" : "Pending"} tone={record.status === "complete" ? "success" : record.status === "in-progress" ? "info" : "neutral"} />
      </CardHeader>
      <CardContent className="flex flex-col gap-3 p-4 pt-0">
        <PersonBlock personId={record.assignedPersonId} />
        <p className="text-sm leading-relaxed text-foreground">{record.assessment}</p>
        {editor}
        {record.extra && (
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            {Object.entries(record.extra).map(([k, v]) => (
              <span key={k}>
                {k}: <span className="font-medium text-foreground">{v}</span>
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
