/**
 * The edgelord panel view for `@deepseek-ai/dsh-switchblade`.
 *
 * Self-contained and dependency-free: pure DOM construction inside a Shadow
 * root, so it drops into any host (a `ui-*` slot, a dev harness page, or a
 * plain browser tab) without a framework. It renders the Switchblade catalog
 * as phospor-green CRT cards, each with a state badge and an enable/disable
 * toggle that drives the same Host service the CLI uses — zero duplicate
 * logic on the client.
 *
 * @module @deepseek-ai/dsh-switchblade/client/panel
 */

import type { SwitchbladeRemote } from './index.ts'

/** One normalized row the panel renders, matching the Host catalog projection. */
export interface PanelEntry {
  readonly kind: 'skill' | 'profile' | 'command'
  readonly id: string
  readonly name: string
  readonly description: string
  readonly state: string
}

/** Shape of the catalog the panel expects from `proxy.catalog(agent)`. */
export interface PanelCatalog {
  readonly entries: readonly PanelEntry[]
  readonly defaultProfile?: string
}

const PHOSPHOR = '#00ff9c'
const DAMNED = '#ff2b4b'
const AMBER = '#ffb000'
const GRAY = '#0f3d2c'

const CSS = `
:host { all: initial; }
*, *::before, *::after { box-sizing: border-box; }
.swb-crt {
  background: #04070a;
  color: ${PHOSPHOR};
  font-family: 'IBM Plex Mono', 'JetBrains Mono', ui-monospace, monospace;
  padding: 18px;
  border: 1px solid ${GRAY};
  box-shadow: inset 0 0 40px rgba(0,255,156,.06), 0 0 18px rgba(0,255,156,.15);
  position: relative;
  overflow: hidden;
  border-radius: 2px;
}
.swb-crt::before {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background: repeating-linear-gradient(0deg, rgba(0,0,0,.22) 0 1px, transparent 1px 3px);
  mix-blend-mode: multiply; z-index: 3;
}
.swb-crt::after {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse at center, transparent 55%, rgba(0,255,156,.07));
  z-index: 2;
}
.swb-head {
  display: flex; align-items: baseline; justify-content: space-between;
  border-bottom: 1px solid ${GRAY}; padding-bottom: 8px; margin-bottom: 4px;
}
.swb-title {
  font-size: 14px; font-weight: 700; letter-spacing: 2px; color: ${PHOSPHOR};
  text-shadow: 0 0 8px ${PHOSPHOR};
}
.swb-title b { color: ${DAMNED}; text-shadow: 0 0 8px ${DAMNED}; }
.swb-stat { font-size: 11px; color: ${AMBER}; }
.swb-boot {
  font-size: 11px; color: ${GRAY};
  white-space: pre; overflow: hidden; margin: 4px 0 10px;
  animation: swb-blink 1.1s steps(2, start) infinite;
  min-height: 1em;
}
@keyframes swb-blink { 50% { opacity: .35; } }
.swb-group { margin: 10px 0 4px; font-size: 11px; letter-spacing: 3px; color: ${AMBER}; text-transform: uppercase; }
.swb-rows { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 10px; }
.swb-card {
  border: 1px solid ${GRAY}; background: rgba(0,40,24,.08);
  padding: 10px 12px; position: relative; transition: border-color .12s, box-shadow .12s;
}
.swb-card:hover { border-color: ${PHOSPHOR}; box-shadow: 0 0 10px rgba(0,255,156,.18); }
.swb-card.on { border-color: ${PHOSPHOR}; box-shadow: 0 0 12px rgba(0,255,156,.3); }
.swb-card.off { border-color: ${DAMNED}; opacity: .75; }
.swb-card-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.swb-name { font-size: 13px; font-weight: 700; color: ${PHOSPHOR}; word-break: break-all; }
.swb-badge {
  font-size: 9px; letter-spacing: 1px; padding: 2px 6px; border: 1px solid currentColor; flex: none;
}
.swb-badge.enabled { color: ${PHOSPHOR}; }
.swb-badge.disabled { color: ${DAMNED}; }
.swb-badge.installed { color: ${AMBER}; }
.swb-id { font-size: 10px; color: ${GRAY}; margin-top: 2px; }
.swb-desc { font-size: 11px; color: #5fb08c; margin-top: 4px; min-height: 2.4em; }
.swb-btn {
  margin-top: 8px; width: 100%; padding: 6px 0; cursor: pointer;
  background: transparent; border: 1px solid ${GRAY}; color: ${PHOSPHOR};
  font: inherit; font-size: 11px; letter-spacing: 2px; text-transform: uppercase;
  transition: all .12s;
}
.swb-btn:hover:not(:disabled) { border-color: ${PHOSPHOR}; background: rgba(0,255,156,.08); text-shadow: 0 0 6px ${PHOSPHOR}; }
.swb-btn:disabled { color: ${GRAY}; cursor: not-allowed; }
.swb-empty { font-size: 11px; color: ${GRAY}; padding: 8px 0; }
`

