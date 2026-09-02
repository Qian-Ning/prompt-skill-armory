#!/usr/bin/env node
/**
 * prompt-skill-armory — one-command installer.
 *
 *   npx prompt-skill-armory            # install into all DeepSeek Harness profiles
 *   npx prompt-skill-armory --postinstall
 *
 * What it does:
 *   1. Locates the harness home (~/.dsh, or $DSH_HOME).
 *   2. Finds every profile under profiles/ (web, desktop, …) and installs the
 *      bundled plugin packages into each profile's node_modules/@deepseek-ai/.
 *   3. Adds the Host bundle to each profile's dsh.profile.bundles.
 *   4. Prints next steps (build + launch).
 *
 * Works with both the official `dsh` and the DSH Desktop client, which use the
 * same ~/.dsh/profiles layout.
 */
'use strict'

const { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } = require('node:fs')
const { homedir } = require('node:os')
const { join } = require('node:path')

const here = __dirname
const BUNDLED = join(here, 'packages')

/** Harness home; default ~/.dsh, overridable via DSH_HOME. */
const dshHome = process.env.DSH_HOME ?? join(homedir(), '.dsh')
const profilesDir = join(dshHome, 'profiles')
const settingsPath = join(dshHome, 'settings.yaml')

/** Desktop client's settings limit (from its diagnostics). */
const SETTINGS_LIMIT = 4 * 1024 * 1024

/** Warn if the harness settings document is oversized or has stale blobs. */
function healthCheck() {
  if (!existsSync(settingsPath)) return
  const size = readFileSync(settingsPath, 'utf8').length
  if (size > SETTINGS_LIMIT) {
    console.error(`  ⚠ settings.yaml is ${(size / 1024 / 1024).toFixed(1)}MB — over the ${4}MB client limit.`)
    console.error('    Remove large blobs (e.g. a stale pendingZip) or the client may enter recovery mode.')
  }
}

const HOST_BUNDLE = '@deepseek-ai/dsh-switchblade'

/** The two plugin packages this installer ships. */
function bundledPackages() {
  const out = []
  if (existsSync(join(BUNDLED, 'switchblade', 'package.json'))) {
    out.push({ from: join(BUNDLED, 'switchblade'), name: '@deepseek-ai/dsh-switchblade' })
  }
  if (existsSync(join(BUNDLED, 'client-ui-switchblade', 'package.json'))) {
    out.push({ from: join(BUNDLED, 'client-ui-switchblade'), name: '@deepseek-ai/dsh-client-ui-switchblade' })
  }
  return out
}

/** Profiles that exist and look like dsh profiles (have node_modules + package.json). */
function findProfiles() {
  if (!existsSync(profilesDir)) return []
  const out = []
  for (const name of readdirSync(profilesDir)) {
    const dir = join(profilesDir, name)
    if (!existsSync(join(dir, 'package.json'))) continue
    if (!existsSync(join(dir, 'node_modules'))) continue
    out.push(dir)
  }
  return out
}

/** Create standard web + desktop profiles so the installer works on a fresh
 *  machine. The desktop client uses the "desktop" profile by default
 *  (DEFAULT_PROFILE_NAME), so both must exist for both modes to show the panel. */
