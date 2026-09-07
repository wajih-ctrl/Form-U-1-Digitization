"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import { cn } from "cn"

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}) {
  const pathname = usePathname()
  const parent = pathname.includes("/setup") ? { href: pathname.replace("/setup", ""), label: "Project overview" } : pathname.startsWith("/projects/") ? { href: "/projects", label: "Projects" } : pathname.startsWith("/changes/") ? { href: "/changes", label: "Changes" } : pathname.startsWith("/admin/") ? { href: "/admin", label: "Administration" } : null
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-4", className)}>
      <div className="min-w-0 flex flex-col gap-2">
        {parent && <Link className="mb-1 self-start text-xs font-medium text-muted-foreground hover:text-primary" href={parent.href}>← {parent.label}</Link>}
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground text-balance">{title}</h1>
        {description && <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
