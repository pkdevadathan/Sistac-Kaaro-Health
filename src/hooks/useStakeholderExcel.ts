import { useEffect, useState } from 'react'

import { parseStakeholderWorkbook } from '../services/stakeholderExcel'
import type { StakeholderOrderRow } from '../types/stakeholder'
import { baseRelativeUrl } from '../utils/assetUrl'

const DEFAULT_PATH = 'data/stakeholder-monthly-orders.xlsx'

function isZipArchive(buf: ArrayBuffer): boolean {
  if (buf.byteLength < 4) return false
  const view = new Uint8Array(buf)
  return view[0] === 0x50 && view[1] === 0x4b
}

export function useStakeholderExcel(url: string = baseRelativeUrl(DEFAULT_PATH)) {
  const [rows, setRows] = useState<StakeholderOrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`Could not load ${url} (${res.status})`)
        const buf = await res.arrayBuffer()
        if (!isZipArchive(buf)) {
          throw new Error(
            'Downloaded file is not a valid Excel workbook (expected .xlsx zip). Often this means the server returned HTML instead of the file — check BASE_URL / deployment assets.',
          )
        }
        const parsed = parseStakeholderWorkbook(buf)
        if (!parsed.length) {
          throw new Error(
            'Workbook parsed but no data rows matched expected columns (Order_ID, Month, Clinic_Name). Check the first sheet headers.',
          )
        }
        if (!cancelled) setRows(parsed)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load stakeholder workbook')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [url])

  return {
    rows,
    loading,
    error,
    hasStakeholderData: rows.length > 0,
  }
}
