"use client"

import { CheckCircle2, CircleDashed, Clock } from "lucide-react"
import { cn } from "cn"
import { useAppState } from "@/lib/store"
import { PageHeader } from "@/components/shared/page-header"
import { StatusChip } from "@/components/shared/status-chip"
import { PersonChip } from "@/components/shared/person-chip"
import { MetricStat } from "@/components/shared/metric-stat"
import { Card, CardContent } from "@/components/ui/card"

interface ChecklistItem {
  label: string
  status: "complete" | "in-progress" | "not-started"
  detail: string
  team: string
  assignedPersonId: string
  targetDate: string
  dependency: string
}

export default function CompletionPage() {
  const { issues, actions, technicalStages, milestones, documents } = useAppState()
  const openIssues = issues.filter((i) => i.status !== "resolved").length
  const openActions = actions.filter((a) => a.status !== "complete").length

  const checklist: ChecklistItem[] = [
    {
      label: "Technical Activities Complete",
      status: technicalStages.every(s => s.status === "completed") ? "complete" : "in-progress",
      detail: `${technicalStages.filter(s => s.status !== "completed").length} technical stages remain before technical completion.`,
      team: "Technical / Lab",
      assignedPersonId: "omar-rahman",
      targetDate: "2026-09-11",
      dependency: "None",
    },
    {
      label: "Field Execution Complete",
      status: milestones.find(m => m.name === "Field Execution")?.status === "completed" ? "complete" : "in-progress",
      detail: "Field execution completion follows the project milestone record.",
      team: "Operations",
      assignedPersonId: "carlos-diaz",
      targetDate: "2026-09-20",
      dependency: "Mobilization",
    },
    {
      label: "Outstanding Issues",
      status: openIssues > 0 ? "in-progress" : "complete",
      detail: `${openIssues} issue(s) remain open and must be resolved before technical completion.`,
      team: "Project Management",
      assignedPersonId: "james-parker",
      targetDate: "2026-09-25",
      dependency: "Issue resolution",
    },
    {
      label: "Outstanding Actions",
      status: openActions > 0 ? "in-progress" : "complete",
      detail: `${openActions} action(s) remain open across responsible teams.`,
      team: "Project Management",
      assignedPersonId: "james-parker",
      targetDate: "2026-09-25",
      dependency: "Action closure",
    },
    {
      label: "Performance Documentation",
      status: documents.some(d => /performance/i.test(d.name) && d.status === "final") ? "complete" : "not-started",
      detail: "A final performance verification record is required in Documents.",
      team: "Technical / Lab",
      assignedPersonId: "priya-nair",
      targetDate: "2026-09-25",
      dependency: "Performance Verification",
    },
    {
      label: "Technical Completion Report",
      status: "in-progress",
      detail: "Final technical completion report drafting in progress, pending secondary train close-out.",
      team: "Technical / Lab",
      assignedPersonId: "omar-rahman",
      targetDate: "2026-09-29",
      dependency: "Field Execution Complete",
    },
    {
      label: "Client Review",
      status: "not-started",
      detail: "Awaiting submission of Technical Completion Report before client review can begin.",
      team: "Client",
      assignedPersonId: "client-contact",
      targetDate: "2026-09-30",
      dependency: "Technical Completion Report",
    },
    {
      label: "Client Validation / Sign-Off",
      status: "not-started",
      detail: "External dependency — client sign-off required to close out the technical program.",
      team: "Client",
      assignedPersonId: "client-contact",
      targetDate: "2026-10-01",
      dependency: "Client Review",
    },
    {
      label: "Commercial Closure",
      status: "not-started",
      detail: "Final commercial reconciliation pending technical completion and client validation.",
      team: "Commercial",
      assignedPersonId: "michael-grant",
      targetDate: "2026-10-02",
      dependency: "Client Validation",
    },
    {
      label: "Project Closure",
      status: "not-started",
      detail: "Formal project closure pending commercial closure and final documentation handover.",
      team: "Project Management",
      assignedPersonId: "james-parker",
      targetDate: "2026-10-03",
      dependency: "Commercial Closure",
    },
  ]

  const completeCount = checklist.filter((c) => c.status === "complete").length
  const overall = Math.round((completeCount / checklist.length) * 100)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Completion & Client Validation" description="Project closeout checklist tracking readiness for technical completion and client sign-off." />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricStat label="Overall Completion" value={`${overall}%`} />
        <MetricStat label="Outstanding Issues" value={openIssues} tone={openIssues > 0 ? "warning" : "default"} />
        <MetricStat label="Outstanding Actions" value={openActions} tone={openActions > 0 ? "warning" : "default"} />
        <MetricStat label="Steps Complete" value={`${completeCount} / ${checklist.length}`} />
      </div>

      <Card>
        <CardContent className="flex flex-col divide-y divide-border p-0">
          {checklist.map((item) => (
            <div key={item.label} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3">
                <span
                  className={cn(
                    "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
                    item.status === "complete"
                      ? "bg-success text-success-foreground"
                      : item.status === "in-progress"
                        ? "bg-info text-info-foreground"
                        : "bg-neutral-status text-neutral-status-foreground"
                  )}
                >
                  {item.status === "complete" ? (
                    <CheckCircle2 className="size-3.5" />
                  ) : item.status === "in-progress" ? (
                    <Clock className="size-3.5" />
                  ) : (
                    <CircleDashed className="size-3.5" />
                  )}
                </span>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-foreground">{item.label}</span>
                  <p className="max-w-lg text-sm text-muted-foreground">{item.detail}</p>
                  <p className="text-xs text-muted-foreground">Dependency: {item.dependency}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-4 sm:flex-col sm:items-end sm:gap-2">
                <StatusChip
                  label={item.status === "complete" ? "Complete" : item.status === "in-progress" ? "In Progress" : "Not Started"}
                  tone={item.status === "complete" ? "success" : item.status === "in-progress" ? "info" : "neutral"}
                />
                <PersonChip personId={item.assignedPersonId} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
