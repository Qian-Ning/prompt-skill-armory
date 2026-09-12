# 更新日志

> **Armory**（`@deepseek-ai/dsh-switchblade` + `@deepseek-ai/dsh-client-ui-switchblade`）的所有重要变更。

**中文** · [**English**](./CHANGELOG.en.md)

格式基于 [Keep a Changelog](https://keepachangelog.com/)，版本遵循 [Semantic Versioning](https://semver.org/)。

## [0.10.5] - 2026-09

### 修复 · Fixed
- **输入框下方提示样式停用/启用异常**：此前的实现用 JS 直接改写元素 inline style——停用时只删样式标签、残留的 inline 样式没有还原（所以「关不掉」），启用时又给统计条容器加了字号与 `display:inline-block`（所以布局被撑动）。改为**单一 CSS 样式标签驱动**：停用即删除标签，DOM 零残留、完全还原；样式只作用于统计条 label 文本（font/color），不再触碰 flex 容器布局。
  **Composer stats-strip style toggle was broken**: the old implementation wrote inline styles via JS — disabling removed only the style tag, leaving inline styles behind (so it never reverted), and enabling added font-size / `display:inline-block` to the strip container (so the layout shifted). Now driven by a single CSS tag: disabling deletes the tag with zero DOM residue (fully restores), and styles apply only to the strip label text (font/color), never touching the flex container layout.

## [0.10.4] - 2026-09

### 修复 · Fixed
- **输入框下方提示样式真正生效**：该样式针对的是输入框下方的**会话统计 + token 用量条**（2.0.9 渲染为 `[data-composer-stats]` 容器，内含 TimePill/UsagePill，分隔符为 `·`）。CSS 锚定 `[data-composer-stats]` 及其 `_label`/`_pill`（哈希类名用属性选择器匹配），JS 分隔符匹配从旧版 `|` 扩展为 `·`/ `|`。
  **Composer stats-strip hint style now works**: this style targets the session-stats + token-usage strip below the composer, which 2.0.9 renders as `[data-composer-stats]` (TimePill/UsagePill, `·` separators). CSS anchors on `[data-composer-stats]` and its `_label`/`_pill` hashed classes via attribute selectors; JS separator matching now covers `·` and `|`.

## [0.10.3] - 2026-09

### 修复 · Fixed
- **输入框提示样式精准适配**：2.0.9 的提示/占位文本渲染为 `[data-composer-placeholder]` 独立 div（不是 `input::placeholder`）。提示样式直接作用于该元素，渐变色补 `display:inline-block` 确保 `background-clip:text` 生效。另确认 2.0.9 已移除旧 dock StatsLine（`span[aria-hidden="|"]`）。
  **Hint style precisely retargeted**: 2.0.9 renders the composer hint/placeholder as a `[data-composer-placeholder]` div (not `input::placeholder`). The style now targets that element, with `display:inline-block` so gradient `background-clip:text` renders. Also confirmed the old StatsLine dock (`span[aria-hidden="|"]`) is gone in 2.0.9.

## [0.10.2] - 2026-09

### 修复 · Fixed
- **面板报错 `cannot get property "remote.skills" without inject`**：2.0.9 的 cordis 要求 client 插件在 `inject` 里显式声明 `remote.skills` 子命名空间（与官方 ui-skill 一致），且 `skills.list` 的签名是 `({ sessionId }, signal)` 而非旧的 `{ request: ... }`。补齐 inject + 修正调用后，面板正常加载，之前保存的提示词/技能/MCP 数据全部恢复显示（数据一直在 settings.yaml，从未丢失）。
  **Panel error `cannot get property "remote.skills" without inject`**: 2.0.9's cordis requires the client plugin to declare the `remote.skills` sub-namespace in `inject` (matching official ui-skill), and `skills.list` takes `({ sessionId }, signal)` not the old `{ request: ... }`. With the inject added and the call fixed, the panel loads and previously saved prompts/skills/MCP data is restored (it was always in settings.yaml).
- **输入框提示样式适配 2.0.9**：2.0.9 移除了旧的 `[data-decoration="hint"]` 行，提示改在输入框内（placeholder + claim hint）。提示样式选择器改到稳定的 `[data-composer-card]`（placeholder 与内嵌提示文本），颜色/字号/渐变照常生效。
  **Hint style adapted to 2.0.9**: the old `[data-decoration="hint"]` row is gone in 2.0.9; hints now live inside the composer card (placeholder + inline claim hint). The style now targets `[data-composer-card]` placeholder and hint text, keeping color/size/gradient working.

## [0.10.1] - 2026-09

### 修复 · Fixed
- **面板加载报错 `Cannot read properties of undefined (reading 'settings')`**：DSH 2.0.9 把 client 端 settings 访问从 `connection.api.settings` 改成 `ctx.settingsScope`（命名空间绑定）+ `ctx.remote`（RPC）——插件还走旧的 `api.settings`，api 为 undefined 直接抛错，导致提示词/技能/MCP/壁纸面板全部加载失败。已迁移：读走 `settingsScope.getSnapshot()`，写走 `scope.mutate(ops)`，技能走 `remote.skills.list({request})`。面板恢复后，之前安装的提示词/技能/MCP 数据依然在（settings.yaml 从未丢失）。
  **Panel load error `Cannot read properties of undefined (reading 'settings')`**: DSH 2.0.9 moved client settings access from `connection.api.settings` to `ctx.settingsScope` (namespace-bound) + `ctx.remote` (RPC); the plugin still used the old `api.settings`, so api was undefined and the whole panel failed. Migrated: reads via `settingsScope.getSnapshot()`, writes via `scope.mutate(ops)`, skills via `remote.skills.list({request})`. Installed prompts/skills/MCP data was never lost (still in settings.yaml).
- **壁纸只覆盖对话区**：DSH 2.0.9 桌面端是 `.dshDesktopFrame` 三栏 grid（sidebar/conversation/rightbar），背景层挂在 body 下 z-index 为负被 surface 实色背景挡住，且 `data-dsh-desktop-material="off"` 的侧边栏用 `--dsw-alias-bg-layer-1` 实色。现在背景层 z-index 提到 0、`#root` 抬到 z-index 1、所有桌面 surface 背景强制透明（含 `--dsw-alias-bg-layer-1`），壁纸覆盖整个窗口。
  **Wallpaper only covered the chat area**: 2.0.9 desktop renders a `.dshDesktopFrame` three-column grid; the negative-z body backdrop was hidden behind opaque surface fills (sidebar uses `--dsw-alias-bg-layer-1` at material=off). Backdrop is now z-index 0 with `#root` lifted above it and every desktop surface forced transparent, so the wallpaper covers the whole window.

## [0.10.0] - 2026-09

### 修复 · Fixed
- **DSH Desktop 2.0.9 恢复模式（第二次根治）**：修复 cordis 属性访问后，客户端面板仍报 `client-modules: require("@deepseek-ai/dsh-client-runtime/client") missed the module table`——2.0.9 的浏览器模块表不再把 `dsh-client-runtime/client` 作为可用种子，而插件的 snapshot store 从它导入 `createSnapshotStore`，构建产物残留运行时 require 导致加载失败。改为**内联本地 snapshot store** 并移除对 runtime 的运行时依赖（`ClientContext`/会话列表改用本地接口），2.0.9 下实测完整启动。
  **DSH Desktop 2.0.9 recovery mode (second root cause)**: after the cordis fix, the panel still failed with `client-modules: require("@deepseek-ai/dsh-client-runtime/client") missed the module table` — 2.0.9's browser module table no longer seeds `dsh-client-runtime/client`, but the plugin imported `createSnapshotStore` from it, leaving a runtime require in the bundle. Now inlines a local snapshot store and drops the runtime dependency (local `ClientContext`/session interfaces); verified a full boot on 2.0.9.
- **提示词作用域（精细化差分）**：每个提示词可选 全局 / 指定项目（cwd 目录名）/ 指定会话（session id），Host 按 agent 的 cwd/sessionId 匹配注入，零全局污染。
  **Prompt scoping**: each prompt can target global / a project / a session with zero leakage.

## [0.9.9] - 2026-09

### 修复 · Fixed
- **DSH Desktop 2.0.9 恢复模式（根治）**：2.0.9 的 cordis 禁止对未注入的服务做属性访问。插件里 `fiber.ctx.switchblade` 属性访问在加载时抛 `cannot get property "switchblade" without inject`，导致整个客户端启动失败进恢复模式。改为 `ctx.get('switchblade')` 惰性解析，并在 Switchblade 服务的 `static inject` 补上 `commands`；配合上一版对 `cordis.patch.yml` 的块级去重，2.0.9 下已通过 `dsh --profile desktop` 实测完整启动。
  **DSH Desktop 2.0.9 recovery mode (root cause)**: 2.0.9's cordis forbids property access to non-injected services. The plugin's `fiber.ctx.switchblade` property access threw `cannot get property "switchblade" without inject` at load, failing startup into recovery mode. Switched to lazy `ctx.get('switchblade')` and added `commands` to `static inject`; verified a full boot via `dsh --profile desktop` on 2.0.9.
- **提示词作用域（精细化差分）**：每个提示词可选 全局 / 指定项目（cwd 目录名）/ 指定会话（session id）。Host 通过 systemPrompt section 的 text 函数按当前 agent 的 cwd/sessionId 匹配，不匹配返回空串（渲染时自动过滤）——零全局污染。
  **Prompt scoping (fine-grained diff)**: each prompt can target global / a project (cwd basename) / a session (id); non-matching agents get an empty section that render filters out.

## [0.9.8] - 2026-08

### 修复 · Fixed
- **DSH Desktop 2.0.9 恢复模式**：安装器对 `cordis.patch.yml` 的行级去重会把注释行和裸 `- insert:` 当用户条目保留，每次安装/更新都叠加一段残缺 insert 块；2.0.9 的 patch 解析器拒绝无 body 的 insert 导致启动崩溃。改为**块级去重**（命中任一 Armory 管理行即整块清理），并重置已有 profile 的 patch 文件。
  **DSH Desktop 2.0.9 recovery mode**: the installer's line-based dedup kept the comment/header and bare `- insert:` lines as "user entries", appending a truncated insert block on every install/update; 2.0.9's patch parser rejects body-less inserts and crashed at boot. Now block-level (any Armory-managed line clears the whole block), and existing profile patch files are reset.
- **技能名含点号无法注册**：DSH 技能名必须是 kebab-case（`gpt-5.6-sol` 被拒）。安装/注册时自动规范化名字（点号转连字符）。
  Skills with dots failed to register: DSH requires kebab-case names. Names are now normalized on install/register.

### 新增 · Added
- **提示词作用域（精细化差分）**：每个提示词可选 全局 / 指定项目（按 cwd 目录名）/ 指定会话（session id）。Host 通过 systemPrompt section 的 text 函数按当前 agent 的 cwd/sessionId 匹配，不匹配返回空串（渲染时自动过滤）——零全局污染，其他项目/会话完全不受影响。
  **Prompt scoping (fine-grained diff)**: each prompt can target global / a specific project (cwd basename) / a specific session (id). The Host matches via a text provider against the assembling agent's cwd/sessionId and returns '' otherwise (filtered at render) — no global leakage.

## [0.9.7] - 2026-08

### 修复 · Fixed
- 对话删除与工作区下拉「没反应」：导出/导入/删除的异步处理缺少 try/finally，一旦下载抛错 `chatBusy` 卡死为 true，整个工具栏被禁用。现在所有处理统一 try/finally 复位，并逐会话容错删除、同步清理 `workspace.json` 里的 sessionId 引用（防止幽灵会话复活）。
  Delete and the workspace selector appeared dead: the async handlers lacked try/finally, so a failed download left `chatBusy` stuck true and disabled the whole toolbar. Handlers now always reset via finally; deletion is per-session resilient and scrubs sessionIds from `workspace.json` (no ghost-session resurrection).
- 工作区名过长溢出面板：会话列表徽章加最大宽度 + 省略号，整体导出下拉限宽 220px。
  Long workspace names no longer overflow: the session badge gets max-width + ellipsis and the export selector is capped at 220px.
- 折线图 Token 轴改为对数刻度：输入 Token 通常比输出大一个数量级，线性轴会把输出线压成贴地；对数轴让输入/输出/缓存的形状都清晰可读（步骤轴保持线性）。
  The chart token axis now uses a log scale: input tokens are typically an order of magnitude above output, so a linear axis flattened the output line into the baseline; log scale keeps every series readable (the steps axis stays linear).

## [0.9.6] - 2026-08

### 修复 · Fixed
- 折线图输入 Token 线不可见：右轴此前只用输出 Token 缩放，输入 Token 通常大一个数量级，Y 坐标算出负值被画出视口顶部。现在输入/输出/缓存读/缓存写全部参与右轴缩放，并补上输入 Token 的数据点、数值标签与圆整刻度。
  The input-token line was invisible: the right axis was scaled on output tokens alone, and input tokens (typically an order of magnitude larger) produced negative Y coordinates above the viewport. All token series now share the axis scale, and input-token dots, value labels and rounded ticks are rendered.

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
