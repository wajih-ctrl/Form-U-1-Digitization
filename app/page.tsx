"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Building2,
  ClipboardCheck,
  FlaskConical,
  Gauge,
  LineChart,
  ShieldQuestion,
  Truck,
  Wrench,
} from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { useAppState } from "@/lib/store"
import { defaultRouteForRole, ROLE_LABELS } from "@/lib/nav"
import type { Role } from "@/lib/types"

const ROLE_OPTIONS: { role: Role; description: string; icon: React.ElementType }[] = [
  {
    role: "project-manager",
    description: "Coordinate execution, review combined impact, and make project-level decisions.",
    icon: Gauge,
  },
  {
    role: "technical",
    description: "Own laboratory analysis, treatment testing, and technical assessments.",
    icon: FlaskConical,
  },
  {
    role: "operations",
    description: "Own manpower, equipment readiness, mobilization, and field execution.",
    icon: Wrench,
  },
  {
    role: "commercial",
    description: "Own commercial scope, cost review, and additional-cost assessments.",
    icon: ClipboardCheck,
  },
  {
    role: "procurement",
    description: "Own materials, chemical availability, supplier dependencies, and logistics.",
    icon: Truck,
  },
  {
    role: "management",
    description: "Portfolio-level visibility into health, exposure, and escalations.",
    icon: LineChart,
  },
  {
    role: "admin",
    description: "Manage mocked system data, users, and roles.",
    icon: ShieldQuestion,
  },
]

export default function RoleSelectionPage() {
  const [selected, setSelected] = React.useState<Role>("project-manager")
  const { setRole } = useAppState()
  const router = useRouter()

  function handleEnter() {
    setRole(selected)
    router.push(defaultRouteForRole(selected))
  }

  return (
    <main className="flex min-h-dvh w-full flex-col bg-background lg:flex-row">
      <section className="relative flex flex-1 flex-col justify-between overflow-hidden bg-sidebar px-8 py-10 text-sidebar-foreground sm:px-14 sm:py-8 lg:py-16 lg:w-[46%]">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Gauge className="size-4.5" />
          </div>
          <span className="text-sm font-semibold tracking-wide text-sidebar-foreground">MERIDIAN COMMAND</span>
        </div>

        <div className="flex max-w-md flex-col gap-6 py-16">
          <h1 className="text-4xl leading-[1.1] font-semibold tracking-tight text-balance text-sidebar-foreground sm:text-5xl">
            Project Execution &amp; Operational Visibility
          </h1>
          <p className="text-base leading-relaxed text-sidebar-foreground/70">
            Coordinate technical, operational, commercial and project execution from one project-level view.
          </p>

          <div className="mt-4 flex flex-col gap-3 border-t border-sidebar-border pt-6">
            <div className="flex items-center gap-3">
              <Building2 className="size-4 text-sidebar-primary" />
              <span className="text-sm text-sidebar-foreground/80">
                Gulf Energy Corporation · North Field Processing Facility
              </span>
            </div>
            <p className="text-sm leading-relaxed text-sidebar-foreground/60">
              Live scenario: Produced Water Treatment Optimization is currently{" "}
              <span className="font-medium text-amber-300">At Risk</span> with a change request awaiting
              Project Manager decision.
            </p>
          </div>
        </div>

        <p className="text-xs text-sidebar-foreground/70">Execution Readiness · Sample environment · No live data connections</p>
      </section>

      <section className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10">
        <div className="flex w-full max-w-lg flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-foreground">Enter Workspace</h2>
            <p className="text-sm text-muted-foreground">Select a role to preview its operational view.</p>
          </div>

          <div className="flex flex-col gap-2">
            {ROLE_OPTIONS.map((opt) => {
              const Icon = opt.icon
              const active = selected === opt.role
              return (
                <button
                  key={opt.role}
                  onClick={() => setSelected(opt.role)}
                  aria-pressed={active}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
                    active
                      ? "border-primary bg-accent ring-1 ring-primary"
                      : "border-border bg-card hover:border-primary/40 hover:bg-muted/60"
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md",
                      active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-foreground">{ROLE_LABELS[opt.role]}</span>
                    <span className="text-xs leading-relaxed text-muted-foreground">{opt.description}</span>
                  </div>
                </button>
              )
            })}
          </div>

          <Button size="lg" className="h-10 w-full text-sm" onClick={handleEnter}>
            Enter Workspace
          </Button>
        </div>
      </section>
    </main>
  )
}
