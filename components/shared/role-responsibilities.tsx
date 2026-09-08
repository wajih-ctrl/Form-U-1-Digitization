"use client"
import Link from "next/link"
import { useAppState } from "@/lib/store"
import { ROLE_LABELS } from "@/lib/nav"
import { PageHeader } from "./page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
export const ROLE_RESPONSIBILITIES = {
  "project-manager": "Coordinates project execution, owns project-level decisions, maintains project details, coordinates issues/actions, and records external client confirmations. Specialist findings remain with the responsible team.",
  technical: "Owns laboratory and technical stages, technical readiness, technical records, technical impact assessments, performance verification, and the technical completion report.",
  operations: "Owns equipment, manpower, site and execution readiness, mobilization, field progress, operational issues, and Operations impact assessments.",
  procurement: "Owns material/chemical availability, supplier delivery and logistics dependencies, procurement readiness, and Procurement/Logistics impact assessments.",
  commercial: "Owns awarded commercial scope, commercial commitments, commercial impact assessments, commercial actions, and commercial closure. Does not approve project-level changes.",
  management: "Read-only portfolio and project visibility, including major changes, delays, cost/timeline exposure, client dependencies, PM decisions, and escalations.",
  admin: "Manages mocked users, role assignments, projects, phases, categories, status labels, and technical stage definitions. Does not record PM decisions or specialist findings.",
}
export default function RoleResponsibilities() {
  const {role}=useAppState()
  return <div className="space-y-6"><PageHeader title="Role Responsibilities" description="Seven internal roles with distinct responsibilities. Client and Supplier remain external dependencies." actions={<Button variant="outline" render={<Link href="/" />}>Switch Role</Button>} /><Card className="p-6"><p className="mb-2 text-xs text-muted-foreground">CURRENT ROLE</p><h2 className="mb-2 text-xl font-semibold">{ROLE_LABELS[role]}</h2><p className="text-muted-foreground">{ROLE_RESPONSIBILITIES[role]}</p></Card><div className="divide-y rounded-xl border bg-card">{Object.entries(ROLE_RESPONSIBILITIES).map(([key,text])=><div key={key} className="grid gap-2 p-5 sm:grid-cols-[200px_1fr]"><h3 className="font-semibold">{ROLE_LABELS[key as keyof typeof ROLE_LABELS]}</h3><p className="text-sm leading-relaxed text-muted-foreground">{text}</p></div>)}</div><p className="text-sm text-muted-foreground">Clickable prototype only. Role selection previews permissions; it is not authentication. All project records and confirmations are mocked.</p></div>
}
