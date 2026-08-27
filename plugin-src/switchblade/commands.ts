/**
 * The `/sw` slash-command family.
 *
 * Registered through `ctx.commands.register` (global layer) by the Switchblade
 * service constructor. Each handler runs directly, without a model round-trip,
 * exactly like a CCswitch toggle — the result text is what surfaces.
 *
 * @module @deepseek-ai/dsh-switchblade
 */

import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { CommandDefinition, CommandInvocation, CommandResult } from '@deepseek-ai/dsh-commands'
import type { Switchblade } from './switchblade.ts'

/** Extract non-empty space-separated tokens from a command's raw input. */
function tokens(input: string): string[] {
  return input.trim().split(/\s+/).filter((token) => token.length > 0)
}

/** One result helper: `text` yields a success result, `error` an error one. */
function ok(text: string): CommandResult {
  return { kind: 'success', text }
}

function err(text: string): CommandResult {
  return { kind: 'error', text }
}

/** Render a compact two-column table from normalized entries. */
function renderRows(rows: readonly { state: string; id: string; description: string }[]): string {
  if (rows.length === 0) return '  (empty)'
  return rows.map((row) => `  [${row.state.padEnd(9)}] ${row.id} — ${row.description}`).join('\n')
}

/** Register every `/sw` command against a live Switchblade instance. */
export function defineCommands(ctx: Switchblade['ctx'], sb: Switchblade): void {
  const commands: readonly CommandDefinition[] = [
    {
      name: 'armory',
      description: 'Switchblade: list installed skills, profiles, and slash commands',
      handler: async (invocation: CommandInvocation): Promise<CommandResult> => {
        const catalog = await sb.catalog(invocation.agent)
        const skills = catalog.entries.filter((row) => row.kind === 'skill')
        const profiles = catalog.entries.filter((row) => row.kind === 'profile')
        const commands = catalog.entries.filter((row) => row.kind === 'command')
        return ok(
          `skills:\n${renderRows(skills)}\n`
          + `profiles${catalog.defaultProfile === undefined ? '' : ` (default: ${catalog.defaultProfile})`}:\n${renderRows(profiles)}\n`
          + `commands:\n${renderRows(commands)}`,
        )
      },
    },
    {
      name: 'armory-enable',
      description: 'Switchblade: enable an installed skill by name',
      handler: async (invocation: CommandInvocation): Promise<CommandResult> => {
        const name = tokens(invocation.rawInput)[0]
        if (name === undefined) return err('/armory-enable <skill-name>')
        const result = await sb.setSkillEnabled(name, true)
        return ok(`enabled ${result.id} (${result.state})`)
      },
    },
    {
      name: 'armory-disable',
      description: 'Switchblade: disable an installed skill by name',
      handler: async (invocation: CommandInvocation): Promise<CommandResult> => {
        const name = tokens(invocation.rawInput)[0]
        if (name === undefined) return err('/armory-disable <skill-name>')
        const result = await sb.setSkillEnabled(name, false)
        return ok(`disabled ${result.id} (${result.state})`)
      },
    },
    {
      name: 'armory-install',
      description: 'Switchblade: install a local skill (<name>.md) and enable it at once',
      handler: async (invocation: CommandInvocation): Promise<CommandResult> => {
        const args = tokens(invocation.rawInput)
        const name = args[0]
        if (name === undefined) return err('/armory-install <skill-name>')
        const source = args[1] ?? name
        try {
          const content = await readFile(join(process.cwd(), '.dsh', 'skills', `${source}.md`), 'utf8')
          const result = await sb.installSkill({ name, content, description: `installed from ${source}.md` })
          return ok(`installed ${result.id} (${result.state})`)
        } catch (error) {
          return err(`could not install ${name}: ${error instanceof Error ? error.message : String(error)}`)
        }
      },
    },
    {
      name: 'armory-uninstall',
      description: 'Switchblade: uninstall an owned skill by name',
      handler: async (invocation: CommandInvocation): Promise<CommandResult> => {
        const name = tokens(invocation.rawInput)[0]
        if (name === undefined) return err('/armory-uninstall <skill-name>')
        const result = await sb.uninstallSkill(name)
        return ok(`uninstalled ${result.id} (${result.state})`)
      },
    },
    {
      name: 'armory-profile',
      description: 'Switchblade: show or set the default prompt profile',
      handler: async (invocation: CommandInvocation): Promise<CommandResult> => {
        const args = tokens(invocation.rawInput)
        if (args[0] === 'default' && args[1] !== undefined) {
          await sb.setDefaultProfile(args[1])
          return ok(`default profile set to ${args[1]}`)
        }
        const catalog = await sb.catalog(invocation.agent)
        return ok(catalog.entries.filter((row) => row.kind === 'profile').length === 0
          ? '  (no profiles)'
          : renderRows(catalog.entries.filter((row) => row.kind === 'profile')))
      },
    },
    {
      name: 'armory-export',
      description: 'Switchblade: export the managed state as a bundle patch layer',
      handler: async (_invocation: CommandInvocation): Promise<CommandResult> => {
        const patch = await sb.exportBundle()
        const destination = join(process.cwd(), '.dsh', 'switchblade.cordis.patch.yml')
        try {
          await writeFile(destination, patch, 'utf8')
          return ok(`exported ${destination}`)
        } catch (error) {
          return err(`could not write ${destination}: ${error instanceof Error ? error.message : String(error)}`)
        }
      },
    },
    {
      name: 'armory-import',
      description: 'Switchblade: import switchblade rows from a bundle patch file',
      handler: async (invocation: CommandInvocation): Promise<CommandResult> => {
        const path = tokens(invocation.rawInput)[0]
        if (path === undefined) return err('/armory-import <path-to-cordis.patch.yml>')
        try {
          const text = await readFile(path, 'utf8')
          await sb.importBundle(text)
          return ok(`imported ${path}`)
        } catch (error) {
          return err(`could not import ${path}: ${error instanceof Error ? error.message : String(error)}`)
        }
      },
    },
    {
      name: 'armory-skill-dir',
      description: 'Switchblade: install a skill directory (SKILL.md + references) into ~/.dsh/skills',
      handler: async (invocation: CommandInvocation): Promise<CommandResult> => {
        const dir = tokens(invocation.rawInput)[0]
        if (dir === undefined) return err('/armory-skill-dir <absolute-skill-directory>')
        try {
          const name = await sb.installSkillFromDir(dir)
          return ok(`installed skill "${name}" from ${dir} — now invocable via /${name}`)
        } catch (error) {
          return err(`could not install skill dir ${dir}: ${error instanceof Error ? error.message : String(error)}`)
        }
      },
    },
    {
      name: 'armory-install-zip',
      description: 'Switchblade: install skills from a .zip archive into ~/.dsh/skills',
      handler: async (invocation: CommandInvocation): Promise<CommandResult> => {
        const zip = tokens(invocation.rawInput)[0]
        if (zip === undefined) return err('/armory-install-zip <absolute-path-to-skill.zip>')
        try {
          const installed = await sb.installSkillFromZip(zip)
          if (installed.length === 0) return err('zip contained no entries')
          return ok(`installed from ${zip}: ${installed.join(', ')} — now invocable via /<name>`)
        } catch (error) {
          return err(`could not install zip ${zip}: ${error instanceof Error ? error.message : String(error)}`)
        }
      },
    },
  ]

  for (const definition of commands) {
    ctx.commands.register(definition)
    // Legacy aliases: /sw-* still work for users of earlier versions.
    if (definition.name.startsWith('armory')) {
      const legacy = definition.name === 'armory' ? 'sw' : `sw-${definition.name.slice('armory-'.length)}`
      ctx.commands.register({ ...definition, name: legacy })
    }
  }
}
