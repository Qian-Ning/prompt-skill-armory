# Changelog

> All notable changes to **Prompt•Skill-Armory** (`@deepseek-ai/dsh-switchblade` + `@deepseek-ai/dsh-client-ui-switchblade`).

[**中文**](./CHANGELOG.md) · **English**

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.5.5] - 2026-08

### Fixed
- Rebuilt the client bundle so the shipped `lib/client.js` carries the current version badge (`v0.5.5`) — src-only version bumps had left the published bundle stale.

## [0.5.4] - 2026-08

### Fixed
- Profile `cordis.patch.yml` is now a pure top-level `- insert:` list (the previous `[]` + insert form is invalid YAML — "document separator expected" — and crashed the desktop client into recovery mode).

## [0.5.3] - 2026-08

### Fixed
- Installer idempotently rewrites malformed `cordis.patch.yml` (older installer output) to a clean, valid format.

## [0.5.2] - 2026-08

### Fixed
- Installer now **always ensures the desktop profile exists** (the client uses the `desktop` profile by default) and installs the plugins into it — fresh machines previously only got the `web` profile, so the client had no panel.

## [0.5.1] - 2026-08

### Fixed
- Installer creates both `web` and `desktop` profiles on a fresh machine.

## [0.5.0] - 2026-08

### Added
- **DSH Desktop client support**: the panel appears in BOTH the official `dsh web` and the DSH Desktop client. The installer mounts `ui-switchblade` in each profile's `cordis.patch.yml` (the verified-correct location — NOT the web-app patch, which caused duplicate-entry crashes) and installs both plugin packages into every profile.

### Fixed
- Profile `cordis.patch.yml` files are written in valid YAML (`[]`, never the quoted `"[]"` that broke the desktop client's recovery mode).
- Installer only mounts the client panel once per profile (dedupes).

## [0.4.7] - 2026-08

### Fixed
- Rebuilt the client bundle so the shipped `lib/client.js` carries the Prompt•Skill-Armory name and the current version badge (src-only changes had left the published bundle stale).

## [0.4.6] - 2026-08

### Changed
- Panel + sidebar name **Prompt•Skill-Armory** (bullet separator), Prompt and Skill share one accent color. Version badge follows the published version.

## [0.4.5] - 2026-08

### Changed
- Panel and sidebar name now **Prompt•Skill-Armory** (bullet separator); Prompt and Skill share the same accent color.
- Installer mounts the client panel automatically (cordis.patch.yml ui-switchblade row) for desktop / web profiles.
- Installer health-check warns when settings.yaml is over the 4MB client limit (stale pendingZip blobs).

## [0.4.4] - 2026-08

### Fixed
- Installer overwrites stale symlinks/junctions (rmSync before copy) and installs into every profile (web + desktop).
- Settings bloat (5MB stale zip base64) no longer wedges the desktop client.

## [0.4.1] - 2026-08

### Changed
- Unified naming to **Prompt-SkillArmory** everywhere: CLI commands are now `/armory-*` (`/armory`, `/armory-enable`, `/armory-skill-dir`, `/armory-install-zip`, …) with legacy `/sw-*` aliases kept for compatibility.

## [0.4.0] - 2026-08

### Changed
- Skills tab is now the single home for all skills: panel-installed (managed) and locally scanned are merged into one list, with per-card invoke hint (`/name`) and full management (add / edit / toggle / uninstall / adopt).
- Removed the separate "Local skills" tab and the web zip-upload button (the CLI `/sw-install-zip` / `/sw-skill-dir` commands remain the zip/dir install path).
- Added a CLI command reference box in the Skills tab.
- Clearer version badge in the panel header.

## [0.3.1] - 2026-08

### Fixed
- Removed the web-panel zip-queue path (`pendingZip` settings field + `handlePendingZip`) which deadlocked the settings/api channel and made the whole UI appear empty. The stable prompt + skill flow is restored; zip skills install via the `/sw-install-zip` CLI command (direct Host call, no settings round-trip).

## [0.3.0] - 2026-08

### Fixed
- **Prompts now actually take effect.** Root cause chain: the package `main` pointed at `lib/types/index.js` (tsc raw output) which the loader could not recognize as a plugin — the plugin was never mounted. Restored `main` to `lib/index.js` (tsdown bundle) and declared `skills` / `systemPrompt` in `static inject` so the service can resolve them (`/sw` had failed with "cannot get property skills without inject"). Prompts inject globally via `ctx.systemPrompt.section`; skills register via `ctx.skills.register`.

## [0.2.0] - 2026-08

### Added
- Prompt editing: edit name / description / content of saved prompts.
- Skill editing: edit installed skill name / description / content.
- Local skill scanning: 4th tab lists locally scanned skills with an "manage" (adopt) action.
- Settings-sidebar book icon for the Prompt-SkillArmory nav entry.
- Tab counts show `…` while loading (no misleading `0`).

### Changed
- Panel renamed to **Prompt-SkillArmory** with an open-book glyph.
- Layout reworked into 4 tabs within the settings dialog's fixed width: Prompts / Skills / Agent Presets / Local skills.
- Skills tab now manages only panel-installed skills; Local skills tab only locally scanned ones.
- Tab and header labels no longer force uppercase.
- Host prompt/skill reconciliation is fully guarded (no deadlock in the settings commit path; `signal timed out` fixed).

## [0.1.0] - 2026-08

### Added
- Initial release: CCswitch-style manager for prompts, skills, and presets.
- Prompts: add / enable / disable / set default / delete; globally injected into the system prompt.
- Skills: install from local `.md` file or manual entry; enable / disable / uninstall.
- Presets: browse agent-preset roster, set default.
- Bilingual UI (zh / en).
- Search + scroll within each tab.
