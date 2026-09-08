"use client"
import * as React from "react"
import { toast } from "sonner"
import { useAppState } from "@/lib/store"
import { PageHeader } from "./page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export default function SystemConfiguration() {
  const { configuration, saveConfiguration, technicalStages, renameStage } = useAppState()
  const [draft, setDraft] = React.useState(configuration)
  const [names, setNames] = React.useState(Object.fromEntries(technicalStages.map(s=>[s.id,s.name])))
  const groups = [{key:"phases",label:"Project Phases"},{key:"issueCategories",label:"Issue Categories"},{key:"changeCategories",label:"Change Categories"}] as const
  const valid = groups.every(g => draft[g.key].every(v=>v.trim()) && new Set(draft[g.key].map(v=>v.trim().toLowerCase())).size === draft[g.key].length) && Object.values(draft.statusLabels).every(v=>v.trim())
  return <div className="space-y-6"><PageHeader title="System Configuration" description="Manage mocked phases, categories, status labels, and technical stage names. Workflow permissions and specialist decision ownership remain fixed." /><Tabs defaultValue="phases"><TabsList className="flex-wrap">{groups.map(g=><TabsTrigger key={g.key} value={g.key}>{g.label}</TabsTrigger>)}<TabsTrigger value="statuses">Statuses</TabsTrigger><TabsTrigger value="stages">Technical Stages</TabsTrigger></TabsList>
    {groups.map(g=><TabsContent key={g.key} value={g.key}><Card><CardHeader><CardTitle>{g.label}</CardTitle></CardHeader><CardContent className="space-y-3">{draft[g.key].map((value,index)=><div key={index} className="flex items-center gap-3"><Input aria-label={`${g.label} ${index+1}`} value={value} onChange={e=>setDraft(d=>({...d,[g.key]:d[g.key].map((v,i)=>i===index?e.target.value:v)}))} /><Button variant="ghost" disabled={draft[g.key].length<=1} onClick={()=>setDraft(d=>({...d,[g.key]:d[g.key].filter((_,i)=>i!==index)}))}>Remove</Button></div>)}<Button variant="outline" onClick={()=>setDraft(d=>({...d,[g.key]:[...d[g.key],""]}))}>Add {g.label === "Project Phases" ? "Phase" : "Category"}</Button></CardContent></Card></TabsContent>)}
    <TabsContent value="statuses"><Card><CardContent className="grid gap-4 p-5 sm:grid-cols-2">{Object.entries(draft.statusLabels).map(([key,value])=><div key={key} className="space-y-2"><Label htmlFor={`status-${key}`}>{key}</Label><Input id={`status-${key}`} value={value} onChange={e=>setDraft(d=>({...d,statusLabels:{...d.statusLabels,[key]:e.target.value}}))} /></div>)}</CardContent></Card></TabsContent>
    <TabsContent value="stages"><Card><CardContent className="space-y-4 p-5">{technicalStages.map(stage=><div key={stage.id} className="flex gap-3"><Input aria-label={`Name for ${stage.id}`} value={names[stage.id]} onChange={e=>setNames(n=>({...n,[stage.id]:e.target.value}))} /><Button disabled={!names[stage.id]?.trim()} onClick={()=>{renameStage(stage.id,names[stage.id]);toast.success("Stage name updated")}}>Save Stage</Button></div>)}</CardContent></Card></TabsContent>
    </Tabs><div className="flex items-center justify-between gap-4"><p className="text-sm text-muted-foreground">Use unique, non-empty names. Existing record values remain traceable.</p><Button disabled={!valid} onClick={()=>{saveConfiguration(draft);toast.success("System configuration saved")}}>Save Configuration</Button></div></div>
}
