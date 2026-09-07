"use client"

import * as React from "react"
import { useAppState } from "@/lib/store"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { PEOPLE } from "@/lib/mock-data"
import { PageHeader } from "@/components/shared/page-header"
import { StatusChip } from "@/components/shared/status-chip"
import { PersonChip } from "@/components/shared/person-chip"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import type { Person } from "@/lib/types"

const PROJECTS_ASSIGNED: Record<string, number> = {
  "james-parker": 5,
  "omar-rahman": 1,
  "priya-nair": 1,
  "john-miller": 1,
  "carlos-diaz": 1,
  "sara-malik": 1,
  "hassan-tariq": 1,
  "michael-grant": 1,
  "emma-lewis": 5,
  "admin-user": 0,
}

const LAST_ACTIVITY: Record<string, string> = {
  "james-parker": "12 Sep 15:06",
  "omar-rahman": "11 Sep 11:10",
  "priya-nair": "11 Sep 09:40",
  "john-miller": "12 Sep 09:15",
  "carlos-diaz": "10 Sep 16:20",
  "sara-malik": "11 Sep 14:45",
  "hassan-tariq": "10 Sep 12:00",
  "michael-grant": "12 Sep 13:40",
  "emma-lewis": "09 Sep 08:00",
  "admin-user": "01 Sep 08:00",
}

export default function AdminUsersPage() {
  const { users, setUsers } = useAppState()
  const [dialog, setDialog] = React.useState<{ type: "edit" | "role" | "deactivate"; user: Person } | null>(null)
  const [profileName, setProfileName] = React.useState("")
  const [newRole, setNewRole] = React.useState("")

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Users & Roles" description="Manage sample user profiles and role assignments. Changes are saved in this browser." />

      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Projects</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <span className="font-medium">{user.name}</span>
                </TableCell>
                <TableCell className="text-muted-foreground">{user.name.toLowerCase().replace(/[^a-z]+/g, ".")}@meridiancommand.com</TableCell>
                <TableCell className="text-muted-foreground">{user.role}</TableCell>
                <TableCell className="text-muted-foreground">{user.team}</TableCell>
                <TableCell>
                  <StatusChip label={user.status} tone={user.status === "Active" ? "success" : "neutral"} />
                </TableCell>
                <TableCell className="text-right text-muted-foreground">{PROJECTS_ASSIGNED[user.id] ?? 0}</TableCell>
                <TableCell className="text-muted-foreground">{LAST_ACTIVITY[user.id] ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="icon" aria-label={`Actions for ${user.name}`}>
                          <MoreHorizontal />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end">
                      <DropdownMenuGroup>
                        <DropdownMenuItem onClick={() => { setProfileName(user.name); setDialog({ type: "edit", user }) }}>Edit Profile</DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setNewRole(user.role)
                            setDialog({ type: "role", user })
                          }}
                        >
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          disabled={user.id === "admin-user"}
                          onClick={() => { if (user.status === "Deactivated") { setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: "Active" } : u)); toast.success("User reactivated", { description: `${user.name} is active in the sample workspace.` }); } else setDialog({ type: "deactivate", user }) }}
                        >
                          {user.status === "Deactivated" ? "Reactivate" : "Deactivate"}
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!dialog} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="sm:max-w-md">
          {dialog?.type === "edit" && (
            <>
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>Update profile details for {dialog.user.name}.</DialogDescription>
              </DialogHeader>
              <div className="space-y-2"><Label htmlFor="profile-name">Full name *</Label><Input id="profile-name" value={profileName} onChange={e => setProfileName(e.target.value)} /></div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialog(null)}>
                  Cancel
                </Button>
                <Button
                  disabled={!profileName.trim()}
                  onClick={() => {
                    setUsers(prev => prev.map(u => u.id === dialog.user.id ? { ...u, name: profileName.trim() } : u))
                    toast.success("User updated", { description: `${dialog.user.name}'s profile was saved.` })
                    setDialog(null)
                  }}
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </>
          )}
          {dialog?.type === "role" && (
            <>
              <DialogHeader>
                <DialogTitle>Change Role</DialogTitle>
                <DialogDescription>Update workspace role for {dialog.user.name}.</DialogDescription>
              </DialogHeader>
              <Select value={newRole} onValueChange={(v) => { if (v !== null) setNewRole(v) }}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Project Manager">Project Manager</SelectItem>
                  <SelectItem value="Lead Lab Scientist">Lead Lab Scientist</SelectItem>
                  <SelectItem value="Technical Engineer">Technical Engineer</SelectItem>
                  <SelectItem value="Operations Lead">Operations Lead</SelectItem>
                  <SelectItem value="Field Superintendent">Field Superintendent</SelectItem>
                  <SelectItem value="Procurement Lead">Procurement Lead</SelectItem>
                  <SelectItem value="Logistics Coordinator">Logistics Coordinator</SelectItem>
                  <SelectItem value="Commercial Manager">Commercial Manager</SelectItem>
                  <SelectItem value="VP Operations">VP Operations</SelectItem>
                  <SelectItem value="System Administrator">System Administrator</SelectItem>
                </SelectContent>
              </Select>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialog(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setUsers((prev) => prev.map((u) => (u.id === dialog.user.id ? { ...u, role: newRole } : u)))
                    toast.success("Role updated", { description: `${dialog.user.name} is now ${newRole}.` })
                    setDialog(null)
                  }}
                >
                  Confirm
                </Button>
              </DialogFooter>
            </>
          )}
          {dialog?.type === "deactivate" && (
            <>
              <DialogHeader>
                <DialogTitle>Deactivate User</DialogTitle>
                <DialogDescription>
                  {dialog.user.name} will be marked inactive in this sample workspace. You can reactivate the record from the user menu.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialog(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setUsers((prev) => prev.map((u) => (u.id === dialog.user.id ? { ...u, status: "Deactivated" } : u)))
                    toast.success("User deactivated", { description: `${dialog.user.name} is inactive in the sample workspace.` })
                    setDialog(null)
                  }}
                >
                  Confirm Deactivate
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
