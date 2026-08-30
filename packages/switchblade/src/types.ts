/**
 * Shared types for `@deepseek-ai/dsh-switchblade`.
 *
 * Switchblade normalizes the three CCswitch-style management targets — skills,
 * prompt profiles (agent presets), and slash commands — onto one catalog and
 * one lifecycle. Host-facing values extend the real DSH types so consumers
 * (CLI, Web UI projection) never reinvent the seam.
 *
 * @module @deepseek-ai/dsh-switchblade
 */

import type { AgentPreset } from '@deepseek-ai/dsh-agent-presets'
import type { CommandDescriptor } from '@deepseek-ai/dsh-commands'
import type { SkillDefinition, SkillRegistration, SkillSummary } from '@deepseek-ai/dsh-skill'

/** The kinds of managed object Switchblade reasons about. */
export type ManagedKind = 'skill' | 'profile' | 'command'

/** Installation/ownership state of one managed object. */
export type SwitchState = 'installed' | 'enabled' | 'disabled'

/** One normalized catalog row. `id` is unique within a `kind`. */
export interface SwitchbladeEntry {
  /** Discriminating kind. */
  readonly kind: ManagedKind
  /** Stable identifier used to address the entry (`skill:<name>`, `profile:<id>`, `command:<name>`). */
  readonly id: string
  /** Display name. */
  readonly name: string
  /** One-line routing description. */
  readonly description: string
  /** Ownership/visibility state. */
  readonly state: SwitchState
}

/** Skill-specific payload carried alongside a catalog row. */
export interface SkillEntry extends SwitchbladeEntry, Pick<SkillSummary, 'source' | 'invocation'> {
  readonly kind: 'skill'
  /** Owned by Switchblade (installed from a local source) vs discovered by a provider. */
  readonly owned: boolean
  /** The winning body when loaded, or undefined while only a summary is known. */
  readonly definition?: SkillDefinition
}

/** Prompt-profile payload mapped from the agent-presets roster. */
export interface ProfileEntry extends SwitchbladeEntry {
  readonly kind: 'profile'
  /** Whether this preset is the session default. */
  readonly isDefault: boolean
  /** Underlying preset row as resolved by the roster. */
  readonly preset: AgentPreset
}

/** Slash-command payload mapped from the command registry. */
export interface CommandEntry extends SwitchbladeEntry {
  readonly kind: 'command'
  /** Descriptor as advertised to discovery UI. */
  readonly descriptor: CommandDescriptor
}

/** One catalog snapshot returned by `Switchblade.catalog()`. */
export interface SwitchbladeCatalog {
  /** All managed entries, sorted by kind then name. */
  readonly entries: readonly SwitchbladeEntry[]
  /** The prompt profile currently defaulted, by id, if any. */
  readonly defaultProfile?: string
}

/** Input to install a locally owned skill that Switchblade registers as a runtime skill. */
export interface InstallSkillInput {
  /** Kebab-case runtime skill name accepted by the skill grammar. */
  readonly name: string
  /** Model-facing instruction body. */
  readonly content: string
  /** Short routing description. */
  readonly description: string
  /** Invocation controls; omitted permits both model and user surfaces. */
  readonly invocation?: SkillRegistration['invocation']
  /** Optional provider label; omitted uses the registry-owned runtime provider. */
  readonly provider?: string
}

/** Result of applying one management action. */
export interface SwitchbladeActionResult {
  /** Stable id the action addressed. */
  readonly id: string
  /** Resulting state after the action. */
  readonly state: SwitchState
}

/** Registry snapshot backing `Switchblade.catalog()`. */
export interface SwitchbladeSnapshot {
  readonly skills: readonly SkillSummary[]
  readonly presets: readonly AgentPreset[]
  readonly commands: readonly CommandDescriptor[]
}

/** One configured MCP server (persisted in the switchblade settings namespace). */
export interface McpServerConfig {
  /** Stable namespace for this server's model-facing tool names (`mcp__<serverName>__<rawName>`). */
  readonly serverName: string
  /** Transport: spawn a child process over stdio, or connect over Streamable HTTP. */
  readonly transport: 'stdio' | 'streamable-http'
  /** Executable to spawn (stdio transport). */
  readonly command?: string
  /** Arguments passed to the command (stdio transport). */
  readonly args?: readonly string[]
  /** Extra env vars merged on top of scrubbed ambient env (stdio transport). */
  readonly env?: Readonly<Record<string, string>>
  /** MCP endpoint URL (streamable-http transport). */
  readonly url?: string
  /** Additional headers attached to MCP requests (streamable-http transport). */
  readonly headers?: Readonly<Record<string, string>>
  /** Whether this server should be running (auto-started on plugin load). */
  readonly enabled: boolean
}

/** Runtime status of one MCP server. */
export interface McpServerStatus {
  /** Server namespace. */
  readonly serverName: string
  /** Transport type. */
  readonly transport: 'stdio' | 'streamable-http'
  /** Whether the server is configured to run. */
  readonly enabled: boolean
  /** Whether a live mcp-client instance is currently loaded. */
  readonly running: boolean
  /** Number of tools currently registered from this server. */
  readonly toolCount: number
  /** Tools currently registered from this server (server-qualified names). */
  readonly tools: readonly McpToolInfo[]
  /** Last startup/connection error, if any. */
  readonly lastError?: string
}

/** One MCP tool registered on `ctx.tools` under a server-qualified name. */
export interface McpToolInfo {
  /** Public tool name (`mcp__<serverName>__<rawName>`). */
  readonly name: string
  /** Server-provided description. */
  readonly description: string
}
