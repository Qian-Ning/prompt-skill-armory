/**
 * Global background/effects engine for Prompt•Skill-Armory — fusing the
 * reference DSH skin/theme plugins' strongest ideas into one feature:
 *  - dsh-harness-background / dsh-dream-skin: a real walled backdrop engine
 *    (wallpaper + readability scrim + frosted-glass surfaces + blur + fit),
 *  - dsh-web / dsh-background: custom user image upload (here as a portable
 *    data-URL so it needs no filesystem and survives restarts), and
 *  - catppuccin: the "whole app recolor" idea — here the glass surfaces and
 *    frame transparency are driven by inline body styles so they truly take
 *    effect.
 *
 * The critical reliability detail: every knob is written INLINE on
 * `document.body` (`style.setProperty`), which outranks any stylesheet, so a
 * later-loaded official theme rule cannot wash it out. Persistence goes
 * through the Host's same-origin route so the section survives restarts with
 * no settings-RPC / allowlist dependency.
 *
 * This module is deliberately defensive: every mutation is guarded so a bad
 * value or a missing DOM API can never take the client plugin tree down.
 */

/** Style for the composer's below-input hint row (per surface, optional). */
export interface HintStyle {
  enabled: boolean
  color: string
  size: number
  /** CSS gradient ('' = use solid color). Gradient text via background-clip. */
  gradient: string
}

/** Built-in fancy gradient text schemes for the hint/stats line. */
export const GRADIENTS: readonly { id: string; name: string; css: string }[] = [
  { id: '', name: '纯色', css: '' },
  { id: 'aurora', name: '极光', css: 'linear-gradient(90deg,#58a6ff,#8b5cf6,#ec4899)' },
  { id: 'fire', name: '火焰', css: 'linear-gradient(90deg,#fbbf24,#f97316,#ef4444)' },
  { id: 'sky', name: '晴空', css: 'linear-gradient(90deg,#38bdf8,#818cf8)' },
  { id: 'neon', name: '霓虹', css: 'linear-gradient(90deg,#22d3ee,#a78bfa,#f0abfc)' },
  { id: 'ocean', name: '海洋', css: 'linear-gradient(90deg,#34d399,#22d3ee,#3b82f6)' },
  { id: 'sunset', name: '晚霞', css: 'linear-gradient(90deg,#f472b6,#fb923c,#f59e0b)' },
]

/** One durable background section. Mirrors the Host BackgroundSettings. */
export interface BackgroundSettings {
  enabled: boolean
  kind: 'image' | 'video'
  /** Id of a file stored on disk ('' = none); never stores bytes in settings. */
  uploadId: string
  /** External image URL ('' = none when an upload is used). */
  url: string
  opacity: number
  scrim: number
  panelOpacity: number
  blur: number
  wallpaperBlur: number
  fit: 'cover' | 'contain'
  hint: HintStyle
}

export const DEFAULT_BACKGROUND: BackgroundSettings = {
  enabled: false, kind: 'image', uploadId: '', url: '', opacity: 1, scrim: 0.25, panelOpacity: 1, blur: 16, wallpaperBlur: 0, fit: 'cover',
  hint: { enabled: false, color: '#79c0ff', size: 11, gradient: '' },
}

const BACKGROUND_API_PREFIX = '/api/switchblade-background'

const ACTIVE_ATTR = 'data-ar-bg'
const GLASS_ATTR = 'data-ar-glass'
const CSS_TAG = 'prompt-skill-armory/background'

