"use client"

import * as React from "react"
import { usePersistedState } from "./use-persisted-state"
import {
  ACTIONS,
  ACTIVITY,
  CHANGES,
  DOCUMENTS,
  ISSUES,
  MILESTONES,
  PRIMARY_PROJECT_ID,
  PROJECTS,
  PEOPLE,
  READINESS_ITEMS,
  TECHNICAL_STAGES,
} from "./mock-data"
import type {
  ActionItem,
  ActivityEntry,
  Change,
  DocumentRecord,
  Issue,
  Milestone,
  Project,
  Person,
  ReadinessItem,
  Role,
  TechnicalStage,
} from "./types"

interface AppState {
  users: (Person & { status: "Active" | "Deactivated" })[]
  role: Role
  projects: Project[]
  technicalStages: TechnicalStage[]
  readinessItems: ReadinessItem[]
  milestones: Milestone[]
  changes: Change[]
  issues: Issue[]
  actions: ActionItem[]
  documents: DocumentRecord[]
  activity: ActivityEntry[]
}

interface AppContextValue extends AppState {
  setUsers: React.Dispatch<React.SetStateAction<(Person & { status: "Active" | "Deactivated" })[]>>
  setRole: (role: Role) => void
  updateAssessment: (changeId: string, teamKey: keyof Change["assessments"], assessment: string) => void
  updateProject: (id: string, fields: Partial<Project>) => void
  addDocument: (document: Omit<DocumentRecord, "id" | "date" | "addedBy">) => void
  approveChange: (changeId: string, note: string) => void
  rejectChange: (changeId: string, note: string) => void
  requestClarification: (changeId: string, team: string, question: string) => void
  escalateChange: (changeId: string, reason: string, level: string, note: string) => void
  updateReadinessStatus: (id: string, status: ReadinessItem["status"]) => void
  updateIssueStatus: (id: string, status: Issue["status"]) => void
  updateActionStatus: (id: string, status: ActionItem["status"]) => void
  updateTechnicalStageStatus: (id: string, status: TechnicalStage["status"]) => void
  logActivity: (entry: Omit<ActivityEntry, "id" | "timestamp">) => void
}

const AppContext = React.createContext<AppContextValue | null>(null)

