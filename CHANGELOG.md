# 更新日志

> **Armory**（`@deepseek-ai/dsh-switchblade` + `@deepseek-ai/dsh-client-ui-switchblade`）的所有重要变更。

**中文** · [**English**](./CHANGELOG.en.md)

格式基于 [Keep a Changelog](https://keepachangelog.com/)，版本遵循 [Semantic Versioning](https://semver.org/)。

## [0.9.5] - 2026-08

### 新增 · Added
- 使用统计折线图实时刷新：统计标签页打开时每 30 秒自动轮询当前范围（今天 / 7天 / 30天 / 全部），并在标题旁显示「上次更新」时间；切换范围立即拉取最新数据。
  Usage-stats chart now live-refreshes: while the stats tab is open it polls the active range (today / 7d / 30d / all) every 30 seconds, shows the last-updated time next to the title, and fetches instantly when switching ranges.
- 所有范围的按日折线都补全到今天（缺的日期补 0），7 天 / 30 天 / 全部的趋势线尾巴始终顶到最新使用状态；Host 端加 4 秒 TTL 缓存避免轮询反复读盘。
  Daily trend lines for every range are now padded through today (missing days filled with 0), so the 7d / 30d / all lines always reach the latest usage; the Host adds a 4s TTL cache so polling does not re-read the projcache every tick.

## [0.9.4] - 2026-08

### 修复 · Fixed
- 「今天」统计改用会话的**最后活动时间**（`lastPromptAt`，回退到创建时间）做过滤与按小时分桶：此前按创建时间过滤会把「前几天创建、今天仍在使用」的会话整个跳过，导致今天折线图空白。同时按日统计改为本地时区日期（不再用 UTC `toISOString` 产生跨日错位）。
  The "today" stats now use each session's **last activity time** (`lastPromptAt`, falling back to creation time) for filtering and hourly bucketing: previously sessions created earlier but still used today were skipped entirely, leaving the today chart blank. Daily bucketing also switched to local-timezone dates (no more UTC shift).

## [0.9.3] - 2026-08

### 新增 · Added
- 对话导出支持「整个项目工作区」：下拉选择项目后一键导出该项目下的全部对话。
  Conversation export now supports whole-project workspaces: pick a project and export every conversation under it in one click.
- 导出包携带工作区注册表（title/path）与每个会话的 identity（createdAt/cwd/title），导入后合并写回 `workspace.json` 与 `session_projcache.json`，项目工作区名不再变成「未命名」，尽量与导出端一致。
  The export zip now carries the workspace registry (title/path) plus per-session identity (createdAt/cwd/title); import merges them back into `workspace.json` and `session_projcache.json`, so project workspace names survive the move instead of falling back to "unnamed".

## [0.9.2] - 2026-08

### 修复 · Fixed
- 对话导出仅包含勾选的会话（不再打包全局附件/工作区，避免泄露其他内容）。
  Conversation export now includes only the selected sessions (global attachments/workspace are no longer bundled, preventing leakage).
- 更新提示并入标题版本号旁（移除独立横幅）。
  The update prompt now sits next to the version badge in the header (standalone banner removed).

## [0.9.1] - 2026-08

### 修复 · Fixed
- 一键更新失败：npm 包 bin 名实际为 `armory`，旧命令 `npx prompt-skill-armory` 找不到同名命令。新增 `prompt-skill-armory` bin 别名，Host 更新改用 `npm exec --package=prompt-skill-armory -- armory`（shell 模式 + 更长超时），并把具体错误信息回显到面板。
  Fixed one-click update: the npm bin is `armory`, so `npx prompt-skill-armory` failed. Added a `prompt-skill-armory` bin alias, switched the Host update to `npm exec --package=prompt-skill-armory -- armory` (shell mode + longer timeout), and surface the real error in the panel.

## [0.9.0] - 2026-08

### 变更 · Changed
- **移除 Agent 预设 tab** 及相关 UI/状态/注入。
  Removed the Agent Presets tab and related UI/state/injection.
- **使用统计全面升级**（对齐 cc-switch）：时间范围筛选（全部/30天/7天/今天）、输入/输出/缓存读/缓存写 Token、缓存命中率、成本估算、请求日志（时间/项目/模型/输入输出/缓存/成本/用时/首字/状态）、Provider（项目）统计、模型统计、SVG 双轴趋势图，今天按 24 小时分段。
  Usage stats overhaul (cc-switch style): range filter, input/output/cache tokens, cache-hit rate, cost estimate, request log, provider/project stats, model stats, SVG dual-axis trend chart (24h split for today).

## [0.8.3] - 2026-08

### 新增 · Added
- **一键更新**：面板自动检测 npm 最新版本，发现新版本时顶部横幅提示并可一键更新（Host 端运行官方安装器原地重装）。
  **One-click update**: the panel auto-checks the npm registry; when a newer version exists it shows a banner with a one-click update (the Host re-runs the official installer in place).
- 删除/导入对话后同步刷新 DSH 官方会话列表。
  The official DSH conversation list now refreshes after delete/import.

## [0.8.2] - 2026-08

### 新增 · Added
- **真实删除对话**：对话 tab 新增「删除选中」（带确认），删除会话目录并从 DSH 会话索引移除。
  **Real conversation delete**: a "delete selected" action (with confirm) in the Chat tab that removes the session directory and its index entry.

## [0.8.1] - 2026-08

### 新增 · Added
- **卸载命令**：`npx prompt-skill-armory uninstall` 移除插件（包、bundle、面板挂载）并清理壁纸/导出目录。
  **Uninstall command**: `npx prompt-skill-armory uninstall` removes the plugin (packages, bundle, panel mount) and cleans up wallpaper/export dirs.
- README 增加 LINUX DO 友情链接。
  Added a LINUX DO friend link to the README.

## [0.8.0] - 2026-08

### 新增 · Added
- **对话导入 / 导出**：勾选多个会话导出为 zip（含附件与工作区），另一台机器导入即可还原；新增「对话」tab，显示对话标题、项目与时间。
  **Conversation import/export**: export selected sessions as a zip (with attachments & workspace) and restore them on another machine; new "Chat" tab showing title, project and time.
- 会话标题回退：读取 DSH 会话缓存标题，缺失时从会话日志取第一条用户消息（与官方默认标题一致）。
  Title fallback: use the DSH session-cache title, falling back to the first user message from the log (matching the official default-title rule).

## [0.7.2] - 2026-08

### 变更 · Changed
- 插件展示名更名 **Armory**（面板标题、设置导航、README 定位为 DeepSeek Harness 社区插件/管理中枢，覆盖提示词/技能/MCP/壁纸/预设）；npm 与仓库名保持 `prompt-skill-armory`。
  Renamed the display name to **Armory** (panel title, nav, README) and positioned it as a DeepSeek Harness community plugin / control center (prompts, skills, MCP, wallpaper, presets); npm & repo stay `prompt-skill-armory`.

## [0.7.1] - 2026-08

### 修复 · Fixed
- 渐变色方案：正确解析渐变 id → CSS（修复除「纯色」外渐变文字未生效）。
  Gradient presets now resolve the preset id to its CSS (fixes gradient text not applying).

## [0.7.0] - 2026-08

### 新增 · Added
- 可配置全局壁纸：本地上传图片/视频（字节存盘 `~/.dsh/wallpapers`，settings 只存 id，不撑爆配置文档）或图片 URL；透明度 / 遮罩 / 玻璃透明度 / 玻璃模糊 / 壁纸模糊 / 铺法可调。
  Configurable global wallpaper: local image/video upload (bytes on disk, id-only in settings) or an image URL; adjustable opacity / scrim / glass / blur / fit.
- 桌面客户端与网页端分别设置壁纸与样式（`backgroundDesktop` / `backgroundWeb` 分字段）。
  Per-surface wallpaper & styling for desktop vs web.
- 输入栏下方提示行（含 dock 统计行）样式：启用 / 颜色 / 字号 / 渐变色预设（极光/火焰/晴空/霓虹/海洋/晚霞）。
  Composer hint-line (incl. dock stats row) styling: enable / color / size / gradient presets.
- Wallpaper tab 移至第四列并更名 Wallpaper；启用改为醒目滑动开关。
  Wallpaper tab moved to 4th column and renamed Wallpaper; a prominent enable switch.

## [0.5.6] - 2026-08

### 变更 · Changed
- 三个 tab 改为上下布局（操作区在上、列表在下、列表 flex 自适应），三个 tab 高度一致，消除底部留白与溢出。
  Tabs switched to a vertical layout (form on top, list below, list flex-adaptive) so all three tabs share one height — no bottom whitespace or overflow.
- 版本徽章同步到 0.5.6。Version badge bumped to 0.5.6.

## [0.5.5] - 2026-08

### 修复
- 重新构建 client bundle，让发布的 `lib/client.js` 携带当前版本徽章（`v0.5.5`）——之前只改源码版本号导致已发布 bundle 过期。

## [0.5.4] - 2026-08

### 修复
- Profile 的 `cordis.patch.yml` 现在是纯顶层 `- insert:` 列表（之前的 `[]` + insert 形式是非法 YAML——“document separator expected”，会让 desktop 客户端进入恢复模式）。

## [0.5.3] - 2026-08

### 修复
- 安装器幂等地重写格式错误的 `cordis.patch.yml`（旧安装器产物）为干净格式。

## [0.5.2] - 2026-08

### 修复
- 安装器现在**始终确保 desktop profile 存在**（客户端默认用 `desktop` profile）并装好插件——新机器之前只有 `web` profile，客户端没有面板。

## [0.5.1] - 2026-08

### 修复
- 安装器在新机器上同时创建 `web` 和 `desktop` 两个 profile。

## [0.5.0] - 2026-08

### 新增
- **DSH Desktop 客户端支持**：面板同时出现在官方 `dsh web` 和 DSH Desktop 客户端。安装器把 `ui-switchblade` 挂进每个 profile 的 `cordis.patch.yml`（已验证的正确位置——不是 web-app patch，那会重复挂载崩溃），并把两个插件包装进所有 profile。

### 修复
- Profile 的 `cordis.patch.yml` 以合法 YAML 写入（`[]`，绝不是带引号的 `"[]"`——那会破坏 desktop 客户端的恢复模式）。
- 安装器每个 profile 只挂一次客户端面板（去重）。

## [0.4.7] - 2026-08

### 修复
- 重新构建 client bundle，让发布的 `lib/client.js` 携带 Prompt•Skill-Armory 名称和当前版本徽章（只改源码导致已发布 bundle 过期）。

## [0.4.6] - 2026-08

### 变更
- 面板 + 侧边栏名称 **Prompt•Skill-Armory**（圆点分隔符），Prompt 与 Skill 共享同一强调色。版本徽章跟随发布版本。

## [0.4.5] - 2026-08

### 变更
- 面板和侧边栏名称现为 **Prompt•Skill-Armory**；Prompt 与 Skill 共享强调色。
- 安装器自动挂载客户端面板（cordis.patch.yml 的 ui-switchblade 行），面向 desktop / web profile。
- 安装器体检：settings.yaml 超过客户端 4MB 上限时告警（陈旧的 pendingZip 残留）。

## [0.4.4] - 2026-08

### 修复
- 安装器覆盖过期的符号链接/junction（先 rmSync 再复制），并安装进每个 profile（web + desktop）。
- settings 膨胀（5MB 陈旧的 zip base64）不再卡死 desktop 客户端。

## [0.4.1] - 2026-08

### 变更
- 统一命名为 **Prompt-SkillArmory**：CLI 命令现在是 `/armory-*`（`/armory`、`/armory-enable`、`/armory-skill-dir`、`/armory-install-zip`…），保留旧 `/sw-*` 别名以兼容。

## [0.4.0] - 2026-08

### 变更
- 技能 tab 现在是所有技能的唯一入口：面板安装的（managed）和本地扫描的合并进一个列表，每张卡片带调用提示（`/name`）和完整管理（增/改/开关/卸载/收养）。
- 移除单独的 "Local skills" tab 和 web zip 上传按钮（CLI 的 `/sw-install-zip` / `/sw-skill-dir` 命令仍是 zip/dir 安装路径）。
- 技能 tab 增加了 CLI 命令参考框。
- 面板头部版本徽章更清晰。

## [0.3.1] - 2026-08

### 修复
- 移除 web 面板的 zip-queue 路径（`pendingZip` settings 字段 + `handlePendingZip`），它死锁了 settings/api 通道、让整个 UI 空白。稳定的提示词 + 技能流程恢复；zip 技能经 `/sw-install-zip` CLI 命令安装（直接 Host 调用，不走 settings 往返）。

## [0.3.0] - 2026-08

### 修复
- **提示词现在真正生效。** 根因链：包 `main` 指向 `lib/types/index.js`（tsc 原始产物），loader 无法识别为插件——插件从未挂载。把 `main` 恢复为 `lib/index.js`（tsdown bundle），并在 `static inject` 声明 `skills` / `systemPrompt`，服务才能解析它们（`/sw` 之前报 "cannot get property skills without inject"）。提示词经 `ctx.systemPrompt.section` 全局注入；技能经 `ctx.skills.register` 注册。

## [0.2.0] - 2026-08

### 新增
- 提示词编辑：改已存提示词的名称/描述/内容。
- 技能编辑：改已装技能的名称/描述/内容。
- 本地技能扫描：第 4 个 tab 列出本地扫描的技能，带"收养"操作。
- 设置侧边栏 Prompt-SkillArmory 导航的书图标。
- Tab 计数加载中显示 `…`（不再误导性显示 `0`）。

### 变更
- 面板改名为 **Prompt-SkillArmory**，配打开的书形图标。
- 布局改为设置对话框固定宽度内的 4 个 tab：提示词 / 技能 / Agent 预设 / 本地技能。
- 技能 tab 只管理面板安装的技能；本地技能 tab 只列本地扫描的。
- Tab 和头部标签不再强制大写。
- Host 端提示词/技能对账全程受保护（settings 提交路径无死锁；修好 `signal timed out`）。

## [0.1.0] - 2026-08

### 新增
- 首个发布：CCswitch 风格的提示词、技能、预设管理器。
- 提示词：增 / 启用 / 停用 / 设默认 / 删除；全局注入系统提示词。
- 技能：从本地 `.md` 或手动输入安装；启用 / 停用 / 卸载。
- 预设：浏览 agent-preset 名册，设默认。
- 中英双语 UI。
- 每个 tab 内搜索 + 滚动。
