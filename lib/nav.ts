import type { LucideIcon } from "lucide-react"
import {
  Activity,
  CalendarRange,
  CheckCircle2,
  Coins,
  FileText,
  FlaskConical,
  FolderKanban,
  GitPullRequestArrow,
  Home,
  LineChart,
  ListChecks,
  Settings,
  ShieldCheck,
  ShieldQuestion,
  TriangleAlert,
  Users,
} from "lucide-react"
import type { Role } from "./types"

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  badge?: number
}

export interface NavSection {
  label?: string
  items: NavItem[]
}

const pmMain: NavItem[] = [
  { label: "Command Center", href: "/command-center", icon: Home },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Technical", href: "/technical", icon: FlaskConical },
  { label: "Execution Readiness", href: "/readiness", icon: ShieldCheck },
  { label: "Timeline", href: "/timeline", icon: CalendarRange },
  { label: "Changes", href: "/changes", icon: GitPullRequestArrow },
  { label: "Issues & Risks", href: "/issues", icon: TriangleAlert },
  { label: "Actions", href: "/actions", icon: ListChecks },
  { label: "Cost & Timeline Impact", href: "/cost-impact", icon: Coins },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Activity", href: "/activity", icon: Activity },
  { label: "Completion", href: "/completion", icon: CheckCircle2 },
]

const pmSecondary: NavItem[] = [
  { label: "Management Overview", href: "/management", icon: LineChart },
  { label: "Admin", href: "/admin", icon: ShieldQuestion },
  { label: "Settings", href: "/settings", icon: Settings },
]

const managementMain: NavItem[] = [
  { label: "Management Overview", href: "/management", icon: LineChart },
  { label: "Projects", href: "/projects", icon: FolderKanban },
]

const managementSecondary: NavItem[] = [{ label: "Settings", href: "/settings", icon: Settings }]

const adminMain: NavItem[] = [
  { label: "Admin Dashboard", href: "/admin", icon: Home },
  { label: "Users & Roles", href: "/admin/users", icon: Users },
  { label: "Projects", href: "/projects", icon: FolderKanban },
]

const adminSecondary: NavItem[] = [{ label: "Settings", href: "/settings", icon: Settings }]

export function getNavForRole(role: Role): { main: NavItem[]; secondary: NavItem[] } {
  if (role === "admin") return { main: adminMain, secondary: adminSecondary }
  if (role === "management") return { main: managementMain, secondary: managementSecondary }
  return { main: pmMain, secondary: pmSecondary }
}

export function defaultRouteForRole(role: Role): string {
  if (role === "admin") return "/admin"
  if (role === "management") return "/management"
  if (role === "technical") return "/technical"
  if (role === "operations" || role === "procurement") return "/readiness"
  if (role === "commercial") return "/cost-impact"
  return "/command-center"
}

export const ROLE_LABELS: Record<Role, string> = {
  "project-manager": "Project Manager",
  technical: "Technical / Lab",
  operations: "Operations",
  commercial: "Commercial",
  procurement: "Procurement / Logistics",
  management: "Management",
  admin: "Admin",
}