const BACKGROUND_CSS = `
  .ar-bg-layer { position: fixed; inset: 0; z-index: -2; overflow: hidden; pointer-events: none; }
  .ar-bg-layer .ar-bg-image { width: 100%; height: 100%; display: block; border: 0;
    object-fit: var(--ar-bg-fit, cover); opacity: var(--ar-bg-opacity, 1);
    filter: blur(var(--ar-bg-blur, 0px)); transform: scale(var(--ar-bg-scale, 1)); transform-origin: center; }
  .ar-bg-scrim { position: fixed; inset: 0; z-index: -1; pointer-events: none;
    background: rgba(255,255,255, var(--ar-bg-scrim, 0.25)); }
  body[data-ds-dark-theme] .ar-bg-scrim { background: rgba(0,0,0, var(--ar-bg-scrim, 0.25)); }
  body[${ACTIVE_ATTR}] { --dsw-alias-bg-base: transparent; --dsw-specific-sidebar-fill: transparent; }
  body[${GLASS_ATTR}] [data-composer-card],
  body[${GLASS_ATTR}] [class*="_bubble"]:not([role="tooltip"]),
  body[${GLASS_ATTR}] .md-code-block,
  body[${GLASS_ATTR}] [data-terminal], body[${GLASS_ATTR}] [data-diff],
  body[${GLASS_ATTR}] [data-read], body[${GLASS_ATTR}] [data-search],
  body[${GLASS_ATTR}] [data-web], body[${GLASS_ATTR}] [class*="_ioCard"],
  body[${GLASS_ATTR}] [class*="_instructionsCard"],
  body[${GLASS_ATTR}] [class*="_markdown"] :not(pre) > code {
    background-image: linear-gradient(180deg, rgba(255,255,255, var(--ar-glass-sheen, 0.07)), rgba(255,255,255, var(--ar-glass-sheen-mid, 0.02)) 38%, rgba(255,255,255, 0.01));
    -webkit-backdrop-filter: blur(var(--ar-glass-blur, 16px)) saturate(var(--ar-glass-saturate, 1.4)) brightness(var(--ar-glass-brightness, 1)) contrast(1.01);
    backdrop-filter: blur(var(--ar-glass-blur, 16px)) saturate(var(--ar-glass-saturate, 1.4)) brightness(var(--ar-glass-brightness, 1)) contrast(1.01);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.32), inset 0 -1px 0 rgba(255,255,255,0.08), inset 0 0 0 0.5px rgba(255,255,255,0.08), 0 12px 40px rgba(0,0,0,0.12);
  }
  body[${ACTIVE_ATTR}] .md-code-block [class*="_bannerWrap"] { background-color: var(--dsw-alias-markdown-code-block-banner); }
`

function injectBackgroundCss(): void {
  try {
    if (document.querySelector(`style[data-plugin-css="${CSS_TAG}"]`)) return
    const tag = document.createElement('style')
    tag.dataset.plugin = 'prompt-skill-armory'
    tag.dataset.pluginCss = CSS_TAG
    tag.textContent = BACKGROUND_CSS
    document.head.appendChild(tag)
  } catch { /* stylesheet is cosmetic — never fatal */ }
}

const GLASS_TOKENS = [
  '--dsw-specific-input-major', '--dsw-specific-bubble', '--dsw-alias-markdown-code-block',
  '--dsw-alias-markdown-code-block-banner', '--dsw-alias-markdown-inline-code', '--dsw-specific-tip',
] as const

function glassAlpha(panelOpacity: number): number {
  const alpha = 0.05 + panelOpacity * 0.85
  return Math.max(0, Math.min(0.9, alpha))
}

class BackgroundPainter {
  private layer: HTMLDivElement | null = null
  private img: HTMLMediaElement | null = null
  private scrim: HTMLDivElement | null = null
  private observer: MutationObserver | undefined
  private settings: BackgroundSettings | undefined
  private readonly saved = new Map<string, string>()

  private rememberOnce(prop: string): void {
    if (this.saved.has(prop)) return
    try { this.saved.set(prop, document.body.style.getPropertyValue(prop)) } catch { this.saved.set(prop, '') }
  }
  private setVar(name: string, value: string): void {
    this.rememberOnce(name)
    try { document.body.style.setProperty(name, value) } catch { /* ignore */ }
  }

  apply(settings: BackgroundSettings): void {
    this.settings = settings
    if (!settings.enabled) { this.dispose(); return }
    try {
      injectBackgroundCss()
      const hasSource = settings.url !== '' || settings.uploadId !== ''
      for (const prop of ['--dsw-alias-bg-base', '--dsw-specific-sidebar-fill']) {
        this.rememberOnce(prop); document.body.style.setProperty(prop, 'transparent')
      }
      if (!hasSource) { this.removeLayers(); document.body.removeAttribute(ACTIVE_ATTR); this.applyGlass(settings, true); return }
      const mediaUrl = settings.uploadId !== '' ? `/api/switchblade-wallpaper/image/${settings.uploadId}` : settings.url
      const isVideo = settings.kind === 'video'

      if (!this.layer) {
        this.layer = document.createElement('div'); this.layer.className = 'ar-bg-layer'
        this.img = document.createElement(isVideo ? 'video' : 'img'); this.img.className = 'ar-bg-image'
        if (isVideo) {
          this.img.setAttribute('autoplay', ''); this.img.setAttribute('loop', ''); this.img.setAttribute('muted', ''); this.img.setAttribute('playsinline', '')
        } else { (this.img as HTMLImageElement).referrerPolicy = 'no-referrer'; this.img.alt = '' }
        this.img.onerror = () => { if (this.img && this.img.dataset.failed !== '1') { this.img.dataset.failed = '1'; this.img.style.visibility = 'hidden' } }
        this.layer.appendChild(this.img); document.body.appendChild(this.layer)
      }
      if (this.img && this.img.getAttribute('src') !== mediaUrl) {
        delete this.img.dataset.failed; this.img.style.visibility = ''; this.img.setAttribute('src', mediaUrl)
      }
      if (!this.scrim) { this.scrim = document.createElement('div'); this.scrim.className = 'ar-bg-scrim'; document.body.appendChild(this.scrim) }
      document.body.setAttribute(ACTIVE_ATTR, 'on')

      const s = document.body.style
      this.setVar('--ar-bg-fit', settings.fit)
      this.setVar('--ar-bg-opacity', String(settings.opacity))
      this.setVar('--ar-bg-blur', `${settings.wallpaperBlur}px`)
      this.setVar('--ar-bg-scale', (1 + settings.wallpaperBlur * 0.006).toFixed(4))
      this.setVar('--ar-bg-scrim', String(settings.scrim))
      this.setVar('--ar-glass-blur', `${settings.blur}px`)
      this.setVar('--ar-glass-saturate', String(settings.blur > 0 ? Math.round(Math.min(1.6, 1.1 + settings.blur * 0.02) * 1000) / 1000 : 1))
      this.setVar('--ar-glass-brightness', document.body.dataset.dsDarkTheme !== undefined ? '1.04' : '0.98')
      this.setVar('--ar-glass-sheen', document.body.dataset.dsDarkTheme !== undefined ? '0.16' : '0.07')
      this.setVar('--ar-glass-sheen-mid', document.body.dataset.dsDarkTheme !== undefined ? '0.05' : '0.02')
      this.applyGlass(settings, false)

      if (!this.observer) {
        this.observer = new MutationObserver(() => { if (this.settings) this.applyGlass(this.settings, false) })
        this.observer.observe(document.body, { attributes: true, attributeFilter: ['data-ds-dark-theme'] })
      }
    } catch { this.dispose() }
  }

