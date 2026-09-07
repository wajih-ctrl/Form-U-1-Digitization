"use client"

import Link from "next/link"
import { ClipboardList, GitPullRequestArrow, Layers, ListChecks, TriangleAlert, Users } from "lucide-react"
import { useAppState } from "@/lib/store"
import { PEOPLE } from "@/lib/mock-data"
import { PageHeader } from "@/components/shared/page-header"
import { MetricStat } from "@/components/shared/metric-stat"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const ADMIN_SECTIONS = [
  { label: "Projects", description: "Manage project records and metadata.", icon: Layers, href: "/projects" },
  { label: "Users", description: "Manage system users and access.", icon: Users, href: "/admin/users" },
  { label: "Roles", description: "Define role-to-workspace mapping.", icon: Users, href: "/admin/users" },
  { label: "Project Phases", description: "Configure the technical workflow phases.", icon: ListChecks, href: "/technical" },
  { label: "Status Reference", description: "Understand workflow statuses and their meaning.", icon: ClipboardList, href: "/admin/statuses" },
  { label: "Issue Categories", description: "Manage issue categorization used in the register.", icon: TriangleAlert, href: "/issues" },
  { label: "Change Categories", description: "Manage change request categorization.", icon: GitPullRequestArrow, href: "/changes" },
  { label: "Technical Stages", description: "Configure the technical stage pipeline.", icon: ListChecks, href: "/technical" },
]

export default function AdminDashboardPage() {
  const { projects, changes, issues, actions, users } = useAppState()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="System Administration" description="Workspace configuration, sample users, and project health." />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricStat label="Total Projects" value={projects.length} />
        <MetricStat label="Active Projects" value={projects.filter((p) => p.status === "Active").length} />
        <MetricStat label="Total Users" value={users.length} />
        <MetricStat label="Projects at Risk" value={projects.filter((p) => p.health === "at-risk").length} tone="warning" />
        <MetricStat label="Open Changes" value={changes.filter((c) => !["approved", "rejected"].includes(c.status)).length} />
        <MetricStat label="Open Issues" value={issues.filter((i) => i.status !== "resolved").length} />
        <MetricStat label="Overdue Actions" value={actions.filter((a) => a.status === "overdue").length} tone="danger" />
        <MetricStat label="Completed Projects" value={projects.filter((p) => p.status === "Closed").length} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">System Configuration</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 p-4 pt-0 sm:grid-cols-2 lg:grid-cols-4">
          {ADMIN_SECTIONS.map((section) => {
            const Icon = section.icon
            return (
              <Link
                key={section.label}
                href={section.href}
                className="flex flex-col gap-2 rounded-lg border border-border p-4 transition-colors hover:border-primary/40 hover:bg-muted/50"
              >
                <Icon className="size-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">{section.label}</span>
                <span className="text-xs text-muted-foreground">{section.description}</span>
              </Link>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
