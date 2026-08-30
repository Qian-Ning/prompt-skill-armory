/**
 * Switchblade section data controller: reads the skill catalog and the prompt
 * preset roster through the existing connection RPC surface (no Typert
 * generation needed — these methods are already wired).
 * @module @deepseek-ai/dsh-client-ui-switchblade
 */

import type { ConnectionHandle, SessionId } from '@deepseek-ai/dsh-api-remotes/client'
import { createSnapshotStore, type SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client'

/** A skill row as reported by skill.list. */
export interface SkillRow {
  readonly name: string
  readonly description: string
  readonly modelInvocable: boolean
}

/** A prompt-preset row as reported by agentPreset.list. */
export interface PresetRow {
  readonly id: string
  readonly name?: string
  readonly description?: string
  readonly isDefault: boolean
  readonly trust: string
  readonly broken?: string
}

/** A command row (not yet wired to an RPC; kept for the section's third group). */
export interface CommandRow {
  readonly name: string
  readonly description: string
}

/** One user-authored prompt (mirrors the Host ManagedPrompt). */
export interface PromptRow {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly content: string
  readonly order: number
  readonly enabled: boolean
  readonly isDefault: boolean
}

/** An installed skill row. */
export interface InstalledSkillRow {
  readonly name: string
  readonly description: string
  readonly content: string
  /** Whether this skill is currently registered (enabled) as a runtime skill. */
  readonly enabled: boolean
}

/** One configured MCP server (mirrors the Host McpServerConfig). */
export interface McpServerRow {
  readonly serverName: string
  readonly transport: 'stdio' | 'streamable-http'
  readonly command?: string
  readonly args?: readonly string[]
  readonly env?: Readonly<Record<string, string>>
  readonly url?: string
  readonly headers?: Readonly<Record<string, string>>
  readonly enabled: boolean
  /** Runtime: whether a live mcp-client instance is loaded. */
  readonly running?: boolean
  /** Runtime: tools currently registered from this server. */
  readonly tools?: readonly { name: string; description: string }[]
  /** Runtime: last startup/connection error, if any. */
  readonly lastError?: string
}

/** The section's loaded view state. */
export interface SwitchbladeSectionState {
  readonly status: 'idle' | 'loading' | 'ready' | 'error'
  readonly message?: string
  readonly skills: readonly SkillRow[]
  readonly presets: readonly PresetRow[]
  readonly commands: readonly CommandRow[]
  readonly prompts: readonly PromptRow[]
  readonly installedSkills: readonly InstalledSkillRow[]
  readonly mcpServers: readonly McpServerRow[]
}

/** Initial (idle) state. */
const IDLE: SwitchbladeSectionState = {
  status: 'idle',
  skills: [],
  presets: [],
  commands: [],
  prompts: [],
  installedSkills: [],
  mcpServers: [],
}

/** Normalize a thrown wire error to a message. */
function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export class SwitchbladeSectionController {
  /** Snapshot store backing the section's view state. */
  readonly store: SnapshotStore<SwitchbladeSectionState> = createSnapshotStore(IDLE)

  constructor(
    private readonly api: ConnectionHandle['api'],
    private readonly sessionId?: () => SessionId | undefined,
  ) {}

  /**
   * Load skills, presets, prompts, and installed skills. Prompts and installed
   * skills come from the `switchblade` settings namespace (the Host watches
   * it and re-injects on change).
   */
  async load(): Promise<void> {
    this.store.set({ ...IDLE, status: 'loading' })
    try {
      // skill.list requires a live session; without one we skip it (never
      // hang). Presets + settings always resolve, so the panel opens reliably.
      const sessionId = this.sessionId?.()
      const calls: Promise<unknown>[] = [
        this.api.agentPresets.list({}),
        this.api.settings.describe({}),
      ]
      if (sessionId !== undefined) calls.push(this.api.skills.list({ sessionId }))
      const [presetRes, settingsRes, skillRes] = await Promise.all(calls) as [
        Awaited<ReturnType<ConnectionHandle['api']['agentPresets']['list']>>,
        Awaited<ReturnType<ConnectionHandle['api']['settings']['describe']>>,
        Awaited<ReturnType<ConnectionHandle['api']['skills']['list']>> | undefined,
      ]
      if (!presetRes.result.ok) throw new Error(`agentPreset.list: ${presetRes.result.error.message}`)
      if (!settingsRes.result.ok) throw new Error(`settings.describe: ${settingsRes.result.error.message}`)

      const skills: SkillRow[] = skillRes !== undefined && skillRes.result.ok
        ? skillRes.result.value.skills.map((skill) => ({
          name: skill.name,
          description: skill.description,
          modelInvocable: skill.modelInvocable,
        }))
        : []

      const presets: PresetRow[] = presetRes.result.value.presets.map((preset) => ({
        id: preset.id,
        isDefault: preset.isDefault,
        trust: preset.trust,
        ...preset.name === undefined ? {} : { name: preset.name },
        ...preset.description === undefined ? {} : { description: preset.description },
        ...preset.broken === undefined ? {} : { broken: preset.broken },
      }))

      const switchbladeSection = this.sectionFromSettings(settingsRes.result.value, 'switchblade')
      const prompts: PromptRow[] = Array.isArray(switchbladeSection?.prompts) ? switchbladeSection.prompts : []
      const installedSkills: InstalledSkillRow[] = Array.isArray(switchbladeSection?.installedSkills)
        ? switchbladeSection.installedSkills.map((s: { name?: string; description?: string; content?: string; enabled?: boolean }) => ({
          name: s.name ?? '',
          description: s.description ?? '',
          content: s.content ?? '',
          enabled: s.enabled ?? true,
        }))
        : []
      const mcpServers: McpServerRow[] = Array.isArray(switchbladeSection?.mcpServers)
        ? switchbladeSection.mcpServers.map((s: McpServerRow) => {
          const status = (switchbladeSection?.mcpStatus as Record<string, { running?: boolean; tools?: readonly { name: string; description: string }[]; lastError?: string }> | undefined)?.[s.serverName]
          return {
            serverName: s.serverName,
            transport: s.transport,
            ...s.command === undefined ? {} : { command: s.command },
            ...s.args === undefined ? {} : { args: s.args },
            ...s.env === undefined ? {} : { env: s.env },
            ...s.url === undefined ? {} : { url: s.url },
            ...s.headers === undefined ? {} : { headers: s.headers },
            enabled: s.enabled ?? true,
            ...status === undefined ? {} : {
              running: status.running ?? false,
              tools: status.tools ?? [],
              ...status.lastError === undefined ? {} : { lastError: status.lastError },
            },
          }
        })
        : []

      this.store.set({
        status: 'ready',
        skills,
        presets,
        commands: [],
        prompts,
        installedSkills,
        mcpServers,
      })
    } catch (error) {
      this.store.set({ ...IDLE, status: 'error', message: messageOf(error) })
    }
  }

  /** Read one namespace's user section from a settings.describe value. */
  private sectionFromSettings(value: unknown, ns: string): Record<string, unknown> | undefined {
    if (typeof value !== 'object' || value === null) return undefined
    const entries = (value as { namespaces?: unknown }).namespaces
    if (!Array.isArray(entries)) return undefined
    for (const entry of entries) {
      const row = entry as { ns?: unknown; value?: unknown }
      if (row.ns === ns) {
        const section = row.value
        return typeof section === 'object' && section !== null ? section as Record<string, unknown> : undefined
      }
    }
    return undefined
  }

  // ---------------------------------------------------------------------------
  // Prompt CRUD (writes to the switchblade settings namespace; Host re-injects)
  // ---------------------------------------------------------------------------

  /** Add a prompt. */
  async addPrompt(input: { name: string; description: string; content: string }): Promise<void> {
    const res = await this.api.settings.mutate({
      ns: 'switchblade',
      ops: [{ op: 'set', path: ['prompts'], value: [...this.currentPrompts(), {
        id: this.slugify(input.name),
        name: input.name,
        description: input.description,
        content: input.content,
        order: this.currentPrompts().length,
        enabled: true,
        isDefault: this.currentPrompts().length === 0,
      }] }],
    })
    if (!res.result.ok) throw new Error(res.result.error.message)
    await this.load()
  }

  /** Toggle one prompt's enabled state. */
  async setPromptEnabled(id: string, enabled: boolean): Promise<void> {
    const next = this.currentPrompts().map((p) => p.id === id ? { ...p, enabled } : p)
    await this.writePrompts(next)
  }

  /** Mark one prompt default; clears others. */
  async setDefaultPrompt(id: string): Promise<void> {
    const next = this.currentPrompts().map((p) => ({ ...p, isDefault: p.id === id }))
    await this.writePrompts(next)
  }

  /** Delete one prompt. */
  async deletePrompt(id: string): Promise<void> {
    const next = this.currentPrompts().filter((p) => p.id !== id)
    await this.writePrompts(next)
  }

  /** Update a prompt's name/description/content. */
  async updatePrompt(id: string, patch: { name?: string; description?: string; content?: string }): Promise<void> {
    const next = this.currentPrompts().map((p) => p.id === id ? {
      ...p,
      name: patch.name?.trim() || p.name,
      description: patch.description ?? p.description,
      content: patch.content ?? p.content,
    } : p)
    await this.writePrompts(next)
  }

  /** Persist the prompt list through the settings RPC. */
  private async writePrompts(prompts: readonly PromptRow[]): Promise<void> {
    const res = await this.api.settings.mutate({
      ns: 'switchblade',
      ops: [{ op: 'set', path: ['prompts'], value: prompts }],
    })
    if (!res.result.ok) throw new Error(res.result.error.message)
    await this.load()
  }

  /** Current prompt list from the loaded snapshot. */
  private currentPrompts(): readonly PromptRow[] {
    return this.store.getSnapshot().prompts
  }

  /** Sluggify a name into an id. */
  private slugify(value: string): string {
    const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    return slug.length > 0 ? slug : `prompt-${Date.now()}`
  }

  // ---------------------------------------------------------------------------
  // Skill install/uninstall (writes to the switchblade settings namespace)
  // ---------------------------------------------------------------------------

  /** Install a skill from a name + content (enabled by default). */
  async installSkill(input: { name: string; description: string; content: string }): Promise<void> {
    const next = [...this.currentInstalledSkills(), {
      name: input.name,
      description: input.description,
      content: input.content,
      enabled: true,
    }]
    const res = await this.api.settings.mutate({
      ns: 'switchblade',
      ops: [{ op: 'set', path: ['installedSkills'], value: next }],
    })
    if (!res.result.ok) throw new Error(res.result.error.message)
    await this.load()
  }

  /** Toggle one installed skill's enabled state. */
  async setSkillEnabled(name: string, enabled: boolean): Promise<void> {
    const next = this.currentInstalledSkills().map((s) => s.name === name ? { ...s, enabled } : s)
    const res = await this.api.settings.mutate({
      ns: 'switchblade',
      ops: [{ op: 'set', path: ['installedSkills'], value: next }],
    })
    if (!res.result.ok) throw new Error(res.result.error.message)
    await this.load()
  }

  /** Uninstall one installed skill. */
  async uninstallSkill(name: string): Promise<void> {
    const next = this.currentInstalledSkills().filter((s) => s.name !== name)
    const res = await this.api.settings.mutate({
      ns: 'switchblade',
      ops: [{ op: 'set', path: ['installedSkills'], value: next }],
    })
    if (!res.result.ok) throw new Error(res.result.error.message)
    await this.load()
  }

  /** Update an installed skill's name/description/content. */
  async updateSkill(name: string, patch: { name?: string; description?: string; content?: string }): Promise<void> {
    const next = this.currentInstalledSkills().map((s) => s.name === name ? {
      ...s,
      name: patch.name?.trim() || s.name,
      description: patch.description ?? s.description,
      content: patch.content ?? s.content,
    } : s)
    const res = await this.api.settings.mutate({
      ns: 'switchblade',
      ops: [{ op: 'set', path: ['installedSkills'], value: next }],
    })
    if (!res.result.ok) throw new Error(res.result.error.message)
    await this.load()
  }

  /** Current installed skills from the loaded snapshot. */
  private currentInstalledSkills(): readonly InstalledSkillRow[] {
    return this.store.getSnapshot().installedSkills
  }

  /**
   * Queue a zip archive (base64) for extraction into ~/.dsh/skills. The Host
   * watch sees pendingZip and installs it (skil-filesystem then discovers it).
   */
  async installSkillFromZip(name: string, dataBase64: string): Promise<void> {
    const res = await this.api.settings.mutate({
      ns: 'switchblade',
      ops: [{ op: 'set', path: ['pendingZip'], value: { name, dataBase64 } }],
    })
    if (!res.result.ok) throw new Error(res.result.error.message)
    // Wait a tick for the Host watch to extract, then refresh.
    await new Promise((r) => setTimeout(r, 500))
    await this.load()
  }

  /** Set the default prompt preset. */
  async setDefaultPreset(id: string): Promise<void> {
    const res = await this.api.settings.update({ ns: 'agent-presets', patch: { default: id } })
    if (!res.result.ok) throw new Error(res.result.error.message)
    await this.load()
  }

  // ---------------------------------------------------------------------------
  // MCP server management (writes to the switchblade settings namespace; the
  // Host watch auto-starts/stops the mcp-client instances)
  // ---------------------------------------------------------------------------

  /** Add a new MCP server config. */
  async addMcpServer(config: McpServerRow): Promise<void> {
    const next = [...this.currentMcpServers(), config]
    await this.writeMcpServers(next)
  }

  /** Update an MCP server config. */
  async updateMcpServer(name: string, patch: Partial<McpServerRow>): Promise<void> {
    const next = this.currentMcpServers().map((s) => s.serverName === name ? { ...s, ...patch, serverName: name } : s)
    await this.writeMcpServers(next)
  }

  /** Toggle one MCP server's enabled state (Host auto-starts/stops). */
  async toggleMcpServer(name: string, enabled: boolean): Promise<void> {
    const next = this.currentMcpServers().map((s) => s.serverName === name ? { ...s, enabled } : s)
    await this.writeMcpServers(next)
  }

  /** Remove an MCP server config. */
  async removeMcpServer(name: string): Promise<void> {
    const next = this.currentMcpServers().filter((s) => s.serverName !== name)
    await this.writeMcpServers(next)
  }

  /**
   * Ask the Host to (re)start one server and republish its live status. The
   * Host processes the one-shot request and updates mcpStatus; we refresh
   * after a short delay so the panel shows the fresh tool list / error.
   */
  async testMcpServer(name: string): Promise<void> {
    const res = await this.api.settings.mutate({
      ns: 'switchblade',
      ops: [{ op: 'set', path: ['mcpTestRequest'], value: { serverName: name, ts: Date.now() } }],
    })
    if (!res.result.ok) throw new Error(res.result.error.message)
    await new Promise((r) => setTimeout(r, 2000))
    await this.load()
  }

  /** Persist the MCP server config list. */
  private async writeMcpServers(servers: readonly McpServerRow[]): Promise<void> {
    const res = await this.api.settings.mutate({
      ns: 'switchblade',
      ops: [{ op: 'set', path: ['mcpServers'], value: servers }],
    })
    if (!res.result.ok) throw new Error(res.result.error.message)
    await this.load()
  }

  /** Current MCP server list from the loaded snapshot. */
  private currentMcpServers(): readonly McpServerRow[] {
    return this.store.getSnapshot().mcpServers
  }
}

/** The section's injected face: hooks (snapshot store) + actions. */
export interface SwitchbladeSectionInjected {
  hooks: {
    /** Page snapshot bound by the renderer as useSwitchblade. */
    switchblade: SnapshotStore<SwitchbladeSectionState>
  }
  load: () => Promise<void>
  setDefaultPreset: (id: string) => Promise<void>
  addPrompt: (input: { name: string; description: string; content: string }) => Promise<void>
  updatePrompt: (id: string, patch: { name?: string; description?: string; content?: string }) => Promise<void>
  setPromptEnabled: (id: string, enabled: boolean) => Promise<void>
  setDefaultPrompt: (id: string) => Promise<void>
  deletePrompt: (id: string) => Promise<void>
  installSkill: (input: { name: string; description: string; content: string }) => Promise<void>
  updateSkill: (name: string, patch: { name?: string; description?: string; content?: string }) => Promise<void>
  setSkillEnabled: (name: string, enabled: boolean) => Promise<void>
  uninstallSkill: (name: string) => Promise<void>
  installSkillFromZip: (name: string, dataBase64: string) => Promise<void>
  addMcpServer: (config: McpServerRow) => Promise<void>
  updateMcpServer: (name: string, patch: Partial<McpServerRow>) => Promise<void>
  toggleMcpServer: (name: string, enabled: boolean) => Promise<void>
  removeMcpServer: (name: string) => Promise<void>
  testMcpServer: (name: string) => Promise<void>
}