  dispose(): void {
    try {
      this.observer?.disconnect(); this.observer = undefined
      this.removeLayers()
      const s = document.body.style
      document.body.removeAttribute(ACTIVE_ATTR); document.body.removeAttribute(GLASS_ATTR)
      for (const [prop, value] of this.saved) s.setProperty(prop, value)
      this.saved.clear(); this.settings = undefined
    } catch { /* ignore */ }
  }

  private applyGlass(settings: BackgroundSettings | undefined, forceRestore: boolean): void {
    try {
      const s = document.body.style
      for (const t of GLASS_TOKENS) this.rememberOnce(t)
      if (forceRestore || settings === undefined || settings.panelOpacity >= 1) {
        for (const t of GLASS_TOKENS) { const o = this.saved.get(t); if (o !== undefined && o !== '') s.setProperty(t, o); else s.removeProperty(t) }
        document.body.removeAttribute(GLASS_ATTR); this.setVar('--ar-glass-blur', '0px')
        return
      }
      document.body.setAttribute(GLASS_ATTR, 'on')
      const inDark = document.body.dataset.dsDarkTheme !== undefined
      const alpha = glassAlpha(settings.panelOpacity) * (inDark ? 0.4 : 0.8)
      for (const t of GLASS_TOKENS) s.setProperty(t, `rgba(255,255,255,${alpha.toFixed(3)})`)
    } catch { /* ignore */ }
  }

  private removeLayers(): void {
    try {
      if (this.layer) { this.layer.remove(); this.layer = null; this.img = null }
      if (this.scrim) { this.scrim.remove(); this.scrim = null }
    } catch { /* ignore */ }
  }
}

const painter = new BackgroundPainter()

// ---------------------------------------------------------------------------
// Transport: persist via the switchblade settings namespace over the
// connection RPC (the same proven path MCP/prompts use; no webServer route,
// no settings-RPC allowlist dependency). Module-private state avoids any
// self-reference / circular-eval order issue.
// ---------------------------------------------------------------------------
import type { ConnectionHandle } from '@deepseek-ai/dsh-api-remotes/client'

const bgState: { status: 'loading' | 'ready' | 'error'; value: BackgroundSettings } = { status: 'loading', value: DEFAULT_BACKGROUND }
const bgListeners = new Set<() => void>()
const notifyBg = (): void => { for (const l of bgListeners) l() }

let bgApi: ConnectionHandle['api'] | undefined

/** Bind the transport to a live connection API (set once at plugin apply). */
export function initBackgroundClient(api: ConnectionHandle['api']): void {
  bgApi = api
}

/** Surface key: separate wallpaper per web vs desktop (they share the settings doc). */
export const isDesktopSurface = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('electron')
const surfaceKey = (): string => (isDesktopSurface ? 'backgroundDesktop' : 'backgroundWeb')

/** Read the background section for the current surface from the switchblade settings. */
function readSection(value: unknown): BackgroundSettings {
  const sec = (value as { namespaces?: { ns?: string; value?: unknown }[] | undefined }).namespaces
    ?.find((n) => n.ns === 'switchblade')?.value as Record<string, unknown> | undefined
  const raw = sec?.[surfaceKey()]
  return { ...DEFAULT_BACKGROUND, ...(typeof raw === 'object' && raw !== null ? (raw as BackgroundSettings) : {}) }
}

