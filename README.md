# Prompt•Skill-Armory

> **DeepSeek Harness 的提示词与技能管理器（CCswitch 风格）**
> **CCswitch-style prompt + skill manager for the DeepSeek Harness**

简体中文 · English

管理全局生效的提示词、从 `.md`/目录/zip 安装技能、浏览 Agent 预设——一个面板，带启用/停用开关。
Manage globally injected prompts, install skills from `.md`/directory/zip, browse agent presets — one panel with enable/disable switches.

![version](https://img.shields.io/badge/version-0.5.5-00ff9c)
![license](https://img.shields.io/badge/license-MIT-blue)
![platform](https://img.shields.io/badge/platform-web%20%2B%20desktop-00ff9c)

```
✦ Prompt•Skill-Armory [v0.5.5]
┌────────────┬──────────────────┬──────────────┐
│ 提示词      │ 技能              │ Agent预设     │
│ (全局生效)  │ (合并管理)        │ (roster)     │
└────────────┴──────────────────┴──────────────┘
```

---

## ✨ 功能 · Features

- **提示词（全局）· Prompts (global)** — 增删改查、启用/停用、设默认。
  Enabled prompts are injected into **every agent's system prompt** via
  `ctx.systemPrompt.section`.
- **技能 · Skills** — 一个合并列表：面板安装的（编辑/开关/卸载）+ 本地扫描的（托管）。
  One merged list: panel-installed + locally scanned, with invoke hint `/name`.
- **技能安装方式 · Skill install paths**
  - 手动填写 · Manual entry
  - `.md` 文件选择 · `.md` file picker
  - 会话内命令 · CLI in a session: `/armory-skill-dir <dir>`、`/armory-install-zip <zip>`
- **Agent 预设 · Agent presets** — 浏览列表、设默认。
- **中英双语 · Bilingual** (简体中文 / English)
- **书图标 · Book icon** in the settings sidebar.

## 🖥️ 平台支持 · Platform support

| 环境 Environment | 面板 Panel | `/armory` 命令 |
|---|---|---|
| `dsh web`（官方） | ✅ | ✅ |
| DSH Desktop 客户端 · client | ✅ | ✅ |

通过 profile 组合实现（安装器把面板挂进每个 profile 的 `cordis.patch.yml`）——无需 fork 客户端。
Works via profile composition — no fork of the client needed.

## 🚀 一键安装 · One-command install

```bash
npx prompt-skill-armory
```

安装器自动：定位 DSH home → 确保 web+desktop profile → 装两个插件包 →
配 Host bundle → 挂载面板 → 体检 settings。
The installer: locates DSH home → ensures web+desktop profiles → installs both
plugins → adds the Host bundle → mounts the panel → health-checks settings.

然后（或重启桌面客户端）· Then (or relaunch the Desktop client):

```bash
cd deepseek-harness
pnpm run build
pnpm dsh web
```

打开 **设置 → Prompt•Skill-Armory**（书图标）。
Open **Settings** → **Prompt•Skill-Armory** (book icon).

> **要求 · Requirement**: 已安装 DeepSeek Harness 运行时（`dsh web` 或桌面客户端）。
> 插件是 DSH 的插件，不打包运行时本身。

## 🧰 在聊天中使用技能 · Using a skill in chat

在输入框打 `/` + 技能名 · Type `/` then the skill name:

```
/code-review
/mission-keeper
```

技能体被注入，agent 按它执行。`modelInvocable` 的技能模型也可自主调用。
The skill body is injected; the agent follows it. Model-invocable skills are also visible to the model.

## 📦 包 · Packages

| 包 Package | 作用 Role |
|---|---|
| `prompt-skill-armory` | npm 安装器（CLI）· installer |
| `@deepseek-ai/dsh-switchblade` | Host 服务 · Host service |
| `@deepseek-ai/dsh-client-ui-switchblade` | Web 面板 · Web panel |

## 🗂️ 仓库结构 · Repository layout

```
prompt-skill-armory/
├── cli.cjs                  # 一键安装 CLI · one-command install
├── package.json             # npm 安装器包 · installer package
├── packages/                # 构建好的插件（lib+src+manifest）· shipped builds
│   ├── switchblade/         # @deepseek-ai/dsh-switchblade (Host)
│   └── client-ui-switchblade/ # @deepseek-ai/dsh-client-ui-switchblade (Web)
├── plugin-src/              # 插件源码镜像 · source mirrors
├── scripts/build-shipped.mjs # 从 DSH checkout 同步构建产物
├── demo/demo.html           # UI 预览（mock 数据）· standalone preview
├── README.md                # 本文 · this file
├── UPSTREAM.md              # 官方合入指南 · upstream guide
├── CHANGELOG.md             # 版本历史 · version history
├── PUBLISHING.md            # 发布指南 · publishing guide
├── TESTING.md               # 测试指南 · testing guide
├── LICENSE                  # MIT
└── .gitignore
```

## 🛠️ 开发 · Development

改源码后重建发布包 · After editing source, rebuild shipped packages:

```bash
node scripts/build-shipped.mjs <path-to-deepseek-harness>
```

版本更新三处同步 · Version bumps touch three places:
1. `packages/*/package.json` `version`
2. `ARMORY_VERSION`（面板）· panel constant
3. `CHANGELOG.md`

然后重建 client bundle 让版本徽章更新 · then rebuild the client bundle so the badge updates.

## 🤝 贡献 / 官方合入 · Contributing / Upstream

见 [`UPSTREAM.md`](./UPSTREAM.md) —— 如何让面板原生内置进
`deepseek-ai/deepseek-harness` 与 `anywhere-labs/dsh-desktop`（客户端侧边栏书图标）。
See `UPSTREAM.md` for upstreaming into the official repos (book icon in the desktop sidebar).

## 📄 许可 · License

MIT
