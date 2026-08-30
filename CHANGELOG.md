# 更新日志

> **Prompt•Skill-Armory**（`@deepseek-ai/dsh-switchblade` + `@deepseek-ai/dsh-client-ui-switchblade`）的所有重要变更。

**中文** · [**English**](./CHANGELOG.en.md)

格式基于 [Keep a Changelog](https://keepachangelog.com/)，版本遵循 [Semantic Versioning](https://semver.org/)。

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
