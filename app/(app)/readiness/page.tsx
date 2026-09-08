"use client"

import * as React from "react"
import { canRecordExternal } from "@/lib/permissions"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import Link from "next/link"
import { toast } from "sonner"
import { useAppState, formatLong } from "@/lib/store"
import { PageHeader } from "@/components/shared/page-header"
import { StatusChip } from "@/components/shared/status-chip"
import { PersonChip, PersonBlock } from "@/components/shared/person-chip"
import { MetricStat } from "@/components/shared/metric-stat"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { readinessMeta } from "@/lib/status-meta"
import type { ReadinessItem } from "@/lib/types"

export default function ExecutionReadinessPage() {
  const { role, readinessItems, updateReadinessStatus } = useAppState()
  const [active, setActive] = React.useState<ReadinessItem | null>(null)

  const readyCount = readinessItems.filter((r) => r.status === "ready").length
  const score = Math.round((readyCount / readinessItems.length) * 100)
  const overallStatus = readinessItems.some((r) => r.status === "blocked")
    ? "Blocked"
    : readinessItems.some((r) => r.status === "at-risk")
      ? "At Risk"
      : "On Track"

  const activeItem = active ? readinessItems.find((r) => r.id === active.id) ?? active : null

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Execution Readiness" description="Readiness status across every area required to mobilize field execution." />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricStat label="Overall Status" value={overallStatus} tone={overallStatus === "On Track" ? "success" : "warning"} />
        <MetricStat label="Readiness Score" value={`${score}%`} context={`${readyCount} of ${readinessItems.length} items ready`} />
        <MetricStat label="At Risk Items" value={readinessItems.filter((r) => r.status === "at-risk").length} tone="warning" />
        <MetricStat label="Blocked Items" value={readinessItems.filter((r) => r.status === "blocked").length} tone="danger" />
      </div>

      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Readiness Item</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Responsible</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Dependency</TableHead>
              <TableHead>Issue / Impact</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {readinessItems.map((item) => {
              const meta = readinessMeta(item.status)
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                  <TableCell>
                    <StatusChip label={meta.label} tone={meta.tone} />
                  </TableCell>
                  <TableCell>
                    <PersonChip personId={item.assignedPersonId} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatLong(item.dueDate)}</TableCell>
                  <TableCell className="max-w-[180px] truncate text-muted-foreground">{item.dependency}</TableCell>
                  <TableCell className="max-w-[240px] truncate text-muted-foreground">{item.issue ?? item.latestUpdate ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => setActive(item)}>
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!activeItem} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="sm:max-w-lg">
          {activeItem && (
            <>
              <DialogHeader>
                <DialogTitle>{activeItem.name}</DialogTitle>
                <DialogDescription>Execution readiness detail and required next action.</DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <span className="text-sm font-medium text-foreground">Status</span>
                  <StatusChip label={readinessMeta(activeItem.status).label} tone={readinessMeta(activeItem.status).tone} />
                </div>

                <PersonBlock personId={activeItem.assignedPersonId} />

                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Due Date</dt>
                    <dd className="font-medium text-foreground">{formatLong(activeItem.dueDate)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Dependency</dt>
                    <dd className="font-medium text-foreground">{activeItem.dependency}</dd>
                  </div>
                </dl>

                {!activeItem.issue && <p className="text-sm text-muted-foreground">Related Issue: None recorded</p>}
                {!activeItem.impact && <p className="text-sm text-muted-foreground">Project Impact: Not recorded — responsible team to confirm</p>}
                {activeItem.issue && (
                  <div className="rounded-lg border border-warning-foreground/20 bg-warning p-3">
                    <p className="mb-1 text-xs font-medium text-warning-foreground">Related Issue</p>
                    <p className="text-sm text-warning-foreground">{activeItem.issue}</p>
                  </div>
                )}
                {activeItem.impact && (
                  <div className="rounded-lg border border-danger-foreground/20 bg-danger p-3">
                    <p className="mb-1 text-xs font-medium text-danger-foreground">Impact if Late</p>
                    <p className="text-sm text-danger-foreground">{activeItem.impact}</p>
                  </div>
                )}
                {activeItem.latestUpdate && (
                  <div className="rounded-lg border border-border bg-muted/40 p-3">
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Latest Update</p>
                    <p className="text-sm text-foreground">{activeItem.latestUpdate}</p>
                  </div>
                )}
                {activeItem.nextAction && (
                  <div className="rounded-lg border border-info-foreground/20 bg-info p-3">
                    <p className="mb-1 text-xs font-medium text-info-foreground">Next Action</p>
                    <p className="text-sm text-info-foreground">{activeItem.nextAction}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2"><p className="text-xs text-muted-foreground">Status · Owned by {activeItem.team}</p><Select value={activeItem.status} onValueChange={v => { if (v) { updateReadinessStatus(activeItem.id, v as ReadinessItem["status"]); toast.success("Readiness status updated") } }}><SelectTrigger aria-label="Readiness status" className="w-full" disabled={!canRecordExternal(role, activeItem.team)}><SelectValue /></SelectTrigger><SelectContent>{["ready", "in-progress", "at-risk", "blocked", "not-started"].map(v => <SelectItem key={v} value={v}>{readinessMeta(v).label}</SelectItem>)}</SelectContent></Select></div>
              <DialogFooter className="justify-between sm:justify-between">
                <div className="flex gap-2">
                  {activeItem.relatedChangeId && (
                    <Button variant="outline" size="sm" render={<Link href={`/changes/${activeItem.relatedChangeId}`} />}>
                      Open Related Change
                    </Button>
                  )}
                  {activeItem.relatedIssueId && (
                    <Button variant="outline" size="sm" render={<Link href="/issues" />}>
                      Open Issue
                    </Button>
                  )}
                </div>
                <Button
                  size="sm"
                  disabled={!canRecordExternal(role, activeItem.team) || activeItem.status === "ready"}
                  onClick={() => {
                    updateReadinessStatus(activeItem.id, "ready")
                    toast.success("Readiness updated", { description: `${activeItem.name} marked Ready.` })
                    setActive(null)
                  }}
                >
                  Mark Ready
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
