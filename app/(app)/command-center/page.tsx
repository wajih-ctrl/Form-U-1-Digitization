"use client"

import type { ElementType } from "react"
import Link from "next/link"
import {
  ArrowRight,
  CalendarClock,
  ChevronRight,
  ClipboardList,
  Coins,
  FlaskConical,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react"
import { useAppState, formatShort, formatCurrency } from "@/lib/store"
import { PRIMARY_PROJECT_ID, personById } from "@/lib/mock-data"
import { PageHeader } from "@/components/shared/page-header"
import { StatusChip } from "@/components/shared/status-chip"
import { PersonChip } from "@/components/shared/person-chip"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  changeMeta,
  issueMeta,
  milestoneMeta,
  projectHealthMeta,
  readinessMeta,
  stageMeta,
} from "@/lib/status-meta"

export default function CommandCenterPage() {
  const state = useAppState()
  const project = state.projects.find((p) => p.id === PRIMARY_PROJECT_ID)!
  const health = projectHealthMeta(project.health)

  const attentionItems = buildAttentionItems(state)
  const openChanges = state.changes.filter((c) => !["approved", "rejected"].includes(c.status)).length
  const openIssues = state.issues.filter((i) => i.status !== "resolved").length
  const overdueActions = state.actions.filter((a) => a.status === "overdue").length
  const pmDecisions = state.changes.filter((c) => c.status === "awaiting-pm-decision").length
  const highImpact = state.changes.filter((c) => c.highImpact && c.status === "awaiting-pm-decision").length

  const functionHealth = ["Technical / Lab", "Operations", "Procurement / Logistics", "Commercial", "Client"].map(team => {
    const items = state.readinessItems.filter(r => r.team === team)
    const blocked = items.some(r => r.status === "blocked")
    const risk = items.some(r => r.status === "at-risk")
    const ready = items.length > 0 && items.every(r => r.status === "ready")
    return { label: team, status: blocked ? "Blocked" : risk ? "At Risk" : ready ? "Ready" : items.length ? "In Progress" : "No readiness items", tone: blocked ? "danger" as const : risk ? "warning" as const : ready ? "success" as const : "neutral" as const }
  })
  const waitingCounts = Object.fromEntries(["Client", "Technical", "Procurement", "Supplier"].map(team => [team, state.actions.filter(a => a.status !== "complete" && a.waitingOn.toLowerCase().includes(team.toLowerCase())).length]))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Command Center" description="Your project, priorities, and next decisions in one place." />

      <Card className="border-border">
        <CardContent className="flex flex-col gap-4 p-5 ">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/projects/${project.id}`} className="text-lg font-semibold text-foreground hover:underline">
                {project.name}
              </Link>
              <StatusChip label={health.label} tone={health.tone} />
            </div>
            <p className="text-sm text-muted-foreground">
              {project.client} · {project.facility} · PM {personById(project.projectManagerId).name}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-5 border-t border-border pt-5 sm:grid-cols-3 xl:grid-cols-6">
            <SummaryStat label="Current Phase" value={project.currentPhase} />
            <SummaryStat label="Progress" value={`${project.progress}%`} />
            <SummaryStat label="Promised" value={formatShort(project.promisedCompletion)} />
            <SummaryStat label="Forecast" value={formatShort(project.forecastCompletion)} tone="warning" />
            <SummaryStat label="Schedule" value={`+${project.scheduleVarianceDays} Days`} tone="warning" />
            <SummaryStat label="Cost Exposure" value={formatCurrency(project.costExposure)} tone="warning" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TriangleAlert className="size-4 text-warning-foreground" />
                What Needs Your Attention
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 p-4 pt-0">
              {attentionItems.length === 0 && <p className="p-5 text-sm text-muted-foreground">You’re all caught up. No project decisions need attention.</p>}
              {attentionItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group flex flex-col gap-2 rounded-lg border border-border p-3.5 transition-colors hover:border-primary/40 hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{item.title}</span>
                      <StatusChip label={item.statusLabel} tone={item.tone} />
                    </div>
                    <p className="text-xs text-muted-foreground">{item.type}</p>
                    <p className="text-xs text-muted-foreground">{item.impact}</p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 self-start text-sm font-medium text-primary group-hover:underline sm:self-center">
                    {item.cta}
                    <ChevronRight className="size-3.5" />
                  </span>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Project Health by Function</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col divide-y divide-border p-0">
              {functionHealth.map((row) => (
                <div key={row.label} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm font-medium text-foreground">{row.label}</span>
                  <StatusChip label={row.status} tone={row.tone} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-base">Execution Readiness Snapshot</CardTitle>
              <Button variant="ghost" size="sm" render={<Link href="/readiness" />}>
                View All
                <ArrowRight data-icon="inline-end" />
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col divide-y divide-border p-0">
              {state.readinessItems.map((item) => {
                const meta = readinessMeta(item.status)
                return (
                  <Link
                    key={item.id}
                    href="/readiness"
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/50"
                  >
                    <span className="text-sm font-medium text-foreground">{item.name}</span>
                    <StatusChip label={meta.label} tone={meta.tone} />
                  </Link>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col divide-y divide-border p-0">
              {state.activity.slice(0, 6).map((entry) => (
                <div key={entry.id} className="flex flex-col gap-1 px-4 py-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{entry.timestamp}</span>
                    <span>·</span>
                    <span>{entry.team}</span>
                  </div>
                  <p className="text-sm text-foreground">
                    {entry.event}{" "}
                    {entry.relatedObject && (
                      <Link href={entry.relatedObject.href} className="font-medium text-primary hover:underline">
                        {entry.relatedObject.label}
                      </Link>
                    )}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarClock className="size-4 text-muted-foreground" />
                Upcoming Milestones
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ol className="flex flex-col">
                {state.milestones.slice(3, 10).map((m, i) => {
                  const meta = milestoneMeta(m.status)
                  const moved = m.forecastDate !== m.originalDate
                  return (
                    <li key={m.id} className="relative flex gap-3 px-4 py-2.5">
                      <div className="flex flex-col items-center pt-0.5">
                        <span
                          className={`size-2 rounded-full ${
                            meta.tone === "success"
                              ? "bg-success-foreground"
                              : meta.tone === "danger"
                                ? "bg-danger-foreground"
                                : meta.tone === "warning"
                                  ? "bg-warning-foreground"
                                  : "bg-muted-foreground/40"
                          }`}
                        />
                        {i < 6 && <span className="mt-1 w-px flex-1 bg-border" />}
                      </div>
                      <Link href="/timeline" className="flex flex-1 flex-col pb-2 hover:opacity-80">
                        <span className="text-sm font-medium text-foreground">{m.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatShort(m.originalDate)}
                          {moved && (
                            <>
                              {" "}
                              <span className="text-warning-foreground">→ {formatShort(m.forecastDate)}</span>
                            </>
                          )}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dependencies</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col divide-y divide-border p-0">
              <DependencyRow label="Waiting on Client" value={waitingCounts.Client} />
              <DependencyRow label="Waiting on Technical" value={waitingCounts.Technical} />
              <DependencyRow label="Waiting on Procurement" value={waitingCounts.Procurement} />
              <DependencyRow label="Waiting on Supplier" value={waitingCounts.Supplier} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Open Work Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 p-4 pt-0">
              <OpenWorkStat icon={ClipboardList} label="Open Changes" value={openChanges} href="/changes" />
              <OpenWorkStat icon={TriangleAlert} label="Open Issues" value={openIssues} href="/issues" />
              <OpenWorkStat icon={ShieldCheck} label="Overdue Actions" value={overdueActions} href="/actions" tone="danger" />
              <OpenWorkStat icon={FlaskConical} label="PM Decisions" value={pmDecisions} href="/changes" tone="warning" />
              <OpenWorkStat icon={Coins} label="High Impact Items" value={highImpact} href="/cost-impact" tone="warning" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function SummaryStat({ label, value, tone }: { label: string; value: string; tone?: "warning" }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{label}</span>
      <span className={`text-sm font-semibold ${tone === "warning" ? "text-warning-foreground" : "text-foreground"}`}>
        {value}
      </span>
    </div>
  )
}

function DependencyRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-sm text-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  )
}

function OpenWorkStat({
  icon: Icon,
  label,
  value,
  href,
  tone,
}: {
  icon: ElementType
  label: string
  value: number
  href: string
  tone?: "warning" | "danger"
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-1.5 rounded-lg border border-border p-3 transition-colors hover:border-primary/40 hover:bg-muted/50"
    >
      <Icon
        className={`size-4 ${tone === "danger" ? "text-danger-foreground" : tone === "warning" ? "text-warning-foreground" : "text-muted-foreground"}`}
      />
      <span
        className={`text-xl font-semibold leading-none ${tone === "danger" ? "text-danger-foreground" : tone === "warning" ? "text-warning-foreground" : "text-foreground"}`}
      >
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </Link>
  )
}

function buildAttentionItems(state: ReturnType<typeof useAppState>) {
  const items: {
    id: string
    title: string
    type: string
    impact: string
    statusLabel: string
    tone: "success" | "warning" | "danger" | "info" | "neutral"
    cta: string
    href: string
  }[] = []

  const cr003 = state.changes.find((c) => c.id === "cr-003")
  if (cr003 && cr003.status === "awaiting-pm-decision") {
    const meta = changeMeta(cr003.status)
    items.push({
      id: cr003.id,
      title: `${cr003.id.toUpperCase()} · ${cr003.title}`,
      type: "PM Decision",
      impact: `+${cr003.combinedImpact.scheduleDays} Days · ${formatCurrency(cr003.combinedImpact.cost)}`,
      statusLabel: meta.label,
      tone: meta.tone,
      cta: "Review Change",
      href: `/changes/${cr003.id}`,
    })
  }

  const delivery = state.issues.find((i) => i.id === "iss-1")
  if (delivery && delivery.status !== "resolved") {
    const meta = issueMeta(delivery.status)
    items.push({
      id: delivery.id,
      title: delivery.title,
      type: "Procurement Issue",
      impact: "Mobilization at Risk",
      statusLabel: meta.label,
      tone: meta.tone,
      cta: "View Issue",
      href: "/issues",
    })
  }

  const proposal = state.technicalStages.find((s) => s.id === "stage-5")
  if (proposal && proposal.status === "at-risk") {
    const meta = stageMeta(proposal.status)
    items.push({
      id: proposal.id,
      title: "Technical Proposal",
      type: "Technical Dependency",
      impact: `Waiting on ${proposal.waitingOn ?? "Technical"}`,
      statusLabel: meta.label,
      tone: meta.tone,
      cta: "Open Technical Stage",
      href: "/technical",
    })
  }

  const clientApproval = state.readinessItems.find((r) => r.id === "rd-7")
  if (clientApproval && clientApproval.status === "blocked") {
    const meta = readinessMeta(clientApproval.status)
    items.push({
      id: clientApproval.id,
      title: "Client Technical Approval",
      type: "Client Dependency",
      impact: "Execution Readiness Blocked",
      statusLabel: "Overdue",
      tone: "danger",
      cta: "Review Dependency",
      href: "/readiness",
    })
  }

  return items
}
