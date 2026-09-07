"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronsLeft, Gauge } from "lucide-react"
import { cn } from "cn"
import { getNavForRole } from "@/lib/nav"
import { useAppState } from "@/lib/store"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function Sidebar({
  collapsed,
  onToggle,
  onNavigate,
}: {
  collapsed: boolean
  onToggle?: () => void
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const { role } = useAppState()
  const nav = getNavForRole(role)

  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href + "/") && href !== "/admin")

  return (
    <aside
      className={cn(
        "flex h-full flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-18 items-center gap-2 border-b border-sidebar-border px-4">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
          <Gauge className="size-4" />
        </div>
        {!collapsed && (
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-semibold text-sidebar-foreground">Meridian Command</span>
            <span className="truncate text-[11px] text-sidebar-foreground/60">Execution Visibility</span>
          </div>
        )}
        {onToggle && !collapsed && (
          <button
            onClick={onToggle}
            className="ml-auto flex size-6 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            aria-label="Collapse sidebar"
          >
            <ChevronsLeft className="size-4" />
          </button>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3">
        {nav.main.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
        <div className="my-2 border-t border-sidebar-border" />
        {nav.secondary.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </nav>

      {collapsed && onToggle && (
        <div className="border-t border-sidebar-border p-2">
          <button
            onClick={onToggle}
            className="flex w-full items-center justify-center rounded-md py-1.5 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            aria-label="Expand sidebar"
          >
            <ChevronsLeft className="size-4 rotate-180" />
          </button>
        </div>
      )}
    </aside>
  )
}

function NavLink({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: { label: string; href: string; icon: any }
  active: boolean
  collapsed: boolean
  onNavigate?: () => void
}) {
  const Icon = item.icon
  const link = (
    <Link
      href={item.href}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-2.5 min-h-10 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        collapsed && "justify-center px-0",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground ring-1 ring-sidebar-primary/20"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
      )}
    >
      <Icon className={cn("size-4 shrink-0", active ? "text-sidebar-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-primary")} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  )

  if (!collapsed) return link

  return (
    <Tooltip>
      <TooltipTrigger render={link} />
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  )
}
