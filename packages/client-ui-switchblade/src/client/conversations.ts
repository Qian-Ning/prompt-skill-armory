/** Client transport for Armory conversation import/export (same-origin host routes). */

export interface ConversationRow {
  projectKey: string
  sessionId: string
  title: string
  cwd: string
  mtime: number
  size: number
}

export async function listConversations(): Promise<ConversationRow[]> {
  try {
    const r = await fetch('/api/armory/sessions')
    const b = (await r.json()) as { ok: boolean; sessions?: ConversationRow[] }
    return b.ok ? (b.sessions ?? []) : []
  } catch { return [] }
}

export async function exportConversations(ids: string[]): Promise<string | null> {
  try {
    const r = await fetch('/api/armory/export', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionIds: ids, includeAttachments: true, includeWorkspace: true }),
    })
    const b = (await r.json()) as { ok: boolean; name?: string }
    return b.ok && b.name !== undefined ? b.name : null
  } catch { return null }
}

export async function downloadExport(name: string): Promise<void> {
  const r = await fetch(`/api/armory/export/${name}`)
  const blob = await r.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = name
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function deleteConversations(ids: string[]): Promise<number | null> {
  try {
    const r = await fetch('/api/armory/delete', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionIds: ids }),
    })
    const b = (await r.json()) as { ok: boolean; deleted?: number }
    return b.ok ? (b.deleted ?? 0) : null
  } catch { return null }
}

/** Query the npm registry for the latest published prompt-skill-armory version. */
export async function checkLatestVersion(): Promise<string> {
  try {
    const r = await fetch('/api/armory/version')
    const b = (await r.json()) as { ok: boolean; latest?: string }
    return b.ok ? (b.latest ?? '') : ''
  } catch { return '' }
}

/** Trigger an in-place update (runs the installer, which reinstalls the plugin). */
export async function runUpdate(): Promise<boolean> {
  try {
    const r = await fetch('/api/armory/update', { method: 'POST' })
    const b = (await r.json()) as { ok: boolean }
    return b.ok === true
  } catch { return false }
}

/** Compare dotted versions; true when `a` is older than `b`. */
export function isOlder(a: string, b: string): boolean {
  const pa = a.split('.').map((n) => Number(n) || 0)
  const pb = b.split('.').map((n) => Number(n) || 0)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] ?? 0; const y = pb[i] ?? 0
    if (x !== y) return x < y
  }
  return false
}

export async function importConversations(file: File, targetProject?: string): Promise<number | null> {
  try {
    const q = targetProject !== undefined && targetProject !== '' ? `?project=${encodeURIComponent(targetProject)}` : ''
    const r = await fetch(`/api/armory/import${q}`, { method: 'POST', headers: { 'content-type': 'application/zip' }, body: file })
    const b = (await r.json()) as { ok: boolean; imported?: number }
    return b.ok ? (b.imported ?? 0) : null
  } catch { return null }
}
