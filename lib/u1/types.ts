export type FieldStatus = 'High Confidence' | 'Review Required' | 'Verified' | 'Corrected' | 'Not Detected' | 'N/A'
export type SourceBox = [number, number, number, number]
export interface UField { id: string; label: string; section: string; table?: string; row?: number; value: string; original: string; confidence: number; status: FieldStatus; page: number; box: SourceBox }
export interface UPage { id: string; url: string; name: string; width: number; height: number }
export interface Audit { id: string; field: string; before: string; after: string; reviewer: string; at: string; status: string }
export interface URecord { id: string; name: string; created: string; updated: string; status: 'Captured' | 'Processing' | 'Review Required' | 'In Review' | 'Approved' | 'Database Ready'; pages: UPage[]; fields: UField[]; history: Audit[]; reviewer: string; approvedAt?: string; databaseReceipt?: string }
export const resolved = (f: UField) => ['Verified', 'Corrected', 'N/A'].includes(f.status)
export const fieldValue = (r: URecord, id: string) => r.fields.find(f => f.id === id)?.value || '—'
export function exportRecord(r: URecord) {
  const sections: Record<string, Record<string, unknown>> = {}
  for (const f of r.fields) {
    const group = sections[f.section] ??= {}
    if (f.table) {
      const rows = (group[f.table] ??= []) as Record<string, string>[]
      rows[f.row! - 1] ??= {}
      rows[f.row! - 1][f.label] = f.value
    } else group[f.label] = f.value
  }
  return { recordId: r.id, formType: 'U-1', status: r.status, reviewer: r.reviewer, approvedAt: r.approvedAt, sections, reviewHistory: r.history, provenance: r.fields.map(({id, page, box, confidence, original, status}) => ({id, page, box, confidence, original, status})) }
}
