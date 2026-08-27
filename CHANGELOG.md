# 更新日志 · Changelog

> 简体中文 · English

**Prompt•Skill-Armory**（`@deepseek-ai/dsh-switchblade` +
`@deepseek-ai/dsh-client-ui-switchblade`）的所有重要变更。
All notable changes to **Prompt•Skill-Armory**.

格式基于 [Keep a Changelog](https://keepachangelog.com/)，版本遵循
[Semantic Versioning](https://semver.org/)。
The format is based on [Keep a Changelog](https://keepachangelog.com/), and this
project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased] · 未发布

## [0.5.5] - 2026-08

### 修复 · Fixed
- 重新构建了 client bundle，让发布的 `lib/client.js` 携带当前版本徽章
  （`v0.5.5`）——之前只改源码版本号导致已发布 bundle 过期。
  Rebuilt the client bundle so the shipped `lib/client.js` carries the current
  version badge (`v0.5.5`) — src-only version bumps had left the bundle stale.

## [0.5.4] - 2026-08

### 修复 · Fixed
- Profile 的 `cordis.patch.yml` 现在是纯顶层 `- insert:` 列表（之前的
  `[]` + insert 形式是非法 YAML——“document separator expected”，会让
  desktop 客户端进入恢复模式）。
  Profile `cordis.patch.yml` is now a pure top-level `- insert:` list (the
  previous `[]` + insert form is invalid YAML and crashed the desktop client
  into recovery mode).

## [0.5.3] - 2026-08

### 修复 · Fixed
- 安装器幂等地重写格式错误的 `cordis.patch.yml`（旧安装器产物）为干净格式。
  Installer idempotently rewrites malformed `cordis.patch.yml` (older installer
  output) to a clean, valid format.

## [0.5.2] - 2026-08

### 修复 · Fixed
- 安装器现在**始终确保 desktop profile 存在**（客户端默认用 `desktop`
  profile）并装好插件——新机器之前只有 `web` profile，客户端没有面板。
  Installer now **always ensures the desktop profile exists** (the client uses
  the `desktop` profile by default) and installs the plugins — fresh machines
  previously only got `web`, so the client had no panel.

## [0.5.1] - 2026-08

### 修复 · Fixed
- 安装器在新机器上同时创建 `web` 和 `desktop` 两个 profile。
  Installer creates both `web` and `desktop` profiles on a fresh machine.

## [0.5.0] - 2026-08

### 新增 · Added
- **DSH Desktop 客户端支持**：面板同时出现在官方 `dsh web` 和 DSH Desktop
  客户端。安装器把 `ui-switchblade` 挂进每个 profile 的 `cordis.patch.yml`
  （已验证的正确位置——不是 web-app patch，那会重复挂载崩溃），并把两个
  插件包装进所有 profile。
  **DSH Desktop client support**: the panel appears in BOTH the official
  `dsh web` and the DSH Desktop client. The installer mounts `ui-switchblade`
  in each profile's `cordis.patch.yml` (the verified-correct location — NOT
  the web-app patch, which caused duplicate-entry crashes) and installs both
  plugin packages into every profile.

### 修复 · Fixed
- Profile 的 `cordis.patch.yml` 以合法 YAML 写入（`[]`，绝不是带引号的
  `"[]"`——那会破坏 desktop 客户端的恢复模式）。
  Profile `cordis.patch.yml` files are written in valid YAML (`[]`, never the
  quoted `"[]"` that broke the desktop client's recovery mode).
- 安装器每个 profile 只挂一次客户端面板（去重）。
  Installer only mounts the client panel once per profile (dedupes).

## [0.4.7] - 2026-08

### 修复 · Fixed
- 重新构建 client bundle，让发布的 `lib/client.js` 携带
  Prompt•Skill-Armory 名称和当前版本徽章（只改源码导致已发布 bundle 过期）。
  Rebuilt the client bundle so the shipped `lib/client.js` carries the
  Prompt•Skill-Armory name and the current version badge.

## [0.4.6] - 2026-08

### 变更 · Changed
- 面板 + 侧边栏名称 **Prompt•Skill-Armory**（圆点分隔符），Prompt 与 Skill
  共享同一强调色。版本徽章跟随发布版本。
  Panel + sidebar name **Prompt•Skill-Armory** (bullet separator), Prompt and
  Skill share one accent color. Version badge follows the published version.

## [0.4.5] - 2026-08

### 变更 · Changed
- 面板和侧边栏名称现为 **Prompt•Skill-Armory**；Prompt 与 Skill 共享强调色。
- 安装器自动挂载客户端面板（cordis.patch.yml 的 ui-switchblade 行），面向
  desktop / web profile。
- 安装器体检：settings.yaml 超过客户端 4MB 上限时告警（陈旧的 pendingZip 残留）。
  Installer health-check warns when settings.yaml is over the 4MB client limit
  (stale pendingZip blobs).

## [0.4.4] - 2026-08

### 修复 · Fixed
- 安装器覆盖过期的符号链接/junction（先 rmSync 再复制），并安装进每个
  profile（web + desktop）。
  Installer overwrites stale symlinks/junctions (rmSync before copy) and
  installs into every profile (web + desktop).
- settings 膨胀（5MB 陈旧的 zip base64）不再卡死 desktop 客户端。
  Settings bloat (5MB stale zip base64) no longer wedges the desktop client.

## [0.4.1] - 2026-08

### 变更 · Changed
- 统一命名为 **Prompt-SkillArmory**：CLI 命令现在是 `/armory-*`
  （`/armory`、`/armory-enable`、`/armory-skill-dir`、`/armory-install-zip`…），
  保留旧 `/sw-*` 别名以兼容。
  Unified naming to **Prompt-SkillArmory** everywhere: CLI commands are now
  `/armory-*` with legacy `/sw-*` aliases kept for compatibility.

## [0.4.0] - 2026-08

### 变更 · Changed
- 技能 tab 现在是所有技能的唯一入口：面板安装的（managed）和本地扫描的
  合并进一个列表，每张卡片带调用提示（`/name`）和完整管理
  （增/改/开关/卸载/收养）。
  Skills tab is now the single home for all skills: panel-installed (managed)
  and locally scanned are merged into one list, with per-card invoke hint
  (`/name`) and full management (add / edit / toggle / uninstall / adopt).
- 移除单独的 "Local skills" tab 和 web zip 上传按钮（CLI 的
  `/sw-install-zip` / `/sw-skill-dir` 命令仍是 zip/dir 安装路径）。
  Removed the separate "Local skills" tab and the web zip-upload button.
- 技能 tab 增加了 CLI 命令参考框。Added a CLI command reference box.
- 面板头部版本徽章更清晰。Clearer version badge in the panel header.

## [0.3.1] - 2026-08

### 修复 · Fixed
- 移除 web 面板的 zip-queue 路径（`pendingZip` settings 字段 +
  `handlePendingZip`），它死锁了 settings/api 通道、让整个 UI 空白。
  稳定的提示词 + 技能流程恢复；zip 技能经 `/sw-install-zip` CLI 命令安装
  （直接 Host 调用，不走 settings 往返）。
  Removed the web-panel zip-queue path which deadlocked the settings/api
  channel and made the UI appear empty; zip skills install via the
  `/sw-install-zip` CLI command (direct Host call, no settings round-trip).

## [0.3.0] - 2026-08

### 修复 · Fixed
- **提示词现在真正生效。** 根因链：包 `main` 指向 `lib/types/index.js`
  （tsc 原始产物），loader 无法识别为插件——插件从未挂载。把 `main` 恢复为
  `lib/index.js`（tsdown bundle），并在 `static inject` 声明 `skills` /
  `systemPrompt`，服务才能解析它们（`/sw` 之前报 "cannot get property
  skills without inject"）。提示词经 `ctx.systemPrompt.section` 全局注入；
  技能经 `ctx.skills.register` 注册。
  **Prompts now actually take effect.** Root cause: package `main` pointed at
  `lib/types/index.js` (tsc raw output) which the loader could not recognize
  as a plugin — the plugin was never mounted. Restored `main` to `lib/index.js`
  (tsdown bundle) and declared `skills` / `systemPrompt` in `static inject`.
  Prompts inject globally via `ctx.systemPrompt.section`; skills register via
  `ctx.skills.register`.

## [0.2.0] - 2026-08

### 新增 · Added
- 提示词编辑：改已存提示词的名称/描述/内容。Prompt editing.
- 技能编辑：改已装技能的名称/描述/内容。Skill editing.
- 本地技能扫描：第 4 个 tab 列出本地扫描的技能，带"收养"操作。
  Local skill scanning: 4th tab lists locally scanned skills with an
  "manage" (adopt) action.
- 设置侧边栏 Prompt-SkillArmory 导航的书图标。
  Settings-sidebar book icon for the nav entry.
- Tab 计数加载中显示 `…`（不再误导性显示 `0`）。
  Tab counts show `…` while loading.

### 变更 · Changed
- 面板改名为 **Prompt-SkillArmory**，配打开的书形图标。
  Panel renamed to **Prompt-SkillArmory** with an open-book glyph.
- 布局改为设置对话框固定宽度内的 4 个 tab：提示词 / 技能 / Agent 预设 /
  本地技能。Layout reworked into 4 tabs: Prompts / Skills / Agent Presets /
  Local skills.
- 技能 tab 只管理面板安装的技能；本地技能 tab 只列本地扫描的。
  Skills tab manages only panel-installed skills; Local skills tab only
  locally scanned ones.
- Tab 和头部标签不再强制大写。No forced uppercase.
- Host 端提示词/技能对账全程受保护（settings 提交路径无死锁；修好
  `signal timed out`）。Host prompt/skill reconciliation is fully guarded.

## [0.1.0] - 2026-08

### 新增 · Added
- 首个发布：CCswitch 风格的提示词、技能、预设管理器。
  Initial release: CCswitch-style manager for prompts, skills, and presets.
- 提示词：增 / 启用 / 停用 / 设默认 / 删除；全局注入系统提示词。
  Prompts: add / enable / disable / set default / delete; globally injected.
- 技能：从本地 `.md` 或手动输入安装；启用 / 停用 / 卸载。
  Skills: install from local `.md` file or manual entry; enable / disable /
  uninstall.
- 预设：浏览 agent-preset 名册，设默认。Presets: browse roster, set default.
- 中英双语 UI。Bilingual UI (zh / en).
- 每个 tab 内搜索 + 滚动。Search + scroll within each tab.
