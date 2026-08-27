# 官方合入指南 · Upstream Integration Guide

> 简体中文 · English

本文档列出把 **Prompt•Skill-Armory** 原生内置进 DeepSeek Harness 生态所需的全部改动，
让面板在 `dsh web` 和 DSH Desktop 客户端都原生显示——包括侧边栏书图标。
This document lists every change to ship **Prompt•Skill-Armory** natively in the
DeepSeek Harness ecosystem, so the panel appears in both `dsh web` and the DSH
Desktop client — including the book icon in the settings sidebar.

涉及两个上游仓库 · Two upstream repos:
1. `deepseek-ai/deepseek-harness` — 主仓库（web + 核心）· harness monorepo
2. `anywhere-labs/dsh-desktop` — 桌面客户端 · desktop client

---

## A. deepseek-ai/deepseek-harness

### A1. 添加 Host 包 · Add the Host package `packages/switchblade/switchblade`

新包 `@deepseek-ai/dsh-switchblade`:
- `src/index.ts` — 函数插件（导出 `name`/`inject`/`apply`）
- `src/switchblade.ts` — `Switchblade extends Service`（`static inject =
  ['loader','skills','systemPrompt']`）: 提示词 CRUD（经 `ctx.systemPrompt.section` 全局注入）、
  技能安装/管理、预设处理
- `src/commands.ts` — `/armory` 命令族（含 `/sw-*` 别名）
- `src/invariant.ts` / `src/types.ts` / `src/patch.ts`
- `cordis.patch.yml` — bundle 清单（`dsh.bundle.patch`）
- `package.json` — 依赖核心 dsh 包的 peerDeps

### A2. 添加 Web 面板 · Add the Web panel `packages/client/ui-switchblade`

新包 `@deepseek-ai/dsh-client-ui-switchblade`:
- `src/client/SwitchbladeSection.tsx` — 设置面板（3 tab: 提示词/技能/Agent预设）
- `src/client/store.ts` — connection-RPC 数据层
- `src/client/locales.ts` — 中/英
- `src/client/index.ts` — 注册 `settings.section` + `LocaleNamespaceMap`
- `package.json` — `dsh.client` 声明（web 平台）

### A3. 在 web bundle 注册面板 · Register the panel in the web bundle

`packages/bundle/web-app/cordis.patch.yml` 添加:

```yaml
    - id: ui-switchblade
      name: '@deepseek-ai/dsh-client-ui-switchblade'
```

### A4. 设置侧边栏书图标 · Book icon in the settings sidebar

`packages/client/ui-primitives/src/icons/index.tsx` 添加 `IconBookOutline16`
（打开的书形，16px，`fill="currentColor"` outline 风格）。

`packages/client/ui-settings-general/src/client/SettingsRoot.tsx` 扩展 `navIcon(id)`:

```tsx
if (id === 'switchblade') return <IconBookOutline16 className={css.navIcon} size={16} />
```

并从 `@deepseek-ai/dsh-client-ui-primitives` import `IconBookOutline16`。

### A5. tsconfig 聚合 · tsconfig aggregates

- `tsconfig.client.json`: 加 `{ "path": "./packages/client/ui-switchblade" }`
- `tsconfig.host.json`: 加 Host 包引用

### A6. 测试 / 文档 · Tests / docs

- `packages/client/ui-switchblade/tests` 加 smoke spec
- 仓库 README / web UI 文档说明该功能

---

## B. anywhere-labs/dsh-desktop

桌面客户端打包的 dsh 的 `dsh-web-app` bundle 不含我们的面板。原生显示需:
The desktop client ships a packaged dsh whose web-app bundle lacks our panel. To show it natively:

### B1. 客户端 dsh 内置两个包 · Ship the two packages in the client's dsh

把 `@deepseek-ai/dsh-switchblade` 和 `@deepseek-ai/dsh-client-ui-switchblade`
加进客户端内置的 `node_modules/@deepseek-ai`。

### B2. 客户端 web-app patch 加 ui-switchblade

客户端打包的 `dsh-web-app/cordis.patch.yml` 需含 `ui-switchblade` 行（同 A3）。

### B3. 书图标 · Book icon

把 `IconBookOutline16`（A4）和 `navIcon` 映射带进客户端的 `ui-settings-general`。

---

## C. PR 清单 · PR checklist

- [ ] Host 包完整 + typecheck 通过
- [ ] Client 包完整 + typecheck 通过
- [ ] web-app patch 行已加
- [ ] `IconBookOutline16` + `navIcon` 映射已加
- [ ] tsconfig 聚合已更新
- [ ] 桌面客户端内置包 + web-app 行
- [ ] `dsh web` 和 DSH Desktop 都显示面板 + 书图标

---

## D. 为什么重要 · Why this matters

- npm 安装器的用户已能通过 profile 组合获得面板（当前可行）。
- 官方内置让它**原生**：侧边栏图标是书（而非齿轮），客户端每次更新自动带上。
- Users of the npm installer get the panel today; upstreaming makes it native
  (book icon, auto-included on every client update).
