"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { toast } from "sonner"
import { cn } from "cn"
import { useAppState, formatLong } from "@/lib/store"
import { PageHeader } from "@/components/shared/page-header"
import { StatusChip } from "@/components/shared/status-chip"
import { PersonChip } from "@/components/shared/person-chip"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { actionMeta, priorityMeta } from "@/lib/status-meta"

const FILTERS = [
  "All",
  "Overdue",
  "Waiting on Client",
  "Waiting on Technical",
  "Waiting on Operations",
  "Waiting on Procurement",
  "Waiting on Commercial",
  "High Impact",
] as const

export default function ActionsPage() {
  const { actions, updateActionStatus } = useAppState()
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]>("All")

  const [search, setSearch] = React.useState("")
  const searchParams = useSearchParams()
  React.useEffect(() => { setSearch(searchParams.get("search") ?? "") }, [searchParams])
  const filtered = actions.filter((a) => {
    if (!`${a.title} ${a.waitingOn}`.toLowerCase().includes(search.trim().toLowerCase())) return false
    if (filter === "All") return true
    if (filter === "Overdue") return a.status === "overdue"
    if (filter === "High Impact") return a.priority === "high"
    if (filter.startsWith("Waiting on ")) {
      const team = filter.replace("Waiting on ", "")
      return a.waitingOn.toLowerCase().includes(team.toLowerCase())
    }
    return true
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Actions & Responsibilities" description="Ownership, coordination, and next steps across every open project item." />

      <Input aria-label="Search actions" placeholder="Search actions…" value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
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

      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Action</TableHead>
              <TableHead>Linked Item</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Waiting On</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Next Step</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((action) => {
              const meta = actionMeta(action.status)
              const pri = priorityMeta(action.priority)
              return (
                <TableRow key={action.id}>
                  <TableCell className="max-w-[220px] truncate font-medium text-foreground">{action.title}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {action.linkedHref ? (
                      <Link href={action.linkedHref} className="text-primary hover:underline">
                        {action.linkedItem}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">{action.linkedItem}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <PersonChip personId={action.assignedPersonId} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatLong(action.dueDate)}</TableCell>
                  <TableCell>
                    <StatusChip label={pri.label} tone={pri.tone} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{action.waitingOn}</TableCell>
                  <TableCell>
                    <StatusChip label={meta.label} tone={meta.tone} />
                  </TableCell>
                  <TableCell className="max-w-[220px] text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xs text-muted-foreground">{action.nextStep}</span>
                      {action.status !== "complete" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            updateActionStatus(action.id, "complete")
                            toast.success("Action completed", { description: action.title, action: { label: "Undo", onClick: () => updateActionStatus(action.id, action.status) } })
                          }}
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                  No actions match this filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
