"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { canManageProjects } from "@/lib/permissions"
import Link from "next/link"
import { Search } from "lucide-react"
import { useAppState, formatShort, formatCurrency } from "@/lib/store"
import { personById } from "@/lib/mock-data"
import { PageHeader } from "@/components/shared/page-header"
import { StatusChip } from "@/components/shared/status-chip"
import { PersonChip } from "@/components/shared/person-chip"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { projectHealthMeta } from "@/lib/status-meta"

export default function ProjectsPage() {
  const router = useRouter()
  const { role, createProject, projects, changes, issues, actions } = useAppState()
  const [search, setSearch] = React.useState("")
  const [health, setHealth] = React.useState("all")
  const [phase, setPhase] = React.useState("all")

  const filtered = projects.filter((p) => {
    if (health !== "all" && p.health !== health) return false
    if (phase !== "all" && p.currentPhase !== phase) return false
    if (search && !`${p.name} ${p.client} ${p.facility}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const phases = Array.from(new Set(projects.map((p) => p.currentPhase)))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader actions={canManageProjects(role) && <Button onClick={() => { const id = createProject(); if(id) router.push(`/projects/${id}/setup`) }}>Create Project</Button>} title="Projects" description="Track active technical and operational projects." />

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-auto sm:min-w-[220px] sm:flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search projects…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={health} onValueChange={(v) => { if (v !== null) setHealth(v) }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Health" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Health</SelectItem>
              <SelectItem value="on-track">On Track</SelectItem>
              <SelectItem value="at-risk">At Risk</SelectItem>
              <SelectItem value="delayed">Delayed</SelectItem>
              <SelectItem value="complete">Complete</SelectItem>
            </SelectContent>
          </Select>
          <Select value={phase} onValueChange={(v) => { if (v !== null) setPhase(v) }}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Phase" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Phases</SelectItem>
              {phases.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Project</TableHead>
              <TableHead>Project Type</TableHead><TableHead>Promised Completion</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Project Manager</TableHead>
              <TableHead>Current Phase</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Forecast</TableHead>
              <TableHead>Variance</TableHead>
              <TableHead>Health</TableHead>
              <TableHead className="text-right">Open Items</TableHead>
              <TableHead className="text-right">Cost Exposure</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => {
              const meta = projectHealthMeta(p.health)
              const isPrimary = p.id === "pwt-001"
              const openItems = isPrimary
                ? changes.filter((c) => !["approved", "rejected"].includes(c.status)).length +
                  issues.filter((i) => i.status !== "resolved").length +
                  actions.filter((a) => a.status === "overdue").length
                : p.health === "at-risk"
                  ? 2
                  : 0
              return (
                <TableRow key={p.id}>
                  <TableCell className="max-w-[260px]">
                    <Link
                      href={`/projects/${p.id}`}
                      className="truncate font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {p.name}
                    </Link>
                    <div className="truncate text-xs text-muted-foreground">{p.facility}</div>
                  </TableCell>
                  <TableCell>{p.projectType}</TableCell><TableCell>{formatShort(p.promisedCompletion)}</TableCell>
                  <TableCell className="text-muted-foreground">{p.client}</TableCell>
                  <TableCell>
                    <PersonChip personId={p.projectManagerId} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.currentPhase}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${p.progress}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{p.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatShort(p.forecastCompletion)}</TableCell>
                  <TableCell className={p.scheduleVarianceDays > 0 ? "text-warning-foreground font-medium" : "text-muted-foreground"}>
                    {p.scheduleVarianceDays > 0 ? `+${p.scheduleVarianceDays} Days` : "On Schedule"}
                  </TableCell>
                  <TableCell>
                    <StatusChip label={meta.label} tone={meta.tone} />
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{isPrimary ? `${changes.filter(c => !["approved", "rejected"].includes(c.status)).length} changes · ${issues.filter(i => i.status !== "resolved").length} issues · ${actions.filter(a => a.status === "overdue").length} overdue actions` : "No items logged"}</TableCell>
                  <TableCell className="text-right font-medium text-foreground">
                    {p.costExposure > 0 ? formatCurrency(p.costExposure) : "—"}
                  </TableCell>
                </TableRow>
              )
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={12} className="py-10 text-center text-sm text-muted-foreground">
                  No projects match the current filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
