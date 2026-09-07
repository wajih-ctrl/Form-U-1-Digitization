"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "./sidebar"
import { Topbar } from "./topbar"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const pathname = usePathname()
  const mainRef = React.useRef<HTMLElement>(null)
  React.useEffect(() => { mainRef.current?.scrollTo({ top: 0 }); setMobileOpen(false) }, [pathname])

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <div className="hidden lg:block">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar collapsed={false} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMobileNav={() => setMobileOpen(true)} />
        <main ref={mainRef} id="main-content" tabIndex={0} className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 p-4 sm:p-6 lg:p-8"><React.Suspense fallback={<p role="status" className="p-6 text-muted-foreground">Loading workspace…</p>}>{children}</React.Suspense></div>
        </main>
      </div>
    </div>
  )
}