function ensureProfile() {
  if (!existsSync(profilesDir)) mkdirSync(profilesDir, { recursive: true })
  const specs = [
    { name: 'web', bundles: ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app'] },
    { name: 'desktop', bundles: ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app', 'dshmarket'] },
  ]
  const created = []
  for (const spec of specs) {
    const dir = join(profilesDir, spec.name)
    mkdirSync(join(dir, 'node_modules'), { recursive: true })
    const manifestPath = join(dir, 'package.json')
    if (!existsSync(manifestPath)) {
      writeFileSync(manifestPath, JSON.stringify({
        name: `dsh-profile-${spec.name}`,
        private: true,
        dependencies: {},
        dsh: { profile: { bundles: spec.bundles } },
      }, null, 2))
      console.log(`  ✓ created profile ${dir}`)
    }
    created.push(dir)
  }
  return created
}

/** Copy one bundled package into a profile's @deepseek-ai scope. */
function installPackage(pkg, profileDir) {
  const scopedDir = join(profileDir, 'node_modules', '@deepseek-ai')
  const short = pkg.name.slice('@deepseek-ai/'.length)
  const dest = join(scopedDir, short)
  mkdirSync(scopedDir, { recursive: true })
  rmSync(dest, { recursive: true, force: true })
  cpSync(pkg.from, dest, { recursive: true, force: true })
  console.log(`  ✓ ${pkg.name} → ${dest}`)
}

/** Add the Host bundle to a profile's dsh.profile.bundles. */
function addBundle(profileDir) {
  const manifestPath = join(profileDir, 'package.json')
  if (!existsSync(manifestPath)) return
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const bundles = manifest.dsh?.profile?.bundles ?? []
  if (!bundles.includes(HOST_BUNDLE)) {
    bundles.push(HOST_BUNDLE)
    manifest.dsh = { ...(manifest.dsh ?? {}), profile: { ...(manifest.dsh?.profile ?? {}), bundles } }
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
    console.log(`  ✓ added ${HOST_BUNDLE} to ${manifestPath}`)
  } else {
    console.log(`  · ${HOST_BUNDLE} already in ${manifestPath}`)
  }
}

/** Mount the client panel via the profile's cordis.patch.yml.
 *  No longer automatic: the web-app bundle (shipped with the client / harness)
 *  already composes ui-switchblade; adding it again to a profile patch causes
 *  a duplicate loader entry. Mounts into the PROFILE patch (cordis.patch.yml)
 *  — the verified-correct location that works for both web and desktop modes.
 */
function mountClientPanel(profileDir) {
  const patchPath = join(profileDir, 'cordis.patch.yml')
  const existing = existsSync(patchPath) ? readFileSync(patchPath, 'utf8') : ''
  // Correct patch format: a TOP-LEVEL YAML array of patch entries. `[]` and
  // `- insert:` cannot coexist in one document (YAML separator error), so we
  // write a pure insert list.
  const canonical = `# Prompt-SkillArmory client panel.\n- insert:\n    - id: ui-switchblade\n      name: '@deepseek-ai/dsh-client-ui-switchblade'\n`
  if (existing.replace(/\r/g, '') === canonical) {
    console.log(`  · ui-switchblade already mounted in ${patchPath}`)
    return
  }
  // Preserve any real user entries, dropping an old bare `[]` line.
  const meaningful = existing
    .split('\n')
    .map((l) => l.replace(/\r$/, ''))
    .filter((l) => {
      const t = l.trim()
      return t !== '' && t !== '[]' && !(l.includes('ui-switchblade') && (l.includes('id:') || l.includes('name:') || l.includes('# Prompt-SkillArmory')))
    })
  const base = meaningful.length > 0 ? meaningful.join('\n') + '\n' : ''
  writeFileSync(patchPath, `${base}${canonical}`)
  console.log(`  ✓ mounted ui-switchblade in ${patchPath}`)
}

/** Remove one bundled package from a profile's @deepseek-ai scope. */
function uninstallPackage(pkg, profileDir) {
  const scopedDir = join(profileDir, 'node_modules', '@deepseek-ai')
  const short = pkg.name.slice('@deepseek-ai/'.length)
  const dest = join(scopedDir, short)
  if (existsSync(dest)) {
    rmSync(dest, { recursive: true, force: true })
    console.log(`  ✓ removed ${pkg.name}`)
  } else {
    console.log(`  · ${pkg.name} not installed`)
  }
}

/** Remove the Host bundle from a profile's dsh.profile.bundles. */
function removeBundle(profileDir) {
  const manifestPath = join(profileDir, 'package.json')
  if (!existsSync(manifestPath)) return
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const bundles = (manifest.dsh?.profile?.bundles ?? []).filter((b) => b !== HOST_BUNDLE)
  if (bundles.length !== (manifest.dsh?.profile?.bundles ?? []).length) {
    manifest.dsh = { ...(manifest.dsh ?? {}), profile: { ...(manifest.dsh?.profile ?? {}), bundles } }
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
    console.log(`  ✓ removed ${HOST_BUNDLE} from ${manifestPath}`)
  } else {
    console.log(`  · ${HOST_BUNDLE} not in ${manifestPath}`)
  }
}

/** Unmount the client panel from a profile's cordis.patch.yml. */
function unmountClientPanel(profileDir) {
  const patchPath = join(profileDir, 'cordis.patch.yml')
  if (!existsSync(patchPath)) { console.log('  · no cordis.patch.yml'); return }
  const meaningful = readFileSync(patchPath, 'utf8')
    .split('\n').map((l) => l.replace(/\r$/, ''))
    .filter((l) => {
      const t = l.trim()
      return t !== '' && t !== '[]' && !(l.includes('ui-switchblade') && (l.includes('id:') || l.includes('name:') || l.includes('# Prompt-SkillArmory')))
    })
  if (meaningful.length === 0) {
    rmSync(patchPath, { force: true })
    console.log(`  ✓ removed ${patchPath}`)
  } else {
    writeFileSync(patchPath, meaningful.join('\n') + '\n')
    console.log(`  ✓ removed ui-switchblade from ${patchPath}`)
  }
}

function uninstall() {
  console.log('Prompt-SkillArmory uninstaller')
  console.log(`  harness home: ${dshHome}`)
  const pkgs = bundledPackages()
  const profiles = findProfiles()
  if (profiles.length === 0) {
    console.log('  · no profiles found — nothing to uninstall')
  } else {
    for (const profileDir of profiles) {
      console.log(`  profile: ${profileDir}`)
      for (const pkg of pkgs) uninstallPackage(pkg, profileDir)
      removeBundle(profileDir)
      unmountClientPanel(profileDir)
    }
  }
  // Remove plugin-owned media / export dirs.
  for (const dir of ['wallpapers', 'armory-exports']) {
    const p = join(dshHome, dir)
    if (existsSync(p)) { rmSync(p, { recursive: true, force: true }); console.log(`  ✓ removed ${p}`) }
  }
  console.log('')
  console.log('  Done. The plugin is uninstalled; relaunch DSH Desktop to refresh.')
  console.log('  (Your prompts/skills settings remain in settings.yaml — remove the')
  console.log('   "switchblade" namespace manually if you want a full wipe.)')
}

function main() {
  console.log('Prompt-SkillArmory installer')
  console.log(`  harness home: ${dshHome}`)
  if (process.argv.includes('--postinstall')) {
    console.log('  (postinstall hook — no profile install here)')
    return
  }
  if (process.argv.includes('uninstall') || process.argv.includes('--uninstall')) {
    uninstall()
    return
  }
  healthCheck()

  const pkgs = bundledPackages()
  if (pkgs.length === 0) {
    console.error('  ✖ no bundled plugin packages found (installer built incorrectly)')
    process.exit(1)
  }

  let profiles = findProfiles()
  const ensured = ensureProfile() // always ensure web + desktop exist
  // merge: prefer existing, add any newly ensured
  for (const dir of ensured) {
    if (!profiles.includes(dir)) profiles.push(dir)
  }
  if (profiles.length === 0) {
    console.error('  ✖ no profiles available')
    process.exit(1)
  }

  for (const profileDir of profiles) {
    console.log(`  profile: ${profileDir}`)
    for (const pkg of pkgs) installPackage(pkg, profileDir)
    addBundle(profileDir)
    mountClientPanel(profileDir)
  }

  console.log('')
  console.log('  Next steps:')
  console.log('    dsh web            (or relaunch the DSH Desktop client)')
  console.log('')
  console.log('  Open Settings → Prompt-SkillArmory (book icon).')
}

main()
