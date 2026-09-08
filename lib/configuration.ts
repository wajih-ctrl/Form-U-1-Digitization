export const DEFAULT_CONFIGURATION = {
  phases: ["Contract Award", "Client Technical Requirement", "Sample Collection / Receipt", "Laboratory Analysis", "Treatment Testing", "Technical Evaluation", "Technical Proposal", "Client Technical Review", "Execution Readiness", "Mobilization", "Field Execution", "Performance Verification", "Technical Completion", "Client Validation", "Project Closure"],
  issueCategories: ["Procurement", "Client", "Technical", "Operations", "Equipment", "Site Access", "Mobilization"],
  changeCategories: ["Client", "Internal", "Technical", "Operations"],
  statusLabels: Object.fromEntries(["Ready", "In Progress", "At Risk", "Blocked", "Not Started", "Completed", "Open", "In Review", "Waiting for Input", "Overdue", "Resolved", "Escalated", "Approved", "Rejected", "Awaiting PM Decision", "Assessment In Progress", "Impact Review Complete"].map(label => [label, label])),
}
export type Configuration = typeof DEFAULT_CONFIGURATION
