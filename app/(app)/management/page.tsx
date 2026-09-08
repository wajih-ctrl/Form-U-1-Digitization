"use client"

import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { useAppState, formatCurrency } from "@/lib/store"
import { personById } from "@/lib/mock-data"
import { PageHeader } from "@/components/shared/page-header"
import { StatusChip } from "@/components/shared/status-chip"
import { PersonChip } from "@/components/shared/person-chip"
import { MetricStat } from "@/components/shared/metric-stat"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { projectHealthMeta, changeMeta } from "@/lib/status-meta"

export default function ManagementOverviewPage() {
  const { projects, changes, issues, readinessItems } = useAppState()

  const onTrack = projects.filter((p) => p.health === "on-track").length
  const atRisk = projects.filter((p) => p.health === "at-risk").length
  const delayed = projects.filter((p) => p.health === "delayed").length
  const totalCostExposure = projects.reduce((s, p) => s + p.costExposure, 0)
  const totalScheduleExposure = projects.reduce((s, p) => s + p.scheduleVarianceDays, 0)
  const escalated = changes.filter((c) => c.status === "escalated").length

  const cr003 = changes.find((c) => c.id === "cr-003")

  const executiveAttention = [
    ...issues.filter(i => i.status === "escalated").map(i => ({ project: i.title, note: "Escalated issue", impact: i.timelineImpact, href: "/issues" })),
    cr003 && !["approved", "rejected"].includes(cr003.status) && {
      project: "Produced Water Treatment Optimization",
      note: `CR-003 ${changeMeta(cr003.status).label}`,
      impact: `+${cr003.combinedImpact.scheduleDays} days / ${formatCurrency(cr003.combinedImpact.cost)}`,
      href: "/changes/cr-003",
    },
    {
      project: "FPSO Chemical Treatment Evaluation",
      note: "Client approval overdue",
      impact: "Execution readiness at risk",
      href: "/projects/fpso-003",
    },
    {
      project: "Pipeline Treatment Performance Improvement",
      note: "Mobilization delayed by supplier delivery",
      impact: "+7 days schedule exposure",
      href: "/projects/ptp-002",
    },
  ].filter(Boolean) as { project: string; note: string; impact: string; href: string }[]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Management Overview" description="Portfolio-level visibility into project health, exposure, and escalations." />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <MetricStat label="Active Projects" value={projects.filter((p) => p.status === "Active").length} />
        <MetricStat label="On Track" value={onTrack} tone="success" />
        <MetricStat label="At Risk" value={atRisk} tone="warning" />
        <MetricStat label="Delayed" value={delayed} tone="danger" />
        <MetricStat label="Cost Exposure" value={formatCurrency(totalCostExposure)} tone="warning" />
        <MetricStat label="Schedule Exposure" value={`+${totalScheduleExposure} Days`} tone="warning" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4"><MetricStat label="Major Changes" value={changes.filter(c => c.highImpact && !["approved", "rejected"].includes(c.status)).length} tone="warning" /><MetricStat label="Projects Waiting on Client" value={projects.filter(p => p.currentPhase === "Client Technical Review" || (p.id === "pwt-001" && readinessItems.some(r => r.team === "Client" && r.status !== "ready"))).length} /><MetricStat label="Projects Waiting on PM" value={changes.some(c => c.status === "awaiting-pm-decision") ? 1 : 0} /><MetricStat label="Escalated Issues" value={issues.filter(i => i.status === "escalated").length} tone="danger" /></div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="size-4 text-warning-foreground" />
            Executive Attention
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-border p-0">
          {executiveAttention.map((item) => (
            <Link key={item.project + item.note} href={item.href} className="flex items-center justify-between px-4 py-3 hover:bg-muted/50">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{item.project}</span>
                <span className="text-xs text-muted-foreground">{item.note}</span>
              </div>
              <span className="text-xs font-medium text-warning-foreground">{item.impact}</span>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Project</TableHead>
              <TableHead>Project Manager</TableHead>
              <TableHead>Health</TableHead>
              <TableHead>Current Phase</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Schedule Variance</TableHead>
              <TableHead>Cost Exposure</TableHead>
              <TableHead>Escalation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((p) => {
              const meta = projectHealthMeta(p.health)
              const isPrimary = p.id === "pwt-001"
              return (
                <TableRow key={p.id}>
                  <TableCell className="max-w-[220px]">
                    <Link
                      href={isPrimary ? "/command-center" : `/projects/${p.id}`}
                      className="block truncate font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {p.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <PersonChip personId={p.projectManagerId} />
                  </TableCell>
                  <TableCell>
                    <StatusChip label={meta.label} tone={meta.tone} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.currentPhase}</TableCell>
                  <TableCell className="text-muted-foreground">{p.progress}%</TableCell>
                  <TableCell className={p.scheduleVarianceDays > 0 ? "font-medium text-warning-foreground" : "text-muted-foreground"}>
                    {p.scheduleVarianceDays > 0 ? `+${p.scheduleVarianceDays} Days` : "On Schedule"}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{p.costExposure > 0 ? formatCurrency(p.costExposure) : "—"}</TableCell>
                  <TableCell>
                    {isPrimary && changes.some((c) => c.status === "escalated") ? (
                      <StatusChip label="Escalated" tone="danger" />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
