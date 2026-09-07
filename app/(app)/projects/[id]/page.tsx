"use client"

import * as React from "react"
import Link from "next/link"
import { notFound, useParams } from "next/navigation"
import { ArrowRight, Pencil } from "lucide-react"
import { useAppState, formatCurrency, formatShort } from "@/lib/store"
import { personById, PRIMARY_PROJECT_ID } from "@/lib/mock-data"
import { PageHeader } from "@/components/shared/page-header"
import { StatusChip } from "@/components/shared/status-chip"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  changeMeta,
  issueMeta,
  milestoneMeta,
  projectHealthMeta,
  readinessMeta,
  stageMeta,
} from "@/lib/status-meta"

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>()
  const state = useAppState()
  const project = state.projects.find((p) => p.id === params.id)
  if (!project) return notFound()

  const isPrimary = project.id === PRIMARY_PROJECT_ID
  const health = projectHealthMeta(project.health)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={project.name}
        description={project.scopeSummary}
        actions={
          <Button variant="outline" size="sm" render={<Link href={`/projects/${project.id}/setup`} />}>
            <Pencil data-icon="inline-start" />
            Edit Project
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-3 p-5">
          <Field label="Client" value={project.client} />
          <Field label="Facility" value={project.facility} />
          <Field label="Project Manager" value={personById(project.projectManagerId).name} />
          <Field label="Project Type" value={project.projectType} />
          <Field label="Current Phase" value={project.currentPhase} />
          <Field label="Progress" value={`${project.progress}%`} />
          <Field label="Promised" value={formatShort(project.promisedCompletion)} />
          <Field label="Forecast" value={formatShort(project.forecastCompletion)} />
          <Field label="Schedule" value={project.scheduleVarianceDays > 0 ? `+${project.scheduleVarianceDays} Days` : "On Schedule"} />
          <Field label="Commercial Exposure" value={project.costExposure > 0 ? formatCurrency(project.costExposure) : "$0"} />
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Health</span>
            <StatusChip label={health.label} tone={health.tone} />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList variant="line" className="flex-wrap justify-start">
          {[
            "Overview",
            "Technical",
            "Readiness",
            "Timeline",
            "Changes",
            "Issues",
            "Actions",
            "Documents",
            "Activity",
            "Completion",
          ].map((t) => (
            <TabsTrigger key={t} value={t.toLowerCase()}>
              {t}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="pt-4">
          <OverviewTab project={project} isPrimary={isPrimary} state={state} />
        </TabsContent>
        <TabsContent value="technical" className="pt-4">
          <MiniList
            emptyLabel="No technical stages logged for this project."
            items={
              isPrimary
                ? state.technicalStages.map((s) => ({ id: s.id, label: s.name, meta: stageMeta(s.status) }))
                : []
            }
            href="/technical"
            cta="Open Technical Workflow"
          />
        </TabsContent>
        <TabsContent value="readiness" className="pt-4">
          <MiniList
            emptyLabel="No readiness items logged for this project."
            items={
              isPrimary
                ? state.readinessItems.map((r) => ({ id: r.id, label: r.name, meta: readinessMeta(r.status) }))
                : []
            }
            href="/readiness"
            cta="Open Execution Readiness"
          />
        </TabsContent>
        <TabsContent value="timeline" className="pt-4">
          <MiniList
            emptyLabel="No milestones logged for this project."
            items={
              isPrimary
                ? state.milestones.map((m) => ({ id: m.id, label: m.name, meta: milestoneMeta(m.status) }))
                : []
            }
            href="/timeline"
            cta="Open Timeline"
          />
        </TabsContent>
        <TabsContent value="changes" className="pt-4">
          <MiniList
            emptyLabel="No changes logged for this project."
            items={
              isPrimary
                ? state.changes.map((c) => ({
                    id: c.id,
                    label: `${c.id.toUpperCase()} · ${c.title}`,
                    meta: changeMeta(c.status),
                    href: `/changes/${c.id}`,
                  }))
                : []
            }
            href="/changes"
            cta="Open Changes & Impact"
          />
        </TabsContent>
        <TabsContent value="issues" className="pt-4">
          <MiniList
            emptyLabel="No issues logged for this project."
            items={isPrimary ? state.issues.map((i) => ({ id: i.id, label: i.title, meta: issueMeta(i.status) })) : []}
            href="/issues"
            cta="Open Issues & Risks"
          />
        </TabsContent>
        <TabsContent value="actions" className="pt-4">
          <MiniList
            emptyLabel="No actions logged for this project."
            items={
              isPrimary
                ? state.actions.map((a) => ({
                    id: a.id,
                    label: a.title,
                    meta: { label: a.status, tone: "info" as const },
                  }))
                : []
            }
            href="/actions"
            cta="Open Actions & Responsibilities"
          />
        </TabsContent>
        <TabsContent value="documents" className="pt-4">
          <MiniList
            emptyLabel="No documents logged for this project."
            items={isPrimary ? state.documents.map((d) => ({ id: d.id, label: d.name, meta: { label: d.type, tone: "neutral" as const } })) : []}
            href="/documents"
            cta="Open Documents"
          />
        </TabsContent>
        <TabsContent value="activity" className="pt-4">
          <MiniList
            emptyLabel="No activity recorded for this project."
            items={isPrimary ? state.activity.slice(0, 6).map((a) => ({ id: a.id, label: a.event, meta: { label: a.team, tone: "neutral" as const } })) : []}
            href="/activity"
            cta="Open Activity History"
          />
        </TabsContent>
        <TabsContent value="completion" className="pt-4">
          {isPrimary ? (
            <Card>
              <CardContent className="flex flex-col items-start gap-3 p-5">
                <p className="text-sm text-muted-foreground">
                  Completion checklist and client validation status are tracked centrally for this project.
                </p>
                <Button size="sm" render={<Link href="/completion" />}>
                  Open Completion &amp; Client Validation
                  <ArrowRight data-icon="inline-end" />
                </Button>
              </CardContent>
            </Card>
          ) : (
            <EmptyCard label="Completion tracking has not started for this project." />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  )
}

function OverviewTab({ project, isPrimary, state }: { project: any; isPrimary: boolean; state: ReturnType<typeof useAppState> }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Scope Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-sm leading-relaxed text-muted-foreground">{project.scopeSummary}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Risks &amp; Required PM Decisions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border p-0">
            {isPrimary ? (
              <>
                {state.changes
                  .filter((c: any) => c.status === "awaiting-pm-decision")
                  .map((c: any) => (
                    <Link key={c.id} href={`/changes/${c.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-muted/50">
                      <span className="text-sm font-medium text-foreground">
                        {c.id.toUpperCase()} · {c.title}
                      </span>
                      <StatusChip label="Awaiting PM Decision" tone="warning" />
                    </Link>
                  ))}
                {state.issues
                  .filter((i: any) => i.pmAttention)
                  .slice(0, 3)
                  .map((i: any) => (
                    <Link key={i.id} href="/issues" className="flex items-center justify-between px-4 py-3 hover:bg-muted/50">
                      <span className="text-sm font-medium text-foreground">{i.title}</span>
                      <StatusChip label={issueMeta(i.status).label} tone={issueMeta(i.status).tone} />
                    </Link>
                  ))}
              </>
            ) : (
              <div className="px-4 py-6 text-sm text-muted-foreground">No open risks require project-level decisions right now.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current Readiness</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border p-0">
            {isPrimary ? (
              state.readinessItems.slice(0, 5).map((r: any) => (
                <div key={r.id} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm text-foreground">{r.name}</span>
                  <StatusChip label={readinessMeta(r.status).label} tone={readinessMeta(r.status).tone} />
                </div>
              ))
            ) : (
              <div className="px-4 py-6 text-sm text-muted-foreground">Readiness tracking begins closer to execution.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MiniList({
  items,
  href,
  cta,
  emptyLabel,
}: {
  items: { id: string; label: string; meta: { label: string; tone: any }; href?: string }[]
  href: string
  cta: string
  emptyLabel: string
}) {
  return (
    <Card>
      <CardContent className="flex flex-col divide-y divide-border p-0">
        {items.length === 0 ? (
          <EmptyCard label={emptyLabel} />
        ) : (
          items.map((item) => (
            <Link key={item.id} href={item.href ?? href} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/50">
              <span className="max-w-md truncate text-sm text-foreground">{item.label}</span>
              <StatusChip label={item.meta.label} tone={item.meta.tone} />
            </Link>
          ))
        )}
      </CardContent>
      {items.length > 0 && (
        <div className="border-t border-border p-3">
          <Button variant="ghost" size="sm" render={<Link href={href} />}>
            {cta}
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      )}
    </Card>
  )
}

function EmptyCard({ label }: { label: string }) {
  return <div className="px-4 py-8 text-center text-sm text-muted-foreground">{label}</div>
}
