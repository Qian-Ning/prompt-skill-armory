# Prompt•Skill-Armory

> **DeepSeek Harness 的提示词与技能管理器（CCswitch 风格）**
> 管理全局生效的提示词、从 `.md`/目录/zip 安装技能、浏览 Agent 预设——一个面板，带启用/停用开关。

**中文** · [**English**](./README.en.md)

![version](https://img.shields.io/badge/version-0.7.0-00ff9c)
![license](https://img.shields.io/badge/license-MIT-blue)
![platform](https://img.shields.io/badge/platform-web%20%2B%20desktop-00ff9c)
![CI](https://github.com/Qian-Ning/prompt-skill-armory/actions/workflows/ci.yml/badge.svg)

```
✦ Prompt•Skill-Armory [v0.7.0]
┌────────────┬──────────────────┬──────────────┐
│ 提示词      │ 技能              │ Agent预设     │
│ (全局生效)  │ (合并管理)        │ (roster)     │
└────────────┴──────────────────┴──────────────┘
```

---

## 📑 目录

- [🚀 快速开始](#-快速开始)
- [✨ 功能](#-功能)
- [🖥️ 平台支持](#️-平台支持)
- [🧰 在聊天中使用技能](#-在聊天中使用技能)
- [🏗️ 架构](#️-架构)
- [📦 包含的包](#-包含的包)
- [🗂️ 仓库结构](#️-仓库结构)
- [🛠️ 开发](#️-开发)
- [❓ FAQ](#-faq)
- [📚 文档](#-文档)
- [🤝 贡献 / 官方合入](#-贡献--官方合入)
- [📄 许可](#-许可)

---

## 🚀 快速开始

### 安装

```bash
npx prompt-skill-armory
```

安装器自动完成：

1. 定位 DSH home
2. 确保 `web` + `desktop` profile 存在
3. 安装两个插件包（Host + Web 面板）
4. 配置 Host bundle
5. 挂载面板（profile `cordis.patch.yml`）
6. 体检 settings（防 4MB 膨胀）

### 启动

```bash
cd deepseek-harness
pnpm run build
pnpm dsh web
```

（或直接重启 DSH Desktop 客户端。）

打开 **设置 → Prompt•Skill-Armory**（书图标）。

> **要求**：已安装 DeepSeek Harness 运行时（`dsh web` 或桌面客户端）。插件是 DSH 的插件，不打包运行时本身。

---

## ✨ 功能

- **提示词（全局生效）** — 增删改查、启用/停用、设默认。启用后经 `ctx.systemPrompt.section` 注入**每个 agent** 的系统提示词。
- **技能（合并管理）** — 一个列表：面板安装的（编辑/开关/卸载）+ 本地扫描的（托管），带调用提示 `/name`。
- **技能安装方式**
  - 手动填写
  - `.md` 文件选择
  - 会话内命令：`/armory-skill-dir <dir>`、`/armory-install-zip <zip>`
- **Agent 预设** — 浏览名册、设默认。
- **中英双语 UI**（简体中文 / English）。
- **设置侧边栏书图标**。

## 🖥️ 平台支持

| 环境 | 面板 | `/armory` 命令 |
|---|---|---|
| `dsh web`（官方） | ✅ | ✅ |
| DSH Desktop 客户端 | ✅ | ✅ |

通过 profile 组合实现（安装器把面板挂进每个 profile 的 `cordis.patch.yml`）——无需 fork 客户端。

## 🧰 在聊天中使用技能

在输入框打 `/` + 技能名：

```
/code-review
/mission-keeper
```

技能体被注入，agent 按它执行。`modelInvocable` 的技能模型也可自主调用。

## 🏗️ 架构

```
┌──────────────────────────────────────────────────────┐
│                    DSH 运行时                         │
│                                                      │
│  ┌─────────────┐   RPC/connection   ┌─────────────┐  │
│  │  Web 面板    │◄──────────────────►│  Host 服务    │  │
│  │ ui-switchblade│   api.skills.*    │ switchblade │  │
│  │  (settings)  │   api.settings.*  │  (bundle)   │  │
│  └─────────────┘                    └──────┬──────┘  │
│                                            │         │
│                              ctx.systemPrompt.section│
│                              ctx.skills.register     │
│                                            │         │
│                              ┌─────────────┴──────┐  │
│                              │ 每个 agent 系统提示词 │  │
│                              │ 技能注册表 / 预设     │  │
│                              └────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

- **Host 服务**（`switchblade` bundle）持有提示词/技能/预设的 CRUD 与持久化，通过 `ctx.systemPrompt.section` 全局注入、`ctx.skills.register` 注册技能。
- **Web 面板**（`ui-switchblade`）通过 connection RPC 调用 Host（`api.skills.list`、`api.agentPresets.list`、`api.settings.mutate/describe`），不直接碰 DSH 内部。
- **安装器**把两者通过 profile 组合装进 DSH——web 和 desktop 共用同一套机制。

## 📦 包含的包

| 包 | 作用 |
|---|---|
| `prompt-skill-armory` | npm 安装器（CLI） |
| `@deepseek-ai/dsh-switchblade` | Host 服务（提示词/技能/命令） |
| `@deepseek-ai/dsh-client-ui-switchblade` | Web 面板 |

## 🗂️ 仓库结构

```
prompt-skill-armory/
├── cli.cjs                  # 一键安装 CLI
├── package.json             # npm 安装器包
├── packages/                # 构建好的插件（lib+src+manifest）
│   ├── switchblade/         # @deepseek-ai/dsh-switchblade (Host)
│   └── client-ui-switchblade/ # @deepseek-ai/dsh-client-ui-switchblade (Web)
├── plugin-src/              # 插件源码镜像
├── scripts/build-shipped.mjs # 从 DSH checkout 同步构建产物
├── demo/demo.html           # UI 预览（mock 数据）
├── README.md                # 本文（中文）· README.en.md 英文版
├── UPSTREAM.md              # 官方合入指南
├── CHANGELOG.md             # 版本历史
├── PUBLISHING.md            # 发布指南
├── TESTING.md               # 测试指南
├── LICENSE                  # MIT
└── .github/workflows/ci.yml # CI 质量门禁
```

## 🛠️ 开发

改源码后重建发布包：

```bash
node scripts/build-shipped.mjs <path-to-deepseek-harness>
```

版本更新三处同步：

1. `packages/*/package.json` `version`
2. `ARMORY_VERSION`（面板常量）
3. `CHANGELOG.md`

然后重建 client bundle 让版本徽章更新。

## ❓ FAQ

**Q: 为什么我的客户端侧边栏图标是齿轮而不是书？**
A: 桌面客户端打包版的 `SettingsRoot` 硬编码了图标映射。通过 npm 安装器的 profile 组合，面板能正常工作，但书图标需要官方合入（见 [`UPSTREAM.md`](./UPSTREAM.md)）。

**Q: 会不会影响我已有的配置/会话？**
A: 不会。插件只新增 `switchblade` settings 命名空间，不动其他配置。安装器还会体检 settings，防止膨胀。

**Q: 支持离线安装吗？**
A: 可以。把 npm 包拷到目标机器，`npm install <tarball>` 即可；或用 `file:` 安装本地构建产物（见 [`TESTING.md`](./TESTING.md)）。

**Q: 技能从哪里来？**
A: 三种：手动填写、`.md` 文件选择、会话内 `/armory-skill-dir`（目录）或 `/armory-install-zip`（zip）。安装后统一进"技能"tab 管理。

## 📚 文档

| 文档 | 说明 |
|---|---|
| [`README.en.md`](./README.en.md) | 英文版自述 |
| [`TESTING.md`](./TESTING.md) | 本地功能测试（无需发布） |
| [`PUBLISHING.md`](./PUBLISHING.md) | 发布新版本指南 |
| [`UPSTREAM.md`](./UPSTREAM.md) | 官方合入指南（书图标 PR） |
| [`CHANGELOG.md`](./CHANGELOG.md) | 完整版本历史 |

## 🤝 贡献 / 官方合入

见 [`UPSTREAM.md`](./UPSTREAM.md) —— 如何让面板原生内置进 `deepseek-ai/deepseek-harness` 与 `anywhere-labs/dsh-desktop`（客户端侧边栏书图标）。

## 📄 许可

MIT
