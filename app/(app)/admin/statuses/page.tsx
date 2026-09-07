import { PageHeader } from "@/components/shared/page-header"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { StatusChip } from "@/components/shared/status-chip"
import { stageMeta, readinessMeta, changeMeta, issueMeta, actionMeta } from "@/lib/status-meta"

const groups = [
  { title: "Technical stages", values: ["not-started", "in-progress", "at-risk", "blocked", "completed"], meta: stageMeta },
  { title: "Execution readiness", values: ["not-started", "in-progress", "at-risk", "blocked", "ready"], meta: readinessMeta },
  { title: "Change review", values: ["assessment-in-progress", "impact-review-complete", "awaiting-pm-decision", "clarification-requested", "escalated", "approved", "rejected"], meta: changeMeta },
  { title: "Issues", values: ["open", "in-review", "waiting-for-input", "at-risk", "overdue", "escalated", "resolved"], meta: issueMeta },
  { title: "Actions", values: ["open", "in-progress", "waiting", "overdue", "complete"], meta: actionMeta },
]
export default function StatusReferencePage() {
  return <div className="space-y-6"><PageHeader title="Status Reference" description="The shared vocabulary used across project workflows. Statuses are defined by the application." /><div className="grid gap-5 md:grid-cols-2">{groups.map(group => <Card key={group.title}><CardHeader><CardTitle>{group.title}</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-3">{group.values.map(value => { const meta = group.meta(value); return <StatusChip key={value} label={meta.label} tone={meta.tone} /> })}</CardContent></Card>)}</div></div>
}
