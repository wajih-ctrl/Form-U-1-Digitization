"use client"

import * as React from "react"
import { canRecordExternal } from "@/lib/permissions"
import { AddRecord } from "@/components/shared/add-record"
import Link from "next/link"
import { toast } from "sonner"
import { FileText, TriangleAlert } from "lucide-react"
import { useAppState, formatLong } from "@/lib/store"
import { personById } from "@/lib/mock-data"
import { PageHeader } from "@/components/shared/page-header"
import { StatusChip } from "@/components/shared/status-chip"
import { PersonBlock } from "@/components/shared/person-chip"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import { stageMeta } from "@/lib/status-meta"
import type { TechnicalStage } from "@/lib/types"

export default function TechnicalWorkflowPage() {
  const { role, technicalStages, updateTechnicalStageStatus } = useAppState()
  const [active, setActive] = React.useState<TechnicalStage | null>(null)

  const activeStage = active ? technicalStages.find((s) => s.id === active.id) ?? active : null

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Technical Workflow"
        description="Sample and technical evaluation pipeline for the produced water treatment optimization program."
      />

      <Card className="overflow-hidden">
        <CardContent className="flex flex-col p-0">
          {technicalStages.map((stage, index) => {
            const meta = stageMeta(stage.status)
            return (
              <button
                key={stage.id}
                onClick={() => setActive(stage)}
                className="grid w-full grid-cols-[24px_minmax(0,1fr)] items-start gap-4 border-b border-border px-5 py-4 text-left transition-colors last:border-b-0 hover:bg-muted/50 sm:grid-cols-[24px_minmax(0,1fr)_auto]"
              >
                <div className="flex flex-col items-center pt-0.5">
                  <span
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                      meta.tone === "success"
                        ? "bg-success text-success-foreground"
                        : meta.tone === "warning"
                          ? "bg-warning text-warning-foreground"
                          : meta.tone === "danger"
                            ? "bg-danger text-danger-foreground"
                            : meta.tone === "info"
                              ? "bg-info text-info-foreground"
                              : "bg-neutral-status text-neutral-status-foreground"
                    }`}
                  >
                    {index + 1}
                  </span>
                  {index < technicalStages.length - 1 && <span className="mt-1 h-full w-px flex-1 bg-border" />}
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-2 pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{stage.name}</span>
                    <StatusChip label={meta.label} tone={meta.tone} />
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span>Team: {stage.team}</span>
                    {stage.dueDate && <span>Due: {formatLong(stage.dueDate)}</span>}
                    {stage.completedDate && <span>Completed: {formatLong(stage.completedDate)}</span>}
                  </div>
                  {stage.outcome && <p className="text-sm text-muted-foreground">{stage.outcome}</p>}
                  {stage.waitingOn && (
                    <p className="flex items-center gap-1.5 text-sm font-medium text-warning-foreground">
                      <TriangleAlert className="size-3.5" />
                      Waiting on: {stage.waitingOn}
                    </p>
                  )}
                  {stage.impactIfDelayed && <p className="text-xs text-muted-foreground">Impact if delayed: {stage.impactIfDelayed}</p>}
                </div>

                <div className="col-start-2 sm:col-start-auto"><PersonBlock personId={stage.assignedPersonId} /></div>
              </button>
            )
          })}
        </CardContent>
      </Card>

      <Sheet open={!!activeStage} onOpenChange={(open) => !open && setActive(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          {activeStage && (
            <>
              <SheetHeader>
                <SheetTitle>{activeStage.name}</SheetTitle>
                <SheetDescription>Technical stage detail and dependencies.</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-4 overflow-y-auto px-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <span className="text-sm font-medium text-foreground">Status</span>
                  <StatusChip label={stageMeta(activeStage.status).label} tone={stageMeta(activeStage.status).tone} />
                </div>

                <PersonBlock personId={activeStage.assignedPersonId} />
                <Button variant="outline" render={<Link href={activeStage.linkedDocumentId ? `/documents?record=${activeStage.linkedDocumentId}` : "/documents"} />}>{activeStage.linkedDocumentId ? "View Linked Record" : "Browse Technical Records"}</Button>

                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <Detail label="Responsible Team" value={activeStage.team} />
                  <Detail label="Start Date" value={activeStage.startDate ? formatLong(activeStage.startDate) : "Not recorded"} />
                  <Detail label="Due Date" value={activeStage.dueDate ? formatLong(activeStage.dueDate) : activeStage.completedDate ? formatLong(activeStage.completedDate) : "Not scheduled"} />
                  {activeStage.completedDate && <Detail label="Completed" value={formatLong(activeStage.completedDate)} />}
                  <Detail label="Dependency" value={activeStage.dependency || "None recorded"} />
                  {!activeStage.impactIfDelayed && <Detail label="Impact if Delayed" value="Not recorded — specialist review required" />}
                </dl>

                {!activeStage.outcome && <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Outcome placeholder: specialist findings have not yet been recorded.</p>}
                {activeStage.outcome && (
                  <div className="rounded-lg border border-border bg-muted/40 p-3">
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Outcome</p>
                    <p className="text-sm text-foreground">{activeStage.outcome}</p>
                  </div>
                )}
                {activeStage.waitingOn && (
                  <div className="rounded-lg border border-warning-foreground/20 bg-warning p-3">
                    <p className="mb-1 text-xs font-medium text-warning-foreground">Waiting On</p>
                    <p className="text-sm text-warning-foreground">{activeStage.waitingOn}</p>
                  </div>
                )}
                {activeStage.impactIfDelayed && (
                  <div className="rounded-lg border border-danger-foreground/20 bg-danger p-3">
                    <p className="mb-1 text-xs font-medium text-danger-foreground">Impact if Delayed</p>
                    <p className="text-sm text-danger-foreground">{activeStage.impactIfDelayed}</p>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Update Status</span>
                  <Select
                    disabled={!canRecordExternal(role, activeStage.team)}
                    value={activeStage.status}
                    onValueChange={(v) => {
                      if (!v) return
                      updateTechnicalStageStatus(activeStage.id, v as any)
                      toast.success("Stage status updated", { description: `${activeStage.name} marked ${v.replace("-", " ")}.` })
                    }}
                  >
                    <SelectTrigger aria-label="Technical stage status" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not-started">Not Started</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="at-risk">At Risk</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <SheetFooter className="flex-row justify-end gap-2 border-t border-border">
                {role === "technical" && <AddRecord stage={activeStage.name} />}
                {activeStage.id === "stage-5" && (
                  <Button size="sm" render={<Link href="/changes/cr-003" />}>
                    View Related Change
                  </Button>
                )}
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  )
}
