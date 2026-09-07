"use client"

import * as React from "react"
import { cn } from "cn"

const TableLabels = React.createContext<string[]>([])
function textOf(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(textOf).join(" ")
  if (React.isValidElement<{ children?: React.ReactNode; label?: string; personId?: string }>(node)) return node.props.label ?? node.props.personId ?? textOf(node.props.children)
  return ""
}

function Table({ className, children, ...props }: React.ComponentProps<"table">) {
  const [sort, setSort] = React.useState<{ index: number; direction: number } | null>(null)
  const [page, setPage] = React.useState(0)
  const parts = React.Children.toArray(children)
  const body = parts.find(n => React.isValidElement(n) && n.type === TableBody) as React.ReactElement<{ children: React.ReactNode }> | undefined
  const rowCount = body ? React.Children.count(React.Children.toArray(body.props.children)) : 0
  const pageCount = Math.max(1, Math.ceil(rowCount / 12))
  const currentPage = Math.min(page, pageCount - 1)
  const header = parts.find(n => React.isValidElement(n) && n.type === TableHeader) as React.ReactElement<{ children: React.ReactNode }> | undefined
  const headerRow = header && React.Children.toArray(header.props.children)[0] as React.ReactElement<{ children: React.ReactNode }> | undefined
  const heads = headerRow ? React.Children.toArray(headerRow.props.children) : []
  const labels = heads.map(textOf)
  const rendered = parts.map(part => {
    if (!React.isValidElement<{ children: React.ReactNode }>(part)) return part
    if (part.type === TableHeader && headerRow) return React.cloneElement(part, {}, React.cloneElement(headerRow, {}, heads.map((head, index) => {
      if (!React.isValidElement<React.ComponentProps<"th">>(head)) return head
      if (["Actions", "Next Step"].includes(labels[index])) return head
      return React.cloneElement(head, { "aria-sort": sort?.index === index ? sort.direction === 1 ? "ascending" : "descending" : "none" }, <button className="inline-flex items-center gap-2 text-left" onClick={() => setSort({ index, direction: sort?.index === index ? -sort.direction : 1 })} aria-label={`Sort by ${labels[index]}`}>{head.props.children}<span aria-hidden="true" className="text-muted-foreground">{sort?.index === index ? sort.direction === 1 ? "↑" : "↓" : "↕"}</span></button>)
    })))
    if (part.type === TableBody) {
      const rows = React.Children.toArray(part.props.children)
      if (sort) {
        const cellText = (row: React.ReactNode) => React.isValidElement<{ children: React.ReactNode }>(row) ? textOf(React.Children.toArray(row.props.children)[sort.index]).trim() : ""
        rows.sort((a,b) => {
          const left = cellText(a), right = cellText(b)
          const dates = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s/.test(left) && /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s/.test(right)
          if (dates) return (Date.parse(left + (left.includes(",") ? "" : ", 2026")) - Date.parse(right + (right.includes(",") ? "" : ", 2026"))) * sort.direction
          return left.replace(/[$,]/g, "").localeCompare(right.replace(/[$,]/g, ""), undefined, { numeric: true }) * sort.direction
        })
      }
      return React.cloneElement(part, {}, rows.slice(currentPage * 12, (currentPage + 1) * 12))
    }
    return part
  })
  return (
    <TableLabels.Provider value={labels}>
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      >{rendered}</table>
    </div>
    {pageCount > 1 && <div className="flex items-center justify-between gap-3 border-t border-border p-4 text-sm"><span className="text-muted-foreground">Page {currentPage + 1} of {pageCount} · {rowCount} records</span><div className="flex gap-2"><button className="rounded-lg border px-3 py-2 disabled:opacity-40" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Previous</button><button className="rounded-lg border px-3 py-2 disabled:opacity-40" disabled={currentPage >= pageCount - 1} onClick={() => setPage(currentPage + 1)}>Next</button></div></div>}
    </TableLabels.Provider>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, children, ...props }: React.ComponentProps<"tr">) {
  const labels = React.useContext(TableLabels)
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    >{React.Children.toArray(children).map((child, index) => React.isValidElement<React.ComponentProps<"td"> & { "data-label"?: string }>(child) && child.type === TableCell ? React.cloneElement(child, { "data-label": labels[index] }) : child)}</tr>
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-12 px-4 text-left align-middle text-xs font-medium whitespace-nowrap text-muted-foreground [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-4 py-4 align-middle whitespace-normal [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
