# 发布指南

> 本文档说明如何发布与分发 **Prompt•Skill-Armory**（0.5.5）。

**中文** · [**English**](./PUBLISHING.en.md)

---

## 两个包

| 包 | 作用 |
|---|---|
| `prompt-skill-armory` | npm 安装器（CLI） |
| `@deepseek-ai/dsh-switchblade` | Host 服务（提示词/技能/armory 命令） |
| `@deepseek-ai/dsh-client-ui-switchblade` | Web 面板 |

---

## 已发布

`prompt-skill-armory` 已在 npm，用户一键安装：

```bash
npx prompt-skill-armory
```

安装器自动完成：定位 DSH home → 确保 web+desktop profile → 装两个插件包 → 配 Host bundle → 挂载面板（profile `cordis.patch.yml`）→ 体检 settings。

---

## 重新发布新版本

1. **改源码** `plugin-src/`（或 `packages/*/src`）
2. **同步三处版本号**：
   - `packages/*/package.json` `version`
   - `plugin-src/client/src/client/SwitchbladeSection.tsx` 的 `ARMORY_VERSION`
   - `CHANGELOG.md`
3. **重新构建 client bundle**（让版本徽章更新）：
   ```bash
   # 在 DSH checkout 里
   pnpm exec tsc -b packages/client/ui-switchblade
   pnpm exec tsdown --env.DSH_BUILD_FACE client
   # 然后同步 lib/client.js 到 release-repo/packages/client-ui-switchblade/lib/
   ```
4. **同步构建产物**：
   ```bash
   node scripts/build-shipped.mjs <path-to-deepseek-harness>
   ```
5. **发布**：
   ```bash
   cd release-repo
   npm version patch   # 或 minor/major
   npm publish
   ```

---

## 版本历史

- **0.1.0** — 初始版 · initial CCswitch-style manager
- **0.2.0** — 编辑/四栏/改名 Prompt•Skill-Armory/书图标
- **0.3.0** — 提示词真实生效（修 main + static inject）
- **0.4.x** — 安装器多 profile 适配、patch 格式修复
- **0.5.0** — 客户端+web 双模式面板
- **0.5.5** — 版本徽章同步重建
- **0.5.6** — 上下布局、固定高度、紧凑卡片

详见 `CHANGELOG.md`。
