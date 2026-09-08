import type { ActionItem, Issue, Milestone, TechnicalStage } from "./types"
export const CLOSEOUT_STEPS = [
  { id: "performance", label: "Performance Documentation", team: "Technical / Lab", person: "priya-nair", dependency: "Field execution and performance verification", note: "Confirm the specialist performance record is complete.", documentType: "Field Report" },
  { id: "report", label: "Technical Completion Report", team: "Technical / Lab", person: "omar-rahman", dependency: "Technical activities, field execution, issues, actions, and performance documentation", note: "Record completion of the specialist-reviewed technical report.", documentType: "Technical Completion Report" },
  { id: "client-review", label: "Client Review", team: "Client", person: "client-contact", dependency: "Technical Completion Report", note: "The Project Manager records receipt of the external client review.", documentType: "Client Approval" },
  { id: "signoff", label: "Client Validation / Sign-Off", team: "Client", person: "client-contact", dependency: "Client Review", note: "The Project Manager records the client’s external validation. This is not an internal technical approval.", documentType: "Client Validation" },
  { id: "commercial", label: "Commercial Closure", team: "Commercial", person: "michael-grant", dependency: "Client Validation / Sign-Off", note: "Confirm the mocked commercial reconciliation is complete.", documentType: "Commercial Closure" },
  { id: "closure", label: "Project Closure", team: "Project Management", person: "james-parker", dependency: "Commercial Closure", note: "The Project Manager records formal project closure and handover.", documentType: "Project Closure" },
] as const
export function canCompleteStep(id: string, records: Record<string,string>, stages: TechnicalStage[], milestones: Milestone[], issues: Issue[], actions: ActionItem[]) {
  const field = milestones.find(m => m.name === "Field Execution")?.status === "completed"
  if(id === "performance") return field && milestones.find(m => m.name === "Performance Verification")?.status === "completed"
  if(id === "report") return field && stages.every(s => s.status === "completed") && issues.every(i => i.status === "resolved") && actions.every(a => a.status === "complete") && !!records.performance
  const index = CLOSEOUT_STEPS.findIndex(s => s.id === id)
  return index > 1 && !!records[CLOSEOUT_STEPS[index-1].id]
}
