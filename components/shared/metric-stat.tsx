import type { ReactNode } from "react"
import { cn } from "cn"

export function MetricStat({
  label,
  value,
  context,
  tone = "default",
  className,
}: {
  label: string
  value: ReactNode
  context?: ReactNode
  tone?: "default" | "warning" | "danger" | "success"
  className?: string
}) {
  return (
    <div className={cn("min-w-0 flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-[0_2px_8px_-4px_rgba(15,30,41,0.12)]", className)}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-[clamp(1.25rem,2vw,1.875rem)] leading-tight break-words tabular-nums font-semibold tracking-tight",
          tone === "default" && "text-foreground",
          tone === "warning" && "text-warning-foreground",
          tone === "danger" && "text-danger-foreground",
          tone === "success" && "text-success-foreground"
        )}
      >
        {value}
      </span>
      {context && <span className="text-xs text-muted-foreground">{context}</span>}
    </div>
  )
}

export function MetricRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5", className)}>
      {children}
    </div>
  )
}
