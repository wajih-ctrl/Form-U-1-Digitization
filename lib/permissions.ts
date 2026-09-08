import type { Role, Team } from "./types"

export const ROLE_TEAM: Record<Role, Team> = {
  "project-manager": "Project Management", technical: "Technical / Lab", operations: "Operations", commercial: "Commercial", procurement: "Procurement / Logistics", management: "Management", admin: "Admin",
}
export const ROLE_PERSON: Record<Role, string> = {
  "project-manager": "james-parker", technical: "omar-rahman", operations: "john-miller", commercial: "michael-grant", procurement: "sara-malik", management: "emma-lewis", admin: "admin-user",
}
export const canDecide = (role: Role) => role === "project-manager"
export const canManageProjects = (role: Role) => role === "project-manager" || role === "admin"
export const canAssess = (role: Role, teamKey: string) => role === teamKey
export const canOwnWork = (role: Role, team: string) => ROLE_TEAM[role] === team && !["management", "admin"].includes(role)
export const canCoordinate = (role: Role, team: string) => role === "project-manager" || canOwnWork(role, team)
export const canRecordExternal = (role: Role, team: string) => canOwnWork(role, team) || (team === "Client" && role === "project-manager")
export const canAddRecord = (role: Role) => !["management", "admin"].includes(role)
export function canVisit(role: Role, pathname: string) {
  if (pathname.startsWith("/admin")) return role === "admin"
  if (pathname.endsWith("/setup")) return canManageProjects(role) || role === "commercial"
  if (pathname === "/command-center") return role === "project-manager"
  if (pathname === "/management") return role === "management" || role === "project-manager"
  return true
}
