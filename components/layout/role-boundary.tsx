"use client"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useAppState } from "@/lib/store"
import { canVisit } from "@/lib/permissions"
import { defaultRouteForRole, ROLE_LABELS } from "@/lib/nav"
import { Button } from "@/components/ui/button"
export function RoleBoundary({ children }: { children: React.ReactNode }) {
  const { role } = useAppState()
  const path = usePathname()
  if (canVisit(role, path)) return children
  return <div className="max-w-xl space-y-4 rounded-xl border bg-card p-8"><h1 className="text-2xl font-semibold">This view belongs to another role</h1><p className="text-muted-foreground">You are previewing {ROLE_LABELS[role]}. Use your workspace for the responsibilities assigned to this role.</p><Button render={<Link href={defaultRouteForRole(role)} />}>Return to my workspace</Button><Button variant="outline" render={<Link href="/" />}>Switch Role</Button></div>
}
