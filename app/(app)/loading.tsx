export default function Loading() {
  return <div role="status" aria-label="Loading page" className="space-y-6"><div className="h-9 w-60 animate-pulse rounded-lg bg-muted" /><div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{[0,1,2,3].map(n => <div key={n} className="h-28 animate-pulse rounded-xl border border-border bg-card" />)}</div><div className="h-72 animate-pulse rounded-xl border border-border bg-card" /><span className="sr-only">Loading your project view…</span></div>
}
