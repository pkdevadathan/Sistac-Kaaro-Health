export type QaCheckItem = {
  id: string
  label: string
}

export const DEFAULT_QA_ITEMS: QaCheckItem[] = [
  { id: 'forecast', label: 'Reviewed forecast logic and active filter window' },
  { id: 'highlights', label: 'Reviewed anomaly highlights vs raw tables' },
  { id: 'low-stock', label: 'Reviewed low-stock risk signals (order-based)' },
  { id: 'exports', label: 'Exported or archived demand CSV if needed for governance' },
]

const QA_KEY = 'kaaro-dashboard-weekly-qa-v1'

export function loadQaChecked(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(QA_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    const out: Record<string, boolean> = {}
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === 'boolean') out[k] = v
    }
    return out
  } catch {
    return {}
  }
}

export function saveQaChecked(map: Record<string, boolean>) {
  localStorage.setItem(QA_KEY, JSON.stringify(map))
}
