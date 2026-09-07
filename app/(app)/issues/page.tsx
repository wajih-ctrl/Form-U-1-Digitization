"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Search } from "lucide-react"
import { useAppState, formatLong } from "@/lib/store"
import { PageHeader } from "@/components/shared/page-header"
import { StatusChip } from "@/components/shared/status-chip"
import { PersonChip, PersonBlock } from "@/components/shared/person-chip"
import { MetricStat } from "@/components/shared/metric-stat"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import { issueMeta, severityMeta } from "@/lib/status-meta"
import type { Issue } from "@/lib/types"

export default function IssuesPage() {
  const { issues, updateIssueStatus } = useAppState()
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [active, setActive] = React.useState<Issue | null>(null)

  const searchParams = useSearchParams()
  React.useEffect(() => { const id = searchParams.get("record"); if (id) setActive(issues.find(i => i.id === id) ?? null) }, [issues, searchParams])

  const filtered = issues.filter((i) => {
    if (statusFilter !== "all" && i.status !== statusFilter) return false
    if (search && !`${i.title} ${i.category}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const activeIssue = active ? issues.find((i) => i.id === active.id) ?? active : null

  const critical = issues.filter((i) => i.severity === "critical" && i.status !== "resolved").length
  const atRisk = issues.filter((i) => i.status === "at-risk").length
  const overdue = issues.filter((i) => i.status === "overdue").length
  const pmAttn = issues.filter((i) => i.pmAttention).length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Issues & Risks" description="Register of open technical, operational, and client-related risks affecting execution." />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricStat label="Open Issues" value={issues.filter((i) => i.status !== "resolved").length} />
        <MetricStat label="Critical" value={critical} tone="danger" />
        <MetricStat label="Overdue" value={overdue} tone="danger" />
        <MetricStat label="PM Attention Required" value={pmAttn} tone="warning" />
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-auto sm:min-w-[220px] sm:flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search issues…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { if (v !== null) setStatusFilter(v) }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in-review">In Review</SelectItem>
              <SelectItem value="waiting-for-input">Waiting for Input</SelectItem>
              <SelectItem value="at-risk">At Risk</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="escalated">Escalated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Issue</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Responsible</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Timeline Impact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((issue) => {
              const meta = issueMeta(issue.status)
              const sev = severityMeta(issue.severity)
              return (
                <TableRow key={issue.id}>
                  <TableCell className="max-w-[260px]">
                    <button onClick={() => setActive(issue)} className="truncate text-left font-medium text-foreground hover:text-primary hover:underline">
                      {issue.title}
                    </button>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{issue.category}</TableCell>
                  <TableCell>
                    <StatusChip label={sev.label} tone={sev.tone} />
                  </TableCell>
                  <TableCell>
                    <PersonChip personId={issue.assignedPersonId} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatLong(issue.dueDate)}</TableCell>
                  <TableCell className="text-muted-foreground">{issue.timelineImpact}</TableCell>
                  <TableCell>
                    <StatusChip label={meta.label} tone={meta.tone} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => setActive(issue)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                  No issues match the current filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Sheet open={!!activeIssue} onOpenChange={(open) => !open && setActive(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          {activeIssue && (
            <>
              <SheetHeader>
                <SheetTitle>{activeIssue.title}</SheetTitle>
                <SheetDescription>{activeIssue.category} issue detail.</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-4 overflow-y-auto px-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <span className="text-sm font-medium text-foreground">Status</span>
                  <StatusChip label={issueMeta(activeIssue.status).label} tone={issueMeta(activeIssue.status).tone} />
                </div>
                <PersonBlock personId={activeIssue.assignedPersonId} />
                <p className="text-sm leading-relaxed text-foreground">{activeIssue.description}</p>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <Detail label="Severity" value={severityMeta(activeIssue.severity).label} />
                  <Detail label="Raised By" value={activeIssue.raisedBy} />
                  <Detail label="Date Raised" value={formatLong(activeIssue.dateRaised)} />
                  <Detail label="Due Date" value={formatLong(activeIssue.dueDate)} />
                  <Detail label="Affected Milestone" value={activeIssue.affectedMilestone} />
                  <Detail label="Cost Impact" value={activeIssue.costImpact} />
                </dl>
                <div className="rounded-lg border border-warning-foreground/20 bg-warning p-3">
                  <p className="mb-1 text-xs font-medium text-warning-foreground">Waiting On</p>
                  <p className="text-sm text-warning-foreground">{activeIssue.waitingOn}</p>
                </div>
                <div className="rounded-lg border border-info-foreground/20 bg-info p-3">
                  <p className="mb-1 text-xs font-medium text-info-foreground">Required Action</p>
                  <p className="text-sm text-info-foreground">{activeIssue.requiredAction}</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Update Status</span>
                  <Select
                    value={activeIssue.status}
                    onValueChange={(v) => {
                      if (!v) return
                      updateIssueStatus(activeIssue.id, v as any)
                      toast.success("Issue status updated", { description: `${activeIssue.title} marked ${v.replace(/-/g, " ")}.` })
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in-review">In Review</SelectItem>
                      <SelectItem value="waiting-for-input">Waiting for Input</SelectItem>
                      <SelectItem value="at-risk">At Risk</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="escalated">Escalated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <SheetFooter className="flex-row flex-wrap justify-end gap-2 border-t border-border">
                {activeIssue.relatedChangeId && (
                  <Button variant="outline" size="sm" render={<Link href={`/changes/${activeIssue.relatedChangeId}`} />}>
                    Related Change
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={["resolved", "escalated"].includes(activeIssue.status)}
                  onClick={() => { updateIssueStatus(activeIssue.id, "escalated"); toast.success("Issue escalated", { description: `${activeIssue.title} is now visible to management.` }) }}
                >
                  Escalate
                </Button>
                <Button
                  size="sm"
                  disabled={activeIssue.status === "resolved"}
                  onClick={() => {
                    updateIssueStatus(activeIssue.id, "resolved")
                    toast.success("Issue resolved", { description: `${activeIssue.title} marked resolved.` })
                    setActive(null)
                  }}
                >
                  {activeIssue.status === "resolved" ? "Resolved" : "Resolve"}
                </Button>
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
