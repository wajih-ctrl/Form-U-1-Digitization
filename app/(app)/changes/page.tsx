"use client"

import * as React from "react"
import Link from "next/link"
import { Search } from "lucide-react"
import { useAppState, formatLong, formatCurrency } from "@/lib/store"
import { PageHeader } from "@/components/shared/page-header"
import { StatusChip } from "@/components/shared/status-chip"
import { MetricStat } from "@/components/shared/metric-stat"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { changeMeta } from "@/lib/status-meta"

export default function ChangesPage() {
  const { changes, projects, milestones } = useAppState()
  const project = projects.find((p) => p.id === "pwt-001")!
  const [search, setSearch] = React.useState("")

  const filtered = changes.filter((c) => `${c.id} ${c.title}`.toLowerCase().includes(search.toLowerCase()))

  const openCount = changes.filter((c) => !["approved", "rejected"].includes(c.status)).length
  const awaitingImpact = changes.filter((c) => c.status === "assessment-in-progress").length
  const awaitingDecision = changes.filter((c) => c.status === "awaiting-pm-decision").length
  const approvedCost = changes.filter((c) => c.status === "approved").reduce((sum, c) => sum + c.combinedImpact.cost, 0)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Changes & Impact" description="Client and internal scope changes, combined impact, and Project Manager decisions." />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <MetricStat label="Open Changes" value={openCount} />
        <MetricStat label="Awaiting Impact Review" value={awaitingImpact} />
        <MetricStat label="Awaiting PM Decision" value={awaitingDecision} tone={awaitingDecision > 0 ? "warning" : "default"} />
        <MetricStat label="Approved Impact" value={formatCurrency(approvedCost)} />
        <MetricStat label="Schedule Exposure" value={`+${project.scheduleVarianceDays} Days`} tone="warning" />
      </div>

      <Card className="p-4">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search changes…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </Card>

      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Change</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cost Impact</TableHead>
              <TableHead>Timeline Impact</TableHead>
              <TableHead>Affected Milestone</TableHead>
              <TableHead className="text-right">PM Decision</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => {
              const meta = changeMeta(c.status)
              return (
                <TableRow key={c.id}>
                  <TableCell className="max-w-[280px]">
                    <Link href={`/changes/${c.id}`} className="font-medium text-foreground hover:text-primary hover:underline">
                      {c.id.toUpperCase()} · {c.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.source}</TableCell>
                  <TableCell className="text-muted-foreground">{formatLong(c.dateRequested)}</TableCell>
                  <TableCell>
                    <StatusChip label={meta.label} tone={meta.tone} />
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {c.combinedImpact.cost > 0 ? formatCurrency(c.combinedImpact.cost) : "$0"}
                  </TableCell>
                  <TableCell className={c.combinedImpact.scheduleDays > 0 ? "font-medium text-warning-foreground" : "text-muted-foreground"}>
                    {c.combinedImpact.scheduleDays > 0 ? `+${c.combinedImpact.scheduleDays} Days` : "None"}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                    {c.affectedMilestoneIds.map(id => milestones.find(m => m.id === id)?.name ?? id).join(", ") || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <StatusChip
                      label={c.pmDecision ? c.pmDecision.status.replace("-", " ") : "Pending"}
                      tone={c.pmDecision ? (c.pmDecision.status === "approved" ? "success" : c.pmDecision.status === "rejected" ? "danger" : "warning") : "warning"}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
            {filtered.length === 0 && <TableRow><TableCell colSpan={8} className="py-12 text-center text-muted-foreground">No changes match your search. Try a different name or clear the search field.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
