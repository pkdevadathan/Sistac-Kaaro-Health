export type AuditEntry = {
  id: string
  ts: string
  action: string
  detail: string
}

const AUDIT_KEY = 'kaaro-dashboard-audit-v1'
const MAX_ENTRIES = 200

function nowIso() {
  return new Date().toISOString()
}

export function loadAuditEntries(): AuditEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (row): row is AuditEntry =>
          row != null &&
          typeof row === 'object' &&
          typeof (row as AuditEntry).id === 'string' &&
          typeof (row as AuditEntry).ts === 'string' &&
          typeof (row as AuditEntry).action === 'string' &&
          typeof (row as AuditEntry).detail === 'string',
      )
      .slice(-MAX_ENTRIES)
  } catch {
    return []
  }
}

function saveAuditEntries(entries: AuditEntry[]) {
  const trimmed = entries.slice(-MAX_ENTRIES)
  localStorage.setItem(AUDIT_KEY, JSON.stringify(trimmed))
}

export function appendAuditEntry(action: string, detail: string): AuditEntry[] {
  const entry: AuditEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    ts: nowIso(),
    action,
    detail,
  }
  const next = [...loadAuditEntries(), entry]
  saveAuditEntries(next)
  return next
}

export function clearAuditEntries() {
  localStorage.removeItem(AUDIT_KEY)
}
