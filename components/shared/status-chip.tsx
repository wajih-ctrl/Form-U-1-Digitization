"use client"

import { useAppState } from "@/lib/store"
import { cn } from "cn"
import { toneClasses, type Tone } from "@/lib/status-meta"

export function StatusChip({
  label,
  tone,
  className,
}: {
  label: string
  tone: Tone
  className?: string
}) {
  const { configuration } = useAppState()
  const displayLabel = configuration.statusLabels[label] ?? label
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        toneClasses[tone],
        className
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          tone === "success" && "bg-success-foreground",
          tone === "warning" && "bg-warning-foreground",
          tone === "danger" && "bg-danger-foreground",
          tone === "info" && "bg-info-foreground",
          tone === "neutral" && "bg-neutral-status-foreground"
        )}
      />
      {displayLabel}
    </span>
  )
}
