#!/usr/bin/env node
/**
 * Verify the shipped plugin packages are structurally sound — WITHOUT
 * executing the bundles.
 *
 * The bundles import DSH runtime packages (`@deepseek-ai/cordis`, `dsh-settings`,
 * …) that only exist inside a deepseek-harness checkout. A bare `import()` in a
 * clean runner therefore fails with ERR_MODULE_NOT_FOUND. That is EXPECTED —
 * this repo ships a plugin, not a standalone app.
 *
 * So this script checks what is meaningful in isolation:
 *   1. every shipped `lib` .js file parses as valid ESM (syntax only),
 *   2. the entry points exist,
 *   3. the entries reference the DSH runtime packages they are supposed to
 *      consume (confirming they are externalized, not bundled-in).
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const failures = []
const log = (...a) => console.log(...a)

/** Recursively collect .js files under a dir. */
function jsFiles(dir) {
  if (!existsSync(dir)) return []
  const out = []
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name)
    if (ent.isDirectory()) out.push(...jsFiles(p))
    else if (ent.name.endsWith('.js')) out.push(p)
  }
  return out
}

for (const pkg of ['switchblade', 'client-ui-switchblade']) {
  const dir = join(root, 'packages', pkg)
  log(`\n== packages/${pkg} ==`)

  // 1. entry points exist
  for (const entry of ['lib/index.js', 'package.json']) {
    const p = join(dir, entry)
    if (!existsSync(p)) failures.push(`missing ${entry} in ${pkg}`)
    else log(`✓ ${entry}`)
  }

  // 2. every .js parses as ESM (syntax only — no module resolution)
  const files = jsFiles(join(dir, 'lib'))
  log(`  syntax-checking ${files.length} lib file(s)…`)
  for (const f of files) {
    try {
      execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' })
    } catch (e) {
      failures.push(`syntax error in ${f}:\n${e.stderr?.toString() ?? e.message}`)
    }
  }
  log(`✓ ${files.length} file(s) parse`)

  // 3. Host entry externalizes the DSH runtime packages (not bundled-in).
  //    The client (ui-switchblade) is a pure UI plugin: its entry is a bare
  //    `apply()`/`name` pair and the real code ships via exports["./client"],
  //    talking to the host over connection RPC — so it has no runtime imports.
  if (pkg === 'switchblade') {
    const entry = readFileSync(join(dir, 'lib/index.js'), 'utf8')
    const expected = ['@deepseek-ai/cordis', '@deepseek-ai/dsh-settings']
    for (const dep of expected) {
      if (entry.includes(`from '${dep}'`) || entry.includes(`from "${dep}"`)) {
        log(`✓ imports ${dep} (externalized)`)
      } else {
        failures.push(`${pkg}: expected to import ${dep} but it is not external`)
      }
    }
  }
}

if (failures.length) {
  console.error('\n❌ VERIFY FAILED:')
  for (const f of failures) console.error('  - ' + f)
  process.exit(1)
}
console.log('\n✅ shipped packages verified (structure + syntax, no runtime deps needed)')
