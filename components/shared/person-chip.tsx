"use client"

import { useAppState } from "@/lib/store"
import { cn } from "cn"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { personById } from "@/lib/mock-data"

export function PersonChip({
  personId,
  showRole = false,
  className,
}: {
  personId: string
  showRole?: boolean
  className?: string
}) {
  const { users } = useAppState()
  const person = users.find(p => p.id === personId) ?? personById(personId)
  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      <Avatar className="size-6 border border-border">
        <AvatarFallback className="text-[10px] font-medium">{person.initials}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-sm font-medium text-foreground">{person.name}</span>
        {showRole && <span className="truncate text-xs text-muted-foreground">{person.role}</span>}
      </div>
    </div>
  )
}

export function PersonBlock({ personId }: { personId: string }) {
  const { users } = useAppState()
  const person = users.find(p => p.id === personId) ?? personById(personId)
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3">
      <Avatar className="size-9 border border-border">
        <AvatarFallback className="text-xs font-medium">{person.initials}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-sm font-semibold text-foreground">{person.name}</span>
        <span className="truncate text-xs text-muted-foreground">{person.role}</span>
        <span className="truncate text-xs text-muted-foreground">{person.team}</span>
      </div>
    </div>
  )
}
