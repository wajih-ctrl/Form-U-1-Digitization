"use client"

import Link from "next/link"
import { GlobalSearch } from "@/components/shared/global-search"
import { useRouter, usePathname } from "next/navigation"
import { Activity, LogOut, Menu, Search, UserCog } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ROLE_LABELS } from "@/lib/nav"
import { useAppState } from "@/lib/store"
import { PROJECTS, PRIMARY_PROJECT_ID } from "@/lib/mock-data"

export function Topbar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const { role, activity, projects } = useAppState()
  const router = useRouter()
  const pathname = usePathname()
  const activeProject = projects.find(p => pathname.startsWith(`/projects/${p.id}`)) ?? projects.find(p => p.id === PRIMARY_PROJECT_ID)!
  const portfolio = ["/projects", "/management", "/admin", "/admin/users", "/settings"].includes(pathname)
  const unread = 0

  return (
    <header className="flex h-18 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMobileNav} aria-label="Open navigation">
        <Menu />
      </Button>

      <div className="hidden items-center gap-2 md:flex">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" size="sm" className="max-w-[300px] min-w-0 justify-between font-medium">
                <span className="truncate">{portfolio ? "Portfolio workspace" : activeProject.name}</span>
              </Button>
            }
          />
          <DropdownMenuContent align="start" className="w-72">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Switch Project</DropdownMenuLabel>
              {projects.map((p) => (
                <DropdownMenuItem key={p.id} onClick={() => router.push(p.id === PRIMARY_PROJECT_ID && role === "project-manager" ? "/command-center" : `/projects/${p.id}`)}>
                  <span className="truncate">{p.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="ml-auto min-w-0"><GlobalSearch /></div>

      <Button variant="ghost" size="icon" aria-label="Activity" onClick={() => router.push("/activity")} className="relative">
        <Activity />
        {unread > 0 && (
          <span className="absolute top-1 right-1 flex size-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-primary-foreground">
            {unread}
          </span>
        )}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button className="flex items-center gap-2 rounded-md py-1 pl-1 pr-2 hover:bg-muted" aria-label="Profile menu">
              <Avatar className="size-7 border border-border">
                <AvatarFallback className="text-xs">
                  {ROLE_LABELS[role]
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:inline">{ROLE_LABELS[role]}</span>
            </button>
          }
        />
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Previewing role</DropdownMenuLabel>
            <div className="px-2 pb-2 text-sm font-medium text-foreground">{ROLE_LABELS[role]}</div>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <UserCog data-icon="inline-start" />
              Role Responsibilities
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/")}>
              <LogOut data-icon="inline-start" />
              Switch Role
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
