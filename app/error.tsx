"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <div role="alert" className="mx-auto flex min-h-[60dvh] max-w-lg flex-col items-start justify-center gap-4 p-8"><p className="text-xs font-semibold uppercase tracking-widest text-primary">Workspace unavailable</p><h1 className="text-3xl font-semibold">This view couldn’t load</h1><p className="text-muted-foreground">Try opening it again. Your saved project records remain in this browser.</p><div className="flex gap-3"><Button onClick={retry}>Try Again</Button><Button variant="outline" render={<Link href="/projects" />}>Go to Projects</Button></div></div>
}
