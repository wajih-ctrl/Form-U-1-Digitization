"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import { canRecordExternal } from "@/lib/permissions"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import type { Milestone } from "@/lib/types"
import { cn } from "cn"
import { useAppState, formatLong } from "@/lib/store"
import { PageHeader } from "@/components/shared/page-header"
import { StatusChip } from "@/components/shared/status-chip"
import { MetricStat } from "@/components/shared/metric-stat"
import { Card, CardContent } from "@/components/ui/card"
import { milestoneMeta } from "@/lib/status-meta"

const FILTERS = ["All", "Delayed", "At Risk", "Completed", "Upcoming"] as const

export default function TimelinePage() {
  const { milestones, projects, role, updateMilestone } = useAppState()
  const project = projects.find((p) => p.id === "pwt-001")!
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]>("All")

  const filtered = milestones.filter((m) => {
    if (filter === "All") return true
    if (filter === "Delayed") return m.status === "delayed"
    if (filter === "At Risk") return m.status === "at-risk"
    if (filter === "Completed") return m.status === "completed"
    if (filter === "Upcoming") return m.status === "upcoming" || m.status === "in-progress"
    return true
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Project Timeline" description="Milestone-level schedule tracking with downstream impact visibility." />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricStat label="Promised Completion" value={formatLong(project.promisedCompletion)} />
        <MetricStat label="Forecast Completion" value={formatLong(project.forecastCompletion)} tone="warning" />
        <MetricStat label="Schedule Variance" value={`+${project.scheduleVarianceDays} Days`} tone="warning" />
        <MetricStat label="Milestones Delayed" value={milestones.filter((m) => m.status === "delayed" || m.daysImpacted > 0).length} tone="warning" />
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
              filter === f ? "border-primary bg-accent text-accent-foreground" : "border-border bg-card text-muted-foreground hover:bg-muted"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <ol className="flex flex-col">
            {filtered.map((m, i) => {
              const meta = milestoneMeta(m.status)
              const moved = m.forecastDate !== m.originalDate
              return (
                <li key={m.id} className="relative flex gap-4 px-5 py-4">
                  <div className="flex flex-col items-center pt-1">
                    <span
                      className={cn(
                        "size-3 rounded-full ring-4",
                        meta.tone === "success" && "bg-success-foreground ring-success",
                        meta.tone === "danger" && "bg-danger-foreground ring-danger",
                        meta.tone === "warning" && "bg-warning-foreground ring-warning",
                        meta.tone === "neutral" && "bg-muted-foreground/50 ring-muted",
                        meta.tone === "info" && "bg-info-foreground ring-info"
                      )}
                    />
                    {i < filtered.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
                  </div>

                  <div className="flex flex-1 flex-col gap-2 pb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{m.name}</span>
                      <StatusChip label={meta.label} tone={meta.tone} />
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span>Team: {m.team}</span>
                      <span>Original: {formatLong(m.originalDate)}</span>
                      <span className={moved ? "font-medium text-warning-foreground" : ""}>Forecast: {formatLong(m.forecastDate)}</span>
                      {m.daysImpacted > 0 && <span className="font-medium text-warning-foreground">+{m.daysImpacted} Days</span>}
                    </div>
                    {!["ms-10", "ms-11", "ms-12"].includes(m.id) && canRecordExternal(role, m.team) && <Select value={m.status} onValueChange={v => { if(v) { updateMilestone(m.id, v as Milestone["status"]); toast.success(`${m.name} updated`) } }}><SelectTrigger aria-label={`Status for ${m.name}`} className="w-44"><SelectValue /></SelectTrigger><SelectContent>{["upcoming", "in-progress", "at-risk", "delayed", "completed"].map(v => <SelectItem key={v} value={v}>{milestoneMeta(v).label}</SelectItem>)}</SelectContent></Select>}
                    {["ms-10", "ms-11", "ms-12"].includes(m.id) && <Link href="/completion" className="text-sm font-medium text-primary hover:underline">Review completion and client validation</Link>}<p className="text-xs text-muted-foreground">Dependency: {m.dependency || "None recorded"}</p>
                    <p className="text-sm text-muted-foreground">Delay reason: {m.delayReason || "No delay recorded"}</p>
                    <p className="text-sm text-muted-foreground">Downstream impact: {m.downstreamImpact || "None recorded"}</p>
                  </div>
                </li>
              )
            })}
            {filtered.length === 0 && (
              <li className="px-5 py-10 text-center text-sm text-muted-foreground">No milestones match this filter.</li>
            )}
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}

