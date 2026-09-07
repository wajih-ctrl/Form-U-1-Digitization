"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "cn"
import { useAppState } from "@/lib/store"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent } from "@/components/ui/card"

const FILTERS = ["All", "PM Decisions", "Technical", "Operations", "Commercial", "Procurement", "Client Related"] as const

const CATEGORY_MAP: Record<string, string> = {
  "pm-decision": "PM Decisions",
  technical: "Technical",
  operations: "Operations",
  commercial: "Commercial",
  procurement: "Procurement",
  client: "Client Related",
}

export default function ActivityPage() {
  const { activity } = useAppState()
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]>("All")

  const filtered = activity.filter((a) => filter === "All" || CATEGORY_MAP[a.category] === filter)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Activity & Project History" description="Traceable, audit-style record of every project decision and status change." />

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

      <Card>
        <CardContent className="flex flex-col p-0">
          {filtered.map((entry, i) => (
            <div key={entry.id} className="flex gap-4 border-b border-border px-5 py-4 last:border-b-0">
              <div className="flex w-20 shrink-0 flex-col text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{entry.timestamp.split(" ").slice(2).join(" ")}</span>
                <span>{entry.timestamp.split(" ").slice(0, 2).join(" ")}</span>
              </div>
              <div className="flex flex-1 flex-col gap-1 border-l border-border pl-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{entry.person}</span>
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
            </div>
          ))}
          {filtered.length === 0 && <div className="px-5 py-10 text-center text-sm text-muted-foreground">No activity in this category yet.</div>}
        </CardContent>
      </Card>
    </div>
  )
}
