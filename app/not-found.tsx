import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
export default function NotFound() {
  return <section aria-label="Record not found" className="mx-auto flex min-h-[65dvh] max-w-lg flex-col items-start justify-center gap-4 p-8"><p className="text-xs font-semibold uppercase tracking-widest text-primary">404 · Record not found</p><h1 className="text-3xl font-semibold">This page isn’t available</h1><p className="text-muted-foreground">The link may be incorrect or the record may no longer exist. Find your project in the portfolio.</p><Link className={buttonVariants()} href="/projects">Back to Projects</Link></section>
}