function nowLabel() {
  return new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) + " " + new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = usePersistedState<(Person & { status: "Active" | "Deactivated" })[]>("users", PEOPLE.filter(p => p.id !== "client-contact").map(p => ({ ...p, status: "Active" })))
  const [role, setRole, hydrated] = usePersistedState<Role>("role", "project-manager")
  const [projects, setProjects] = usePersistedState<Project[]>("projects", PROJECTS)
  const [technicalStages, setTechnicalStages] = usePersistedState<TechnicalStage[]>("technicalStages", TECHNICAL_STAGES)
  const [readinessItems, setReadinessItems] = usePersistedState<ReadinessItem[]>("readinessItems", READINESS_ITEMS)
  const [milestones, setMilestones] = usePersistedState<Milestone[]>("milestones", MILESTONES)
  const [storedChanges, setChanges] = usePersistedState<Change[]>("changes", CHANGES)
  const changes = storedChanges.map(c => c.pmDecision && ["approved", "rejected"].includes(c.pmDecision.status) ? { ...c, status: c.pmDecision.status } : c)
  const [issues, setIssues] = usePersistedState<Issue[]>("issues", ISSUES)
  const [actions, setActions] = usePersistedState<ActionItem[]>("actions", ACTIONS)
  const [documents, setDocuments] = usePersistedState<DocumentRecord[]>("documents", DOCUMENTS)
  const [activity, setActivity] = usePersistedState<ActivityEntry[]>("activity", ACTIVITY)

  const logActivity = React.useCallback((entry: Omit<ActivityEntry, "id" | "timestamp">) => {
    setActivity((prev) => [
      { ...entry, id: `act-log-${prev.length + 1}`, timestamp: nowLabel() },
      ...prev,
    ])
  }, [])

  const approveChange = React.useCallback(
    (changeId: string, note: string) => {
      const change = changes.find((c) => c.id === changeId)
      if (!change || !Object.values(change.assessments).every(a => a.status === "complete") || ["approved", "rejected"].includes(change.status) || !["project-manager", "admin"].includes(role)) return

      setChanges((prev) =>
        prev.map((c) =>
          c.id === changeId
            ? {
                ...c,
                status: "approved",
                pmDecision: {
                  status: "approved",
                  note,
                  decidedBy: "James Parker",
                  decidedAt: nowLabel(),
                },
              }
            : c
        )
      )

      setProjects((prev) =>
        prev.map((p) =>
          p.id === PRIMARY_PROJECT_ID
            ? {
                ...p,
                forecastCompletion: change.combinedImpact.forecastCompletion,
                scheduleVarianceDays: change.combinedImpact.scheduleDays,
                costExposure: p.costExposure,
              }
            : p
        )
      )

      setMilestones((prev) =>
        prev.map((m) => {
          if (m.status === "completed" || !change.affectedMilestoneIds.includes(m.id)) return m
          const shifted = shiftDate(m.originalDate, change.combinedImpact.scheduleDays)
          return {
            ...m,
            forecastDate: shifted,
            status: "at-risk",
            daysImpacted: change.combinedImpact.scheduleDays,
            delayReason: `${change.id.toUpperCase()} ${change.title}`,
            downstreamImpact: `Shifts by +${change.combinedImpact.scheduleDays} days due to approved scope change.`,
          }
        })
      )

      setActions((prev) => [
        {
          id: `act-${prev.length + 1}`,
          title: `Update field execution plan for approved ${change.id.toUpperCase()} scope`,
          linkedItem: `${change.id.toUpperCase()} · ${change.title}`,
          linkedHref: `/changes/${change.id}`,
          team: "Operations",
          assignedPersonId: "john-miller",
          coordinatorId: "james-parker",
          dueDate: shiftDate(new Date().toISOString().slice(0, 10), 3),
          status: "open",
          waitingOn: "—",
          priority: "high",
          impactIfLate: "Field execution plan not aligned to approved scope.",
          nextStep: "Update execution plan to reflect approved secondary train scope.",
        },
        {
          id: `act-${prev.length + 2}`,
          title: `Notify client of approved schedule and cost impact for ${change.id.toUpperCase()}`,
          linkedItem: `${change.id.toUpperCase()} · ${change.title}`,
          linkedHref: `/changes/${change.id}`,
          team: "Project Management",
          assignedPersonId: "james-parker",
          coordinatorId: "james-parker",
          dueDate: shiftDate(new Date().toISOString().slice(0, 10), 1),
          status: "open",
          waitingOn: "—",
          priority: "medium",
          impactIfLate: "Client not formally notified of revised schedule.",
          nextStep: "Send confirmation notice to Gulf Energy Corporation.",
        },
        ...prev,
      ])

      logActivity({
        team: "Project Management",
        person: "James Parker",
        event: `Approved ${change.id.toUpperCase()} — ${change.title}.`,
        category: "pm-decision",
        relatedObject: { label: change.id.toUpperCase(), href: `/changes/${change.id}` },
      })
      logActivity({
        team: "Project Management",
        person: "James Parker",
        event: `Forecast completion moved from ${formatShort(change.combinedImpact.originalCompletion)} to ${formatShort(
          change.combinedImpact.forecastCompletion
        )}.`,
        category: "pm-decision",
        relatedObject: { label: "Timeline", href: "/timeline" },
      })
    },
    [changes, logActivity, role]
  )

  const rejectChange = React.useCallback(
    (changeId: string, note: string) => {
      const change = changes.find((c) => c.id === changeId)
      if (!change || ["approved", "rejected"].includes(change.status) || !["project-manager", "admin"].includes(role)) return
      setChanges((prev) =>
        prev.map((c) =>
          c.id === changeId
            ? {
                ...c,
                status: "rejected",
                pmDecision: { status: "rejected", note, decidedBy: "James Parker", decidedAt: nowLabel() },
              }
            : c
        )
      )
      logActivity({
        team: "Project Management",
        person: "James Parker",
        event: `Rejected ${change.id.toUpperCase()} — ${change.title}.`,
        category: "pm-decision",
        relatedObject: { label: change.id.toUpperCase(), href: `/changes/${change.id}` },
      })
    },
    [changes, logActivity, role]
  )

  const requestClarification = React.useCallback(
    (changeId: string, team: string, question: string) => {
      const change = changes.find((c) => c.id === changeId)
      if (!change || ["approved", "rejected"].includes(change.status) || !["project-manager", "admin"].includes(role)) return
      setChanges((prev) =>
        prev.map((c) =>
          c.id === changeId
            ? {
                ...c,
                status: "clarification-requested",
                pmDecision: {
                  status: "clarification-requested",
                  note: question,
                  decidedBy: "James Parker",
                  decidedAt: nowLabel(),
                  extra: { "Waiting On": team },
                },
              }
            : c
        )
      )
      setActions((prev) => [
        {
          id: `act-${prev.length + 1}`,
          title: `Provide clarification on ${change.id.toUpperCase()}`,
          linkedItem: `${change.id.toUpperCase()} · ${change.title}`,
          linkedHref: `/changes/${change.id}`,
          team: ({ Technical: "Technical / Lab", Procurement: "Procurement / Logistics" }[team] ?? team) as ActionItem["team"],
          assignedPersonId: ({ Technical: "omar-rahman", Operations: "john-miller", Procurement: "sara-malik", Commercial: "michael-grant" }[team] ?? "james-parker"),
          coordinatorId: "james-parker",
          dueDate: shiftDate(new Date().toISOString().slice(0, 10), 2),
          status: "open",
          waitingOn: team,
          priority: "high",
          impactIfLate: "PM decision on scope change remains blocked.",
          nextStep: question,
        },
        ...prev,
      ])
      logActivity({
        team: "Project Management",
        person: "James Parker",
        event: `Requested clarification from ${team} on ${change.id.toUpperCase()}.`,
        category: "pm-decision",
        relatedObject: { label: change.id.toUpperCase(), href: `/changes/${change.id}` },
      })
    },
    [changes, logActivity, role]
  )

  const escalateChange = React.useCallback(
    (changeId: string, reason: string, level: string, note: string) => {
      const change = changes.find((c) => c.id === changeId)
      if (!change || ["approved", "rejected"].includes(change.status) || !["project-manager", "admin"].includes(role)) return
      setChanges((prev) =>
        prev.map((c) =>
          c.id === changeId
            ? {
                ...c,
                status: "escalated",
                pmDecision: {
                  status: "escalated",
                  note,
                  decidedBy: "James Parker",
                  decidedAt: nowLabel(),
                  extra: { "Escalation Reason": reason, "Attention Level": level },
                },
              }
            : c
        )
      )
      logActivity({
        team: "Project Management",
        person: "James Parker",
        event: `Escalated ${change.id.toUpperCase()} to Management (${level}).`,
        category: "pm-decision",
        relatedObject: { label: "Management Overview", href: "/management" },
      })
    },
    [changes, logActivity, role]
  )

  const updateReadinessStatus = React.useCallback((id: string, status: ReadinessItem["status"]) => {
    setReadinessItems((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
    logActivity({ team: "Operations", person: "Workspace user", category: "operations", event: `Updated ${id} to ${status.replaceAll("-", " ")}.`, relatedObject: { label: "View record", href: "/readiness" } })
  }, [logActivity])

  const updateIssueStatus = React.useCallback((id: string, status: Issue["status"]) => {
    setIssues((prev) => prev.map((i) => (i.id === id ? { ...i, status, pmAttention: status === "resolved" ? false : status === "escalated" ? true : i.pmAttention } : i)))
    logActivity({ team: "Project Management", person: "Workspace user", category: "pm-decision", event: `Updated ${id} to ${status.replaceAll("-", " ")}.`, relatedObject: { label: "View record", href: "/issues" } })
  }, [logActivity])

  const updateActionStatus = React.useCallback((id: string, status: ActionItem["status"]) => {
    setActions((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
    logActivity({ team: "Project Management", person: "Workspace user", category: "pm-decision", event: `Updated ${id} to ${status.replaceAll("-", " ")}.`, relatedObject: { label: "View record", href: "/actions" } })
  }, [logActivity])

  const updateTechnicalStageStatus = React.useCallback((id: string, status: TechnicalStage["status"]) => {
    setTechnicalStages((prev) => prev.map((s) => (s.id === id ? { ...s, status, completedDate: status === "completed" ? new Date().toISOString().slice(0,10) : undefined, waitingOn: status === "completed" ? undefined : s.waitingOn } : s)))
    logActivity({ team: "Technical / Lab", person: "Workspace user", category: "technical", event: `Updated ${id} to ${status.replaceAll("-", " ")}.`, relatedObject: { label: "View record", href: "/technical" } })
  }, [logActivity])

  const updateAssessment = (changeId: string, teamKey: keyof Change["assessments"], assessment: string) => {
    if (![teamKey, "project-manager", "admin"].includes(role)) return
    setChanges(prev => prev.map(c => {
      if (c.id !== changeId || ["approved", "rejected"].includes(c.status)) return c
      const assessments = { ...c.assessments, [teamKey]: { ...c.assessments[teamKey], assessment, status: "complete" as const } }
      return { ...c, assessments, status: Object.values(assessments).every(a => a.status === "complete") ? "awaiting-pm-decision" : "assessment-in-progress" }
    }))
    logActivity({ team: "Project Management", person: "Workspace user", category: "pm-decision", event: `Completed ${teamKey} assessment for ${changeId.toUpperCase()}.`, relatedObject: { label: "Review change", href: `/changes/${changeId}` } })
  }
  const updateProject = (id: string, fields: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...fields, scheduleVarianceDays: Math.round((Date.parse(fields.forecastCompletion ?? p.forecastCompletion) - Date.parse(fields.promisedCompletion ?? p.promisedCompletion)) / 86400000) } : p))
    logActivity({ team: "Project Management", person: "Workspace user", event: "Updated project details.", category: "pm-decision", relatedObject: { label: fields.name ?? id, href: `/projects/${id}` } })
  }
  const addDocument = (document: Omit<DocumentRecord, "id" | "date" | "addedBy">) => {
    setDocuments(prev => [{ ...document, id: crypto.randomUUID(), date: new Date().toISOString().slice(0,10), addedBy: "Workspace user" }, ...prev])
    logActivity({ team: "Technical / Lab", person: "Workspace user", category: "technical", event: `Added technical record: ${document.name}.`, relatedObject: { label: "Documents", href: "/documents" } })
  }
  const value: AppContextValue = {
    users,
    setUsers,
    updateAssessment,
    updateProject,
    addDocument,
    role,
    setRole,
    projects: projects.map(p => p.id === PRIMARY_PROJECT_ID ? { ...p, costExposure: changes.filter(c => c.status !== "rejected").reduce((sum, c) => sum + c.combinedImpact.cost, 0) } : p),
    technicalStages,
    readinessItems,
    milestones,
    changes,
    issues,
    actions,
    documents,
    activity,
    approveChange,
    rejectChange,
    requestClarification,
    escalateChange,
    updateReadinessStatus,
    updateIssueStatus,
    updateActionStatus,
    updateTechnicalStageStatus,
    logActivity,
  }

  return <AppContext.Provider value={value}>{hydrated ? children : <div role="status" className="flex min-h-dvh items-center justify-center gap-3 text-sm text-muted-foreground"><span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />Loading your workspace…</div>}</AppContext.Provider>
}

export function useAppState() {
  const ctx = React.useContext(AppContext)
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider")
  return ctx
}

function shiftDate(dateStr: string, days: number) {
  const d = new Date(dateStr + "T00:00:00Z")
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function formatShort(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "short" })
}

export function formatLong(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
}

export function formatCurrency(amount: number) {
  return `$${amount.toLocaleString("en-US")}`
}