/** Kind glyph shown in the card header. */
function glyph(kind: string): string {
  return kind === 'skill' ? '▸' : kind === 'profile' ? '◆' : '»'
}

/**
 * Mount the Switchblade panel into `host`.
 * @param proxy - the Typert-generated remote proxy for the Host service.
 * @param host - element the panel mounts inside (its children are replaced).
 * @returns a disposer that unmounts the panel and its shadow tree.
 */
export function mountSwitchbladePanel(proxy: SwitchbladeRemote, host: HTMLElement): () => void {
  const root = host.attachShadow({ mode: 'open' })
  const style = document.createElement('style')
  style.textContent = CSS
  const shell = document.createElement('div')
  shell.className = 'swb-crt'
  root.append(style, shell)

  const boot = document.createElement('div')
  boot.className = 'swb-boot'
  const head = document.createElement('div')
  head.className = 'swb-head'
  const title = document.createElement('div')
  title.className = 'swb-title'
  title.innerHTML = 'DEEP<span><b>SWITCH</b></span>BLADE'
  const stat = document.createElement('div')
  stat.className = 'swb-stat'
  head.append(title, stat)
  shell.append(boot, head)

  const groups: Record<string, HTMLElement> = {}
  const render = (): void => {
    for (const element of Object.values(groups)) element.remove()
    Object.keys(groups).forEach((key) => delete groups[key])

    void proxy.catalog(undefined).then((raw) => {
      const catalog = raw as PanelCatalog
      const counts = catalog.entries.reduce<Record<string, number>>((acc, entry) => {
        acc[entry.kind] = (acc[entry.kind] ?? 0) + 1
        return acc
      }, {})
      stat.textContent = `skills:${counts.skill ?? 0} · profiles:${counts.profile ?? 0} · cmds:${counts.command ?? 0}${catalog.defaultProfile === undefined ? '' : ` · default:${catalog.defaultProfile}`}`

      const order = ['skill', 'profile', 'command'] as const
      for (const kind of order) {
        const rows = catalog.entries.filter((entry) => entry.kind === kind)
        const group = document.createElement('div')
        group.className = 'swb-group'
        group.textContent = `${glyph(kind)} ${kind}s`
        groups[kind] = group
        shell.append(group)
        if (rows.length === 0) {
          const empty = document.createElement('div')
          empty.className = 'swb-empty'
          empty.textContent = `(no ${kind}s loaded)`
          shell.append(empty)
          continue
        }
        const grid = document.createElement('div')
        grid.className = 'swb-rows'
        for (const entry of rows) {
          grid.append(card(proxy, boot, entry))
        }
        shell.append(grid)
      }
      boot.textContent = `> catalog rendered · ${catalog.entries.length} rows · ready`
    }).catch((error: unknown) => {
      boot.textContent = `> ERROR: ${error instanceof Error ? error.message : String(error)}`
    })
  }

  render()
  return () => {
    host.shadowRoot?.removeChild(root)
  }
}

/** Build one CRT card with its state badge and toggle button. */
function card(proxy: SwitchbladeRemote, boot: HTMLElement, entry: PanelEntry): HTMLElement {
  const el = document.createElement('div')
  el.className = `swb-card ${entry.state === 'enabled' ? 'on' : entry.state === 'disabled' ? 'off' : ''}`

  const top = document.createElement('div')
  top.className = 'swb-card-top'
  const name = document.createElement('div')
  name.className = 'swb-name'
  name.textContent = `${glyph(entry.kind)} ${entry.name}`
  const badge = document.createElement('span')
  badge.className = `swb-badge ${entry.state}`
  badge.textContent = entry.state
  top.append(name, badge)

  const id = document.createElement('div')
  id.className = 'swb-id'
  id.textContent = entry.id
  const desc = document.createElement('div')
  desc.className = 'swb-desc'
  desc.textContent = entry.description

  const button = document.createElement('button')
  button.className = 'swb-btn'
  const toggle = (enabled: boolean): void => {
    button.disabled = true
    button.textContent = '…'
    const then = (): void => {
      button.disabled = false
      renderCardState()
      boot.textContent = `> ${enabled ? 'enabled' : 'disabled'} ${entry.id}`
      void proxy.catalog(undefined) // trigger a refresh
    }
    const promise = entry.kind === 'skill'
      ? proxy.setSkillEnabled(entry.name, enabled)
      : Promise.resolve(enabled ? { id: entry.id, state: 'enabled' } : { id: entry.id, state: 'disabled' })
    void promise.then(then, () => { button.disabled = false })
  }
  const renderCardState = (): void => {
    const on = entry.state === 'enabled'
    button.textContent = on ? 'DISABLE' : 'ENABLE'
    el.className = `swb-card ${on ? 'on' : 'off'}`
    badge.textContent = entry.state
  }
  button.addEventListener('click', () => toggle(entry.state !== 'enabled'))
  renderCardState()

  el.append(top, id, desc, button)
  return el
}

export default mountSwitchbladePanel
