"use client"

import Link from "next/link"
import { useAppState, formatLong, formatCurrency } from "@/lib/store"
import { PageHeader } from "@/components/shared/page-header"
import { StatusChip } from "@/components/shared/status-chip"
import { MetricStat } from "@/components/shared/metric-stat"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { changeMeta, milestoneMeta } from "@/lib/status-meta"

export default function CostTimelineImpactPage() {
  const { changes, issues, milestones } = useAppState()

  const approvedCost = changes.filter((c) => c.status === "approved").reduce((s, c) => s + c.combinedImpact.cost, 0)
  const potentialCost = changes.filter(c => !["approved", "rejected"].includes(c.status)).reduce((s, c) => s + c.combinedImpact.cost, 0)
  const approvedDays = changes.filter((c) => c.status === "approved").reduce((s, c) => s + c.combinedImpact.scheduleDays, 0)
  const potentialDays = changes.filter(c => !["approved", "rejected"].includes(c.status)).reduce((s, c) => s + c.combinedImpact.scheduleDays, 0)
  const issueDays = issues.filter(i => i.status !== "resolved").reduce((sum, i) => sum + (Number(i.timelineImpact.match(/\d+/)?.[0]) || 0), 0)

  const items = [
    ...changes.map((c) => ({
      id: c.id,
      href: `/changes/${c.id}`,
      label: `${c.id.toUpperCase()} · ${c.title}`,
      source: "Change Request",
      original: c.combinedImpact.originalCompletion,
      forecast: c.combinedImpact.forecastCompletion,
      days: c.combinedImpact.scheduleDays,
      daysLabel: c.combinedImpact.scheduleDays > 0 ? `+${c.combinedImpact.scheduleDays} Days` : "None",
      cost: c.combinedImpact.cost,
      reason: c.reason,
      team: c.assessments.commercial.team,
      pmStatus: c.status,
      affected: c.affectedMilestoneIds.map(id => milestones.find(m => m.id === id)?.name ?? id).join(", "),
      review: Object.values(c.assessments).every(a => a.status === "complete") ? "Review Complete" : "In Review",
    })),
    ...issues
      .filter((i) => i.timelineImpact !== "None" && i.status !== "resolved")
      .map((i) => ({
        id: i.id,
        href: `/issues?record=${i.id}`,
        label: i.title,
        source: "Issue",
        original: milestones.find(m => m.name === i.affectedMilestone)?.originalDate ?? "—",
        forecast: milestones.find(m => m.name === i.affectedMilestone)?.forecastDate ?? "—",
        days: Number(i.timelineImpact.match(/\d+/)?.[0]) || 0,
        daysLabel: /\d/.test(i.timelineImpact) ? i.timelineImpact : `${i.timelineImpact} · not quantified`,
        cost: Number(i.costImpact.replace(/[^\d.]/g, "")) || 0,
        reason: i.description,
        team: i.team,
        affected: i.affectedMilestone,
        review: i.status.replaceAll("-", " "),
        pmStatus: i.pmAttention ? "awaiting-pm-decision" : "impact-review-complete",
      })),
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Cost & Timeline Exposure" description="Potential exposure excludes approved and rejected changes. Schedule days are summed estimates; overlapping impacts may not extend the final completion date." />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricStat label="Potential Schedule Exposure" value={`+${potentialDays + issueDays} Days`} tone="warning" />
        <MetricStat label="Approved Schedule Impact" value={`+${approvedDays} Days`} />
        <MetricStat label="Potential Cost Exposure" value={formatCurrency(potentialCost)} tone="warning" />
        <MetricStat label="Approved Cost Impact" value={formatCurrency(approvedCost)} />
      </div>

      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Item</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Original Date</TableHead><TableHead>Reason</TableHead><TableHead>Affected Milestone</TableHead><TableHead>Review Status</TableHead>
              <TableHead>Forecast Date</TableHead>
              <TableHead>Days Impacted</TableHead>
              <TableHead>Cost Exposure</TableHead>
              <TableHead>Responsible Team</TableHead>
              <TableHead>PM Decision Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const meta = changeMeta(item.pmStatus)
              return (
                <TableRow key={item.id}>
                  <TableCell className="max-w-[260px]">
                    <Link href={item.href} className="truncate font-medium text-foreground hover:text-primary hover:underline">
                      {item.label}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.source}</TableCell>
                  <TableCell>{item.original !== "—" ? formatLong(item.original) : "—"}</TableCell><TableCell>{item.reason}</TableCell><TableCell>{item.affected || "None"}</TableCell><TableCell>{item.review}</TableCell>
                  <TableCell className="text-muted-foreground">{item.forecast !== "—" ? formatLong(item.forecast) : "—"}</TableCell>
                  <TableCell className={item.days > 0 ? "font-medium text-warning-foreground" : "text-muted-foreground"}>
                    {item.daysLabel}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{item.cost > 0 ? formatCurrency(item.cost) : "$0"}</TableCell>
                  <TableCell className="text-muted-foreground">{item.team}</TableCell>
                  <TableCell>
                    <StatusChip label={meta.label} tone={meta.tone} />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Milestone Timeline Impact</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-border p-0">
          {milestones
            .filter((m) => m.daysImpacted > 0 || m.status === "at-risk" || m.status === "delayed")
            .map((m) => {
              const meta = milestoneMeta(m.status)
              return (
                <div key={m.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{m.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatLong(m.originalDate)} {m.forecastDate !== m.originalDate && `→ ${formatLong(m.forecastDate)}`}
                    </span>
                  </div>
                  <StatusChip label={meta.label} tone={meta.tone} />
                </div>
              )
            })}
        </CardContent>
      </Card>
    </div>
  )
}
