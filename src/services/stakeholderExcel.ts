import * as XLSX from 'xlsx'

import type { StakeholderOrderRow } from '../types/stakeholder'

function num(v: unknown): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return v
  if (typeof v === 'string') {
    const n = Number(String(v).replace(/,/g, '').trim())
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

function str(v: unknown): string {
  if (v == null) return ''
  return String(v).trim()
}

/** Spreadsheet exports sometimes include padded header names; normalize keys once per row. */
function trimKeys(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(raw)) {
    out[key.trim()] = val
  }
  return out
}

export function parseStakeholderWorkbook(buf: ArrayBuffer): StakeholderOrderRow[] {
  const wb = XLSX.read(buf, { type: 'array', cellDates: false })
  const sheetName = wb.SheetNames[0]
  if (!sheetName) return []
  const sheet = wb.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
  const out: StakeholderOrderRow[] = []

  for (const raw of rows) {
    const rawRow = trimKeys(raw)
    const orderId = str(rawRow['Order_ID'] ?? rawRow['Order ID'] ?? rawRow['order_id'])
    const month = str(rawRow['Month'])
    const clinicName = str(rawRow['Clinic_Name'] ?? rawRow['Clinic Name'] ?? rawRow['clinic_name'])
    if (!orderId || !month || !clinicName) continue

    out.push({
      orderId,
      month,
      clinicName,
      region: str(rawRow['Region']),
      orderedBy: str(rawRow['Ordered_By'] ?? rawRow['Ordered By']),
      position: str(rawRow['Position']),
      item: str(rawRow['Item']),
      unit: str(rawRow['Unit']),
      quantity: num(rawRow['Quantity']),
    })
  }

  return out
}
