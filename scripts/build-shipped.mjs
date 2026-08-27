#!/usr/bin/env node
/**
 * Sync the shipped plugin packages under `packages/` from a DeepSeek Harness
 * checkout.
 *
 * Usage:
 *   node scripts/build-shipped.mjs <path-to-deepseek-harness>
 *
 * Copies src + lib + manifests for both plugin packages, so the npm installer
 * ships complete packages (the `files` field includes packages/).
 */
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'packages')
const harness = process.argv[2]

if (!harness || !existsSync(join(harness, 'packages', 'switchblade', 'switchblade'))) {
  console.error('usage: node scripts/build-shipped.mjs <deepseek-harness-checkout>')
  process.exit(1)
}

const jobs = [
  {
    name: 'switchblade',
    from: join(harness, 'packages', 'switchblade', 'switchblade'),
    extra: ['cordis.patch.yml'],
  },
  {
    name: 'client-ui-switchblade',
    from: join(harness, 'packages', 'client', 'ui-switchblade'),
    extra: ['tsdown.config.ts'],
  },
]

for (const job of jobs) {
  const dest = join(out, job.name)
  rmSync(dest, { recursive: true, force: true })
  mkdirSync(dest, { recursive: true })
  for (const dir of ['src', 'lib']) {
    const p = join(job.from, dir)
    if (existsSync(p)) cpSync(p, join(dest, dir), { recursive: true })
  }
  for (const f of ['package.json', 'tsconfig.json', ...job.extra]) {
    const p = join(job.from, f)
    if (existsSync(p)) cpSync(p, join(dest, f))
  }
  console.log(`✓ synced packages/${job.name}`)
}
console.log('done — bump versions + CHANGELOG before publishing')