export const backgroundClient = {
  getSnapshot() { return bgState },
  subscribe(l: () => void): () => void { bgListeners.add(l); return () => { bgListeners.delete(l) } },
  /** Fetch the durable section. @returns true on success (status ready). */
  async load(): Promise<boolean> {
    if (bgApi === undefined) { bgState.status = 'error'; return false }
    try {
      const res = await bgApi.settings.describe({})
      if (!res.result.ok) throw new Error(res.result.error.message)
      bgState.status = 'ready'
      bgState.value = readSection(res.result.value)
      notifyBg()
      return true
    } catch {
      bgState.status = 'error'
      return false
    }
  },
  async save(section: BackgroundSettings): Promise<void> {
    if (bgApi === undefined) return
    try {
      const res = await bgApi.settings.mutate({ ns: 'switchblade', ops: [{ op: 'set', path: [surfaceKey()], value: section }] })
      if (!res.result.ok) throw new Error(res.result.error.message)
      bgState.status = 'ready'
      bgState.value = { ...section }
    } catch { bgState.status = 'error'; bgState.value = section }
    notifyBg()
  },
}

/** Upload a local image/video to the Host (bytes go to disk, never settings). */
export async function uploadMedia(file: File): Promise<{ id: string; kind: 'image' | 'video'; url: string } | null> {
  try {
    const res = await fetch('/api/switchblade-wallpaper/upload', { method: 'POST', headers: { 'content-type': file.type }, body: file })
    const body = (await res.json()) as { ok: boolean; id?: string; kind?: 'image' | 'video'; url?: string }
    if (!res.ok || !body.ok || !body.id || !body.kind || !body.url) return null
    return { id: body.id, kind: body.kind, url: body.url }
  } catch { return null }
}

/** Apply a full section through the painter (idempotent, never throws). */
export function applyBackground(section: BackgroundSettings): void {
  try { painter.apply(section) } catch { /* never fatal */ }
  applyHintStyle()
}

let hintObserver: MutationObserver | undefined

/** Inject (or clear) the per-surface style for the composer's hint row + dock stats line. */
export function applyHintStyle(): void {
  try {
    const hint = (bgState.value ?? DEFAULT_BACKGROUND).hint ?? DEFAULT_BACKGROUND.hint
    const existing = document.getElementById('switchblade-hint') as HTMLStyleElement | null
    if (!hint.enabled) {
      if (existing !== null) existing.remove()
      hintObserver?.disconnect(); hintObserver = undefined
      return
    }
    if (existing === null) {
      const t = document.createElement('style'); t.id = 'switchblade-hint'; document.head.appendChild(t)
    }
    const tag = document.getElementById('switchblade-hint') as HTMLStyleElement
    const color = hint.color || (isDesktopSurface ? '#7ee787' : '#79c0ff')
    const size = hint.size || 11
    const grad = hint.gradient ?? ''
    let hintCss = `[data-decoration="hint"]{font-size:${size}px;letter-spacing:0.3px;font-weight:600;opacity:0.95;`
    const statsStyle = (root: HTMLElement): void => {
      if (grad !== '') {
        root.style.backgroundImage = grad
        root.style.webkitBackgroundClip = 'text'
        root.style.backgroundClip = 'text'
        root.style.color = 'transparent'
      } else {
        root.style.backgroundImage = 'none'
        root.style.webkitBackgroundClip = 'initial'
        root.style.backgroundClip = 'initial'
        root.style.color = color
      }
      root.style.fontSize = `${size}px`
      root.style.fontWeight = '600'
      root.style.opacity = '0.95'
    }
    if (grad !== '') {
      hintCss += `background-image:${grad};-webkit-background-clip:text;background-clip:text;color:transparent`
    } else {
      hintCss += `color:${color}`
    }
    hintCss += '}'
    tag.textContent = hintCss
    // The dock's StatsLine roots are CSS-module hashed; locate via its aria-hidden "|" separators.
    const applyStats = (): void => {
      try {
        const seps = Array.from(document.querySelectorAll<HTMLSpanElement>('span[aria-hidden]'))
        for (const sep of seps) {
          if (sep.textContent !== '|') continue
          const root = sep.parentElement
          if (root !== null) statsStyle(root)
        }
      } catch { /* ignore */ }
    }
    if (hintObserver !== undefined) hintObserver.disconnect()
    hintObserver = new MutationObserver(applyStats)
    hintObserver.observe(document.body, { childList: true, subtree: true })
    applyStats()
  } catch { /* never fatal */ }
}
