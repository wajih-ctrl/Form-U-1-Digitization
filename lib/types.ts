export type Role =
  | "project-manager"
  | "technical"
  | "operations"
  | "commercial"
  | "procurement"
  | "management"
  | "admin"

export type Team =
  | "Project Management"
  | "Technical / Lab"
  | "Operations"
  | "Procurement / Logistics"
  | "Commercial"
  | "Management"
  | "Client"
  | "Supplier"
  | "Admin"

export type ProjectHealth = "on-track" | "at-risk" | "delayed" | "complete"

export type ReadinessStatus = "ready" | "in-progress" | "at-risk" | "blocked" | "not-started"

export type StageStatus = "completed" | "in-progress" | "at-risk" | "blocked" | "not-started"

export type ChangeStatus =
  | "assessment-in-progress"
  | "impact-review-complete"
  | "awaiting-pm-decision"
  | "approved"
  | "rejected"
  | "clarification-requested"
  | "escalated"

export type IssueStatus =
  | "open"
  | "in-review"
  | "waiting-for-input"
  | "at-risk"
  | "overdue"
  | "resolved"
  | "escalated"

export type ActionStatus = "open" | "in-progress" | "waiting" | "overdue" | "complete"

export type Severity = "critical" | "high" | "medium" | "low"
export type Priority = "high" | "medium" | "low"

export interface Person {
  id: string
  name: string
  initials: string
  role: string
  team: Team
}

export interface Project {
  id: string
  name: string
  client: string
  facility: string
  projectManagerId: string
  projectType: string
  commercialCommitment?: string
  commercialNotes?: string
  clientContact?: string
  scopeSummary: string
  startDate: string
  promisedCompletion: string
  forecastCompletion: string
  currentPhase: string
  health: ProjectHealth
  progress: number
  scheduleVarianceDays: number
  costExposure: number
  status: string
}

export interface TechnicalStage {
  id: string
  name: string
  status: StageStatus
  team: Team
  assignedPersonId: string
  startDate?: string
  dueDate?: string
  completedDate?: string
  dependency?: string
  outcome?: string
  impactIfDelayed?: string
  linkedDocumentId?: string
  waitingOn?: string
}

export interface ReadinessItem {
  id: string
  name: string
  status: ReadinessStatus
  team: Team
  assignedPersonId: string
  dueDate: string
  dependency: string
  issue?: string
  impact?: string
  nextAction?: string
  latestUpdate?: string
  relatedChangeId?: string
  relatedIssueId?: string
}

export interface Milestone {
  id: string
  name: string
  originalDate: string
  forecastDate: string
  status: "completed" | "in-progress" | "at-risk" | "delayed" | "upcoming"
  team: Team
  dependency?: string
  delayReason?: string
  daysImpacted: number
  downstreamImpact?: string
}

export interface AssessmentRecord {
  team: Team
  ownerLabel: string
  assignedPersonId: string
  assessment: string
  status: "pending" | "in-progress" | "complete"
  extra?: Record<string, string>
}

export interface Change {
  id: string
  title: string
  source: "Client" | "Internal" | "Technical" | "Operations"
  dateRequested: string
  status: ChangeStatus
  highImpact: boolean
  originalScope: string
  requestedChange: string
  reason: string
  requestedBy: string
  affectedMilestoneIds: string[]
  assessments: {
    technical: AssessmentRecord
    procurement: AssessmentRecord
    operations: AssessmentRecord
    commercial: AssessmentRecord
  }
  combinedImpact: {
    scheduleDays: number
    cost: number
    originalCompletion: string
    forecastCompletion: string
  }
  pmDecision?: {
    status: "approved" | "rejected" | "clarification-requested" | "escalated"
    note: string
    decidedBy: string
    decidedAt: string
    extra?: Record<string, string>
  }
}

export interface Issue {
  id: string
  title: string
  category: string
  severity: Severity
  raisedBy: string
  team: Team
  assignedPersonId: string
  dateRaised: string
  dueDate: string
  affectedMilestone: string
  timelineImpact: string
  costImpact: string
  status: IssueStatus
  pmAttention: boolean
  description: string
  waitingOn: string
  requiredAction: string
  relatedChangeId?: string
}

export interface ActionItem {
  id: string
  title: string
  linkedItem: string
  linkedHref?: string
  team: Team
  assignedPersonId: string
  coordinatorId: string
  dueDate: string
  status: ActionStatus
  waitingOn: string
  priority: Priority
  impactIfLate: string
  nextStep: string
}

export interface DocumentRecord {
  id: string
  name: string
  type: string
  addedBy: string
  date: string
  stage: string
  relatedId?: string
  relatedLabel?: string
  status: "final" | "draft" | "pending-review"
  summary: string
}

export interface ActivityEntry {
  id: string
  timestamp: string
  team: Team
  person: string
  event: string
  category: "pm-decision" | "technical" | "operations" | "commercial" | "procurement" | "client"
  relatedObject?: { label: string; href: string }
}
