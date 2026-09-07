"use client"

import { usePersistedState } from "@/lib/use-persisted-state"
import { toast } from "sonner"
import { useAppState } from "@/lib/store"
import { ROLE_LABELS } from "@/lib/nav"
import { PageHeader } from "@/components/shared/page-header"
import { PersonBlock } from "@/components/shared/person-chip"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"

export default function SettingsPage() {
  const { role } = useAppState()
  const [preferences, setPreferences] = usePersistedState("preferences", { decisions: true, overdue: true })

  return (
    <div className="flex w-full max-w-4xl flex-col gap-6">
      <PageHeader title="Settings" description="Account and workspace preferences. Saved automatically in this browser." />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Session</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <PersonBlock personId={({ "project-manager": "james-parker", technical: "omar-rahman", operations: "john-miller", commercial: "michael-grant", procurement: "sara-malik", management: "emma-lewis", admin: "admin-user" })[role]} />
          <p className="mt-3 text-sm text-muted-foreground">
            Viewing the workspace as <span className="font-medium text-foreground">{ROLE_LABELS[role]}</span>.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 p-4 pt-0">
          <Field orientation="horizontal" className="justify-between">
            <div className="flex flex-col gap-0.5">
              <FieldLabel htmlFor="notify-decisions">PM decisions requiring my attention</FieldLabel>
              <FieldDescription>Get notified when a change or issue requires a project-level decision.</FieldDescription>
            </div>
            <Switch id="notify-decisions" checked={preferences.decisions} onCheckedChange={(checked) => { setPreferences(p => ({ ...p, decisions: checked })); toast.success(`Decision notifications ${checked ? "enabled" : "disabled"}`) }} />
          </Field>
          <Field orientation="horizontal" className="justify-between">
            <div className="flex flex-col gap-0.5">
              <FieldLabel htmlFor="notify-overdue">Overdue action reminders</FieldLabel>
              <FieldDescription>Get notified when an assigned action becomes overdue.</FieldDescription>
            </div>
            <Switch id="notify-overdue" checked={preferences.overdue} onCheckedChange={(checked) => { setPreferences(p => ({ ...p, overdue: checked })); toast.success(`Overdue reminders ${checked ? "enabled" : "disabled"}`) }} />
          </Field>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <p className="text-sm text-muted-foreground">Preferences save automatically. Notification delivery is simulated in this sample workspace.</p>
      </div>
    </div>
  )
}
