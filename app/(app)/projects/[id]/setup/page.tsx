"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import { notFound, useParams } from "next/navigation"
import { CheckCircle2 } from "lucide-react"
import { useAppState } from "@/lib/store"
import { PEOPLE } from "@/lib/mock-data"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function ProjectSetupPage() {
  const params = useParams<{ id: string }>()
  const { projects, updateProject } = useAppState()
  const project = projects.find((p) => p.id === params.id)
  if (!project) return notFound()

  const [form, setForm] = React.useState({
    name: project.name,
    client: project.client,
    facility: project.facility,
    projectType: project.projectType,
    scopeSummary: project.scopeSummary,
    status: project.status,
    projectManagerId: project.projectManagerId,
    startDate: project.startDate,
    promisedCompletion: project.promisedCompletion,
    forecastCompletion: project.forecastCompletion,
    currentPhase: project.currentPhase,
    commercialCommitment: project.commercialCommitment ?? "185000",
    commercialNotes: project.commercialNotes ?? "",
    clientContact: project.clientContact ?? "Robert Hayes, Client Technical Lead",
  })
  const [saved, setSaved] = React.useState(false)

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setSaved(false)
  }

  function save() {
    if (!form.name.trim() || !form.client.trim() || !form.facility.trim()) { toast.error("Complete the required project details", { description: "Project name, client, and facility are required." }); return }
    if (!form.startDate || !form.promisedCompletion || !form.forecastCompletion || form.promisedCompletion < form.startDate || form.forecastCompletion < form.startDate) { toast.error("Check the project dates", { description: "Completion dates must be on or after the start date." }); return }
    if (!form.commercialCommitment.trim() || !Number.isFinite(Number(form.commercialCommitment)) || Number(form.commercialCommitment) < 0) { toast.error("Enter a valid contract value", { description: "Use a non-negative amount in USD." }); return }
    updateProject(project!.id, { ...form, name: form.name.trim(), client: form.client.trim(), facility: form.facility.trim() })
    setSaved(true)
    toast.success("Project details saved", { description: "The project overview and portfolio now show your updates." })
  }
  return (
    <form onSubmit={e => { e.preventDefault(); save() }} className="flex flex-col gap-6">
      <PageHeader
        title="Project Setup"
        description={`Update general, schedule, and commercial details for ${project.name}.`}
        actions={
          <>
            <Button variant="outline" size="sm" render={<Link href={`/projects/${project.id}`} />}>
              Cancel
            </Button>
            <Button size="sm" type="submit">
              Save Changes
            </Button>
          </>
        }
      />

      {saved && (
        <Alert className="border-success-foreground/20 bg-success text-success-foreground">
          <CheckCircle2 />
          <AlertTitle>Project details updated</AlertTitle>
          <AlertDescription className="text-success-foreground/80">
            Changes to {form.name} have been saved to the project record.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">General Information</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <FieldGroup>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="name">Project Name *</FieldLabel>
                <Input id="name" required value={form.name} onChange={(e) => update("name", e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="client">Client *</FieldLabel>
                <Input id="client" required value={form.client} onChange={(e) => update("client", e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="facility">Facility / Site *</FieldLabel>
                <Input id="facility" required value={form.facility} onChange={(e) => update("facility", e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="type">Project Type</FieldLabel>
                <Input id="type" value={form.projectType} onChange={(e) => update("projectType", e.target.value)} />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="scope">Scope Summary</FieldLabel>
              <Textarea id="scope" rows={3} value={form.scopeSummary} onChange={(e) => update("scopeSummary", e.target.value)} />
            </Field>
            <Field>
              <FieldLabel>Project Status</FieldLabel>
              <Select value={form.status} onValueChange={(v) => { if (v !== null) update("status", v) }}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leadership</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Field className="max-w-sm">
            <FieldLabel>Project Manager</FieldLabel>
            <Select value={form.projectManagerId} onValueChange={(v) => { if (v !== null) update("projectManagerId", v) }}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PEOPLE.filter((p) => p.team === "Project Management").map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Schedule</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field>
              <FieldLabel htmlFor="start">Project Start Date</FieldLabel>
              <Input id="start" type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="promised">Promised Completion</FieldLabel>
              <Input id="promised" type="date" value={form.promisedCompletion} onChange={(e) => update("promisedCompletion", e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="forecast">Forecast Completion</FieldLabel>
              <Input id="forecast" type="date" value={form.forecastCompletion} onChange={(e) => update("forecastCompletion", e.target.value)} />
            </Field>
            <Field>
              <FieldLabel>Current Phase</FieldLabel>
              <Select value={form.currentPhase} onValueChange={(v) => { if (v !== null) update("currentPhase", v) }}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Execution Readiness",
                    "Client Technical Review",
                    "Field Execution",
                    "Technical Completion",
                    "Project Closure",
                  ].map((phase) => (
                    <SelectItem key={phase} value={phase}>
                      {phase}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Commercial</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <FieldGroup>
            <Field className="max-w-sm">
              <FieldLabel htmlFor="commitment">Awarded Commercial Commitment</FieldLabel>
              <Input id="commitment" type="number" min="0" step="0.01" value={form.commercialCommitment} onChange={(e) => update("commercialCommitment", e.target.value)} />
              <FieldDescription>Total awarded contract value, in USD.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="notes">Commercial Notes</FieldLabel>
              <Textarea id="notes" rows={2} value={form.commercialNotes} onChange={(e) => update("commercialNotes", e.target.value)} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Client</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Field className="max-w-sm">
            <FieldLabel htmlFor="contact">Client Contact</FieldLabel>
            <Input id="contact" value={form.clientContact} onChange={(e) => update("clientContact", e.target.value)} />
            <FieldDescription>Primary technical point of contact for {form.client}.</FieldDescription>
          </Field>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 pb-4">
        <Button variant="outline" render={<Link href={`/projects/${project.id}`} />}>
          Cancel
        </Button>
        <Button type="submit">Save Changes</Button>
      </div>
    </form>
  )
}
