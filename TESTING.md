# 本地功能测试 · Local functional testing

> 简体中文 · English

不需要发布 npm 就能完整测试——用 `file:`/`link:` 安装或 monorepo workspace。
以下步骤可在普通机器（Windows/macOS/Linux，`$HOME` 即你的家目录）直接复制粘贴。
Test everything locally without publishing to npm — use a `file:`/`link:` install
or the monorepo workspace. All steps below are copy-pasteable on a normal machine
(Windows/macOS/Linux; `$HOME` = your home directory).

---

## 第 0 步 · 前置条件 · Step 0 — prerequisites

- Node 22.19+ 与 pnpm 11（仓库固定 `pnpm@11.7.0`）。
- 包含 switchblade 包的完整 `deepseek-harness` checkout：
  `packages/switchblade/switchblade`。

```bash
cd deepseek-harness
corepack enable            # 确保 pnpm 11 · ensure pnpm 11
pnpm install               # 链接所有 workspace 包（含 switchblade）
                           # links all workspace packages incl. switchblade
```

> ⚠ 如果 pnpm 链接损坏（Windows junction 问题会导致
> `Cannot find module '@deepseek-ai/dsh-settings'` 之类的报错），重跑一次
> `pnpm install`；普通机器上一次即可解决。
> ⚠ If pnpm's links are broken (Windows junction issues can cause
> `Cannot find module '@deepseek-ai/dsh-settings'` failures), rerun
> `pnpm install` once; on a normal machine this resolves.

---

## 第 1 步 · 本地构建插件 · Step 1 — build the plugin locally

```bash
cd packages/switchblade/switchblade
pnpm run build
```

它做什么 · What this does:
1. `tsc -b .` → 产出 `lib/`（ESM + `.d.ts`）· emits `lib/`
2. `node scripts/fix-imports.mjs` → 把 `lib/` 里的相对 `./x.ts` 重写成
   `./x.js`，让 Node 直接加载 · rewrites `./x.ts` → `./x.js` so Node loads it
3. `pnpm exec tsdown` → 打包 `lib/index.js`（尽力而为；tsdown 不可用时，
   tsc 产物 + 修正后的 import 仍可加载）· bundles `lib/index.js` (best-effort;
   tsc output + fixed imports still loadable)

加载冒烟测试 · Sanity check that it loads:

```bash
node -e "import('./lib/index.js').then(m=>console.log('OK',Object.keys(m))).catch(e=>{console.error('FAIL',e.message);process.exit(1)})"
```

期望 `OK`，且 keys 包含 `Switchblade`、`SwitchbladeSettingsSchema`。
Expect `OK` with keys including `Switchblade`, `SwitchbladeSettingsSchema`.

---

## 第 2 步 · 装进临时应用（不走 registry）· Step 2 — local install into a scratch app

```bash
mkdir -p ~/dsh-test && cd ~/dsh-test
npm init -y
npm install @deepseek-ai/dsh-switchblade@file:../deepseek-harness/packages/switchblade/switchblade
```

`file:` 安装直接来自你的 checkout——无需 npm 登录、无需发布。
`file:` installs from your checkout — no npm login, no publish.

---

## 第 3 步 · 接入 harness profile 并启动 · Step 3 — wire into a profile and launch

创建一个列出该 bundle 的 dev profile · Create a dev profile listing the bundle:

```bash
# 找到你的 harness home · find your harness home
dsh --help | grep -i home        # 或 echo $DSH_HOME（默认 ~/.dsh）

mkdir -p $DSH_HOME/profiles/dev
# $DSH_HOME/profiles/dev/package.json
cat > $DSH_HOME/profiles/dev/package.json <<'EOF'
{
  "name": "dev",
  "dependencies": {
    "@deepseek-ai/dsh-switchblade": "file:~/dsh-test/node_modules/@deepseek-ai/dsh-switchblade"
  },
  "dsh": { "profile": { "bundles": ["@deepseek-ai/dsh-switchblade"] } }
}
EOF
```

