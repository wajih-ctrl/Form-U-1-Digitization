import { exportCsvOutline, type URecord } from './types'

/** Build a spreadsheet with a visible form tree and readable Excel column widths. */
export async function exportExcelOutline(record: URecord): Promise<Blob> {
  const { default: ExcelJS } = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Form U-1 Digitization'
  workbook.subject = `Engineering form ${record.id}`
  const sheet = workbook.addWorksheet('Form U-1', {
    properties: { outlineLevelRow: 4, defaultRowHeight: 21 },
    views: [{ state: 'frozen', ySplit: 3, activeCell: 'A4' }],
  })
  sheet.columns = [
    { key: 'hierarchy', width: 59 },
    { key: 'value', width: 39 },
    { key: 'status', width: 22 },
    { key: 'confidence', width: 18 },
    { key: 'page', width: 14 },
  ]
  sheet.addRow([`FORM U-1  |  ${record.id}`])
  sheet.mergeCells('A1:E1')
  sheet.getRow(1).height = 34
  sheet.getCell('A1').font = { name: 'Aptos Display', size: 17, bold: true, color: { argb: 'FFFFFFFF' } }
  sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF294D35' } }
  sheet.getCell('A1').alignment = { vertical: 'middle', indent: 1 }
  sheet.addRow([`${record.name}  •  ${record.status}  •  ${record.pages.length} source pages`])
  sheet.mergeCells('A2:E2')
  sheet.getRow(2).height = 27
  sheet.getCell('A2').font = { name: 'Aptos', size: 10, color: { argb: 'FF526B57' } }
  sheet.getCell('A2').alignment = { vertical: 'middle', indent: 1 }
  sheet.addRow(['Form hierarchy', 'Extracted value', 'Review status', 'OCR confidence', 'Source page'])
  const header = sheet.getRow(3)
  header.height = 29
  header.eachCell(cell => {
    cell.font = { name: 'Aptos', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF416B49' } }
    cell.alignment = { vertical: 'middle', indent: 1 }
  })

  const colors: Record<string, string> = {
    Section: 'FFDCEACC',
    Table: 'FFEAF2E4',
    Row: 'FFF2F6ED',
    Component: 'FFF7F8F2',
  }
  const levels: Record<string, number> = { Section: 0, Table: 1, Row: 2, Component: 3, Field: 4 }
  for (const [level, rawLabel, value, status, confidence, page] of exportCsvOutline(record).slice(1)) {
    const depth = levels[level] ?? 0
    const row = sheet.addRow([rawLabel.trimStart(), value, status, confidence ? Number(confidence) : '', page ? Number(page) : ''])
    row.outlineLevel = depth
    row.height = level === 'Section' ? 28 : level === 'Field' ? 23 : 25
    if (level !== 'Field') {
      sheet.mergeCells(row.number, 1, row.number, 5)
      row.eachCell({ includeEmpty: true }, cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors[level] } }
        cell.border = { bottom: { style: 'hair', color: { argb: 'FFD2DEC9' } } }
      })
      const cell = row.getCell(1)
      cell.font = { name: 'Aptos', size: level === 'Section' ? 12 : 10, bold: true, color: { argb: 'FF294D35' } }
      cell.alignment = { vertical: 'middle', indent: Math.min(depth + 1, 15) }
    } else {
      row.eachCell({ includeEmpty: true }, cell => {
        cell.font = { name: 'Aptos', size: 10, color: { argb: 'FF344638' } }
        cell.alignment = { vertical: 'middle' }
        cell.border = { bottom: { style: 'hair', color: { argb: 'FFE9EEE5' } } }
      })
      row.getCell(1).alignment = { vertical: 'middle', indent: 4 }
      row.getCell(2).numFmt = '@'
      if (status === 'Review Required' || status === 'Not Detected') {
        row.getCell(3).font = { name: 'Aptos', size: 10, bold: true, color: { argb: 'FF96621F' } }
      }
      row.getCell(4).numFmt = '0"%"'
    }
  }
  sheet.pageSetup = { fitToPage: true, fitToWidth: 1, fitToHeight: 0, orientation: 'landscape' }
  const buffer = await workbook.xlsx.writeBuffer()
  return new Blob([new Uint8Array(buffer as ArrayBuffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}
