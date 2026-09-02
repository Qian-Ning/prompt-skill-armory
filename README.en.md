# Armory

> **A community plugin / control center for DeepSeek Harness** — prompts, skills, MCP tool servers, agent presets, and a global wallpaper with effects, all in one management panel.

**Package / repo**: `prompt-skill-armory` · [GitHub](https://github.com/Qian-Ning/prompt-skill-armory)

[**中文**](./README.md) · **English**

![Prompt•Skill-Armory management panel](docs/preview/preview-1.png)

| <img src="docs/preview/preview-2.png" width="220"/> | <img src="docs/preview/preview-3.png" width="220"/> | <img src="docs/preview/preview-4.png" width="220"/> | <img src="docs/preview/preview-5.png" width="220"/> |
|--|--|--|--|

![version](https://img.shields.io/badge/version-0.8.0-00ff9c)
![license](https://img.shields.io/badge/license-MIT-blue)
![platform](https://img.shields.io/badge/platform-web%20%2B%20desktop-00ff9c)
![CI](https://github.com/Qian-Ning/prompt-skill-armory/actions/workflows/ci.yml/badge.svg)

```
✦ Armory  v0.8.0
┌─────────┬─────────┬─────┬────────────┬─────────┐
│ Prompts │ Skills  │ MCP │  Wallpaper │ Presets │
│ global  │ merged  │ hub │ wallpaper  │ roster  │
└─────────┴─────────┴─────┴────────────┴─────────┘
```

---

## 📑 Table of contents

- [🚀 Quick start](#-quick-start)
- [✨ Features](#-features)
- [🖥️ Platform support](#️-platform-support)
- [🧰 Using a skill in chat](#-using-a-skill-in-chat)
- [🏗️ Architecture](#️-architecture)
- [📦 Packages](#-packages)
- [🗂️ Repository layout](#️-repository-layout)
- [🛠️ Development](#️-development)
- [❓ FAQ](#-faq)
- [📚 Docs](#-docs)
- [🤝 Contributing / Upstream](#-contributing--upstream)
- [📄 License](#-license)

---

## 🚀 Quick start

### Install

```bash
npx prompt-skill-armory
```

The installer automatically:

1. Locates DSH home
2. Ensures `web` + `desktop` profiles exist
3. Installs both plugin packages (Host + Web panel (five tabs: prompts/skills/MCP/wallpaper/presets)
4. Configures the Host bundle
5. Mounts the panel (profile `cordis.patch.yml`)
6. Health-checks settings (prevents 4MB bloat)

### Launch

```bash
cd deepseek-harness
pnpm run build
pnpm dsh web
```

(Or simply relaunch the DSH Desktop client.)

Open **Settings → Prompt•Skill-Armory** (book icon).

> **Requirement**: DeepSeek Harness runtime already installed (`dsh web` or the Desktop client). This is a plugin for DSH — it does not bundle the runtime itself.

---

## ✨ Features

- **Prompts (global)** — CRUD, enable/disable, set default. Enabled prompts are injected into **every agent's system prompt** via `ctx.systemPrompt.section`.
- **Skills (merged)** — one list: panel-installed (edit/toggle/uninstall) + locally scanned (managed), with invoke hint `/name`.
- **Skill install paths**
  - Manual entry
  - `.md` file picker
  - CLI in a session: `/armory-skill-dir <dir>`, `/armory-install-zip <zip>`
- **Agent presets** — browse the roster, set default.
- **MCP tool servers** — add/edit/remove stdio or HTTP MCP servers; enabling connects them automatically, with per-server status, tool list, and a connect test.
- **Wallpaper (global background & effects)** — upload a local image/video (bytes on disk, id-only in settings) or paste an image URL; live-tune opacity / scrim / glass / blur / fit; **set separately on web vs desktop**.
- **Composer hint-line style** — enable / color / size / gradient presets for the below-input hint and stats line.
- **Bilingual UI** (Simplified Chinese / English).
- **Book icon** in the settings sidebar.

## 🖥️ Platform support

| Environment | Panel | `/armory` commands |
|---|---|---|
| `dsh web` (official) | ✅ | ✅ |
| DSH Desktop client | ✅ | ✅ |

Works via profile composition (the installer mounts the panel into each profile's `cordis.patch.yml`) — no fork of the client needed.

## 🧰 Using a skill in chat

Type `/` then the skill name:

```
/code-review
/mission-keeper
```

The skill body is injected; the agent follows it. Model-invocable skills are also visible to the model.

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────┐
│                    DSH runtime                       │
│                                                      │
│  ┌─────────────┐   RPC/connection   ┌─────────────┐  │
│  │  Web panel   │◄──────────────────►│  Host service│  │
│  │ ui-switchblade│   api.skills.*    │ switchblade │  │
│  │  (settings)  │   api.settings.*  │  (bundle)   │  │
│  └─────────────┘                    └──────┬──────┘  │
│                                            │         │
│                              ctx.systemPrompt.section│
│                              ctx.skills.register     │
│                                            │         │
│                              ┌─────────────┴──────┐  │
│                              │ each agent's system │  │
│                              │ prompt / skill      │  │
│                              │ registry / presets  │  │
│                              └────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

- **Host service** (`switchblade` bundle) owns prompt/skill/preset CRUD + persistence, injecting globally via `ctx.systemPrompt.section` and registering skills via `ctx.skills.register`.
- **Web panel** (`ui-switchblade`) talks to the Host over connection RPC (`api.skills.list`, `api.agentPresets.list`, `api.settings.mutate/describe`) — never touches DSH internals directly.
- **Installer** wires both into DSH via profile composition — web and desktop share the same mechanism.

## 📦 Packages

| Package | Role |
|---|---|
| `prompt-skill-armory` | npm installer (CLI) |
| `@deepseek-ai/dsh-switchblade` | Host service (prompts/skills/commands/MCP/wallpaper persistence + upload routes) |
| `@deepseek-ai/dsh-client-ui-switchblade` | Web panel |

## 🗂️ Repository layout

```
prompt-skill-armory/
├── cli.cjs                  # one-command install CLI
├── package.json             # npm installer package
├── packages/                # shipped plugin builds (lib+src+manifest)
│   ├── switchblade/         # @deepseek-ai/dsh-switchblade (Host)
│   └── client-ui-switchblade/ # @deepseek-ai/dsh-client-ui-switchblade (Web)
├── plugin-src/              # plugin source mirrors
├── scripts/build-shipped.mjs # sync builds from a DSH checkout
├── demo/demo.html           # UI preview (mock data)
├── README.md                # this file (中文) · README.en.md (English)
├── UPSTREAM.md              # upstream integration guide
├── CHANGELOG.md             # version history
├── PUBLISHING.md            # publishing guide
├── TESTING.md               # testing guide
├── LICENSE                  # MIT
└── .github/workflows/ci.yml # CI quality gate
```

## 🛠️ Development

After editing source, rebuild shipped packages:

```bash
node scripts/build-shipped.mjs <path-to-deepseek-harness>
```

Version bumps touch three places:

1. `packages/*/package.json` `version`
2. `ARMORY_VERSION` (panel constant)
3. `CHANGELOG.md`

Then rebuild the client bundle so the badge updates.

## ❓ FAQ

**Q: Why is my client sidebar icon a gear instead of a book?**
A: The desktop client's packaged `SettingsRoot` hardcodes the icon mapping. Via the npm installer's profile composition the panel works fine, but the book icon requires upstream integration (see [`UPSTREAM.md`](./UPSTREAM.md)).

**Q: Will this affect my existing config / sessions?**
A: No. The plugin only adds a `switchblade` settings namespace and leaves everything else untouched. The installer also health-checks settings to prevent bloat.

**Q: Does it work offline?**
A: Yes. Copy the npm tarball to the target machine and `npm install <tarball>`; or `file:`-install a local build (see [`TESTING.md`](./TESTING.md)).

**Q: Where do skills come from?**
A: Three ways: manual entry, `.md` file picker, or in-session `/armory-skill-dir` (directory) / `/armory-install-zip` (zip). All land in the merged Skills tab for management.

## 📚 Docs

| Doc | Description |
|---|---|
| [`README.md`](./README.md) | Chinese readme |
| [`TESTING.md`](./TESTING.md) | Local functional testing (no publish needed) |
| [`PUBLISHING.md`](./PUBLISHING.md) | Publishing a new version |
| [`UPSTREAM.md`](./UPSTREAM.md) | Upstream integration (book-icon PR) |
| [`CHANGELOG.md`](./CHANGELOG.md) | Full version history |

## 🤝 Contributing / Upstream

See [`UPSTREAM.md`](./UPSTREAM.md) — how to upstream the panel natively into `deepseek-ai/deepseek-harness` and `anywhere-labs/dsh-desktop` (book icon in the desktop sidebar).

## 📄 License

MIT