用该 profile 启动 · Launch the harness against that profile:

```bash
dsh --profile dev
```

（如果 checkout 还没构建，`dsh` 本身跑不起来——先跑仓库的 `pnpm run build`，
或在 checkout 内用 `pnpm dsh --profile dev`。）
(If your checkout isn't built, `dsh` won't run — run the repo's
`pnpm run build` once, or use `pnpm dsh --profile dev` inside the checkout.)

---

## 第 4 步 · 会话内功能冒烟 · Step 4 — functional smoke in the session

在 harness 会话里跑 `/sw` 命令族 · Run the `/sw` command family in the session:

```
/sw                       → 目录：技能/配置文件/命令，带状态徽章
                          → catalog: skills, profiles, commands with state badges
/sw-enable code-review    → 把 skill:code-review 置为启用 · flips to enabled
/sw-disable code-review   → 置回禁用 · flips back
/sw-install code-review   → 读取 ./dsh/skills/code-review.md，装为运行时技能
                          → reads ./dsh/skills/code-review.md, installs
/sw-uninstall code-review → 卸载 · removes it
/sw-profile default graybeard → 持久化会话默认 profile · persists default
/sw-export               → 写出 .dsh/switchblade.cordis.patch.yml
/sw-import ./x.patch.yml → 从 patch 恢复技能/命令 · reinstates from a patch
```

---

## 第 5 步 · 稳定性检查 · Step 5 — stability checks

```bash
# 1. 开关循环——无重复注册报错 · toggle loop, no duplicate registration errors
for i in $(seq 1 10); do echo "/sw-enable code-review"; echo "/sw-disable code-review"; done

# 2. 重启持久化——停 dsh 再启动，然后 · restart persistence, stop dsh, relaunch, then
/sw     # installedSkills/customCommands 应从 settings 恢复
        # installedSkills/customCommands reinstated from settings

# 3. 原子写入——/sw-export 进行中杀掉进程，重启后确认 · atomic writes: kill mid-export,
#    relaunch and confirm the settings namespace 'switchblade' is still valid

# 4. 空目录——不配置技能启动；/sw 显示空行不抛错 · empty catalog: empty rows, no throw

# 5. 并发读取——快速连调 /sw 两次；无重复体、无泄漏 · parallel get: no dups/leaks
```

---

## 第 6 步 · UI 预览（可选，30 秒）· Step 6 — UI preview (optional, 30s)

```bash
start packages/switchblade/switchblade/demo/demo.html   # Windows
# 或任意浏览器打开 · or open the file in any browser
```

---

## 第 7 步 · 全绿后才发布 · Step 7 — only when all green: publish

```bash
npm login
npm run release -- patch   # 剥掉 workspace 引用、构建、发布 · peels refs, builds, publishes
# 或推 v* tag → .github/workflows/publish.yml 自动发布
# or push a v* tag → publish.yml publishes for you
```

---

## 故障排查 · Troubleshooting

| 症状 Symptom | 修复 Fix |
| --- | --- |
| `Cannot find module '@deepseek-ai/dsh-...'` | 在仓库根目录重跑 `pnpm install`；首次 pnpm 链接常坏 · rerun at repo root; links break on first run |
| `lib` 缺失 · `lib` missing | 在 `packages/switchblade/switchblade` 跑 `pnpm run build` |
| 找不到 `dsh` 命令 · `dsh` not found | 用 checkout 里的 `pnpm dsh`，或把构建好的 bin 加入 PATH |
| tsdown 失败（原生工具链）· tsdown fails | 某些沙箱预期如此；tsc+fix-imports 产物仍可加载 · expected in some sandboxes; tsc output still loadable |
| Windows junction `UNKNOWN` 错误 | 重跑 `pnpm install`；仍不行就删 `node_modules` 重装 · rerun; if persistent, delete and reinstall |
