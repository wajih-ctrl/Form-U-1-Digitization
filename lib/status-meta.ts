export type Tone = "success" | "warning" | "danger" | "info" | "neutral"

export const toneClasses: Record<Tone, string> = {
  success: "bg-success text-success-foreground border-success-foreground/10",
  warning: "bg-warning text-warning-foreground border-warning-foreground/10",
  danger: "bg-danger text-danger-foreground border-danger-foreground/10",
  info: "bg-info text-info-foreground border-info-foreground/10",
  neutral: "bg-neutral-status text-neutral-status-foreground border-neutral-status-foreground/10",
}

export function projectHealthMeta(status: string): { label: string; tone: Tone } {
  switch (status) {
    case "on-track":
      return { label: "On Track", tone: "success" }
    case "at-risk":
      return { label: "At Risk", tone: "warning" }
    case "delayed":
      return { label: "Delayed", tone: "danger" }
    case "complete":
      return { label: "Complete", tone: "success" }
    default:
      return { label: status, tone: "neutral" }
  }
}

export function readinessMeta(status: string): { label: string; tone: Tone } {
  switch (status) {
    case "ready":
      return { label: "Ready", tone: "success" }
    case "in-progress":
      return { label: "In Progress", tone: "info" }
    case "at-risk":
      return { label: "At Risk", tone: "warning" }
    case "blocked":
      return { label: "Blocked", tone: "danger" }
    case "not-started":
      return { label: "Not Started", tone: "neutral" }
    default:
      return { label: status, tone: "neutral" }
  }
}

export function stageMeta(status: string): { label: string; tone: Tone } {
  switch (status) {
    case "completed":
      return { label: "Completed", tone: "success" }
    case "in-progress":
      return { label: "In Progress", tone: "info" }
    case "at-risk":
      return { label: "At Risk", tone: "warning" }
    case "blocked":
      return { label: "Blocked", tone: "danger" }
    case "not-started":
      return { label: "Not Started", tone: "neutral" }
    default:
      return { label: status, tone: "neutral" }
  }
}

export function milestoneMeta(status: string): { label: string; tone: Tone } {
  switch (status) {
    case "completed":
      return { label: "Completed", tone: "success" }
    case "in-progress":
      return { label: "In Progress", tone: "info" }
    case "at-risk":
      return { label: "At Risk", tone: "warning" }
    case "delayed":
      return { label: "Delayed", tone: "danger" }
    case "upcoming":
      return { label: "Upcoming", tone: "neutral" }
    default:
      return { label: status, tone: "neutral" }
  }
}

export function changeMeta(status: string): { label: string; tone: Tone } {
  switch (status) {
    case "assessment-in-progress":
      return { label: "Assessment In Progress", tone: "info" }
    case "impact-review-complete":
      return { label: "Impact Review Complete", tone: "info" }
    case "awaiting-pm-decision":
      return { label: "Awaiting PM Decision", tone: "warning" }
    case "approved":
      return { label: "Approved", tone: "success" }
    case "rejected":
      return { label: "Rejected", tone: "danger" }
    case "clarification-requested":
      return { label: "Clarification Requested", tone: "warning" }
    case "escalated":
      return { label: "Escalated", tone: "danger" }
    default:
      return { label: status, tone: "neutral" }
  }
}

export function issueMeta(status: string): { label: string; tone: Tone } {
  switch (status) {
    case "open":
      return { label: "Open", tone: "info" }
    case "in-review":
      return { label: "In Review", tone: "info" }
    case "waiting-for-input":
      return { label: "Waiting for Input", tone: "warning" }
    case "at-risk":
      return { label: "At Risk", tone: "warning" }
    case "overdue":
      return { label: "Overdue", tone: "danger" }
    case "resolved":
      return { label: "Resolved", tone: "success" }
    case "escalated":
      return { label: "Escalated", tone: "danger" }
    default:
      return { label: status, tone: "neutral" }
  }
}

export function actionMeta(status: string): { label: string; tone: Tone } {
  switch (status) {
    case "open":
      return { label: "Open", tone: "info" }
    case "in-progress":
      return { label: "In Progress", tone: "info" }
    case "waiting":
      return { label: "Waiting", tone: "warning" }
    case "overdue":
      return { label: "Overdue", tone: "danger" }
    case "complete":
      return { label: "Complete", tone: "success" }
    default:
      return { label: status, tone: "neutral" }
  }
}

export function severityMeta(status: string): { label: string; tone: Tone } {
  switch (status) {
    case "critical":
      return { label: "Critical", tone: "danger" }
    case "high":
      return { label: "High", tone: "warning" }
    case "medium":
      return { label: "Medium", tone: "info" }
    case "low":
      return { label: "Low", tone: "neutral" }
    default:
      return { label: status, tone: "neutral" }
  }
}

export function priorityMeta(status: string): { label: string; tone: Tone } {
  switch (status) {
    case "high":
      return { label: "High", tone: "danger" }
    case "medium":
      return { label: "Medium", tone: "warning" }
    case "low":
      return { label: "Low", tone: "neutral" }
    default:
      return { label: status, tone: "neutral" }
  }
}

export function documentStatusMeta(status: string): { label: string; tone: Tone } {
  switch (status) {
    case "final":
      return { label: "Final", tone: "success" }
    case "draft":
      return { label: "Draft", tone: "warning" }
    case "pending-review":
      return { label: "Pending Review", tone: "info" }
    default:
      return { label: status, tone: "neutral" }
  }
}
