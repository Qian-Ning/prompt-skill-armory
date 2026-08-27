# 本地功能测试

> 不需要发布 npm 就能完整测试——用 `file:`/`link:` 安装或 monorepo workspace。以下步骤可在普通机器（Windows/macOS/Linux，`$HOME` 即你的家目录）直接复制粘贴。

**中文** · [**English**](./TESTING.en.md)

---

## 第 0 步 · 前置条件

- Node 22.19+ 与 pnpm 11（仓库固定 `pnpm@11.7.0`）。
- 包含 switchblade 包的完整 `deepseek-harness` checkout：`packages/switchblade/switchblade`。

```bash
cd deepseek-harness
corepack enable            # 确保 pnpm 11
pnpm install               # 链接所有 workspace 包（含 switchblade）
```

> ⚠ 如果 pnpm 链接损坏（Windows junction 问题会导致 `Cannot find module '@deepseek-ai/dsh-settings'` 之类的报错），重跑一次 `pnpm install`；普通机器上一次即可解决。

---

## 第 1 步 · 本地构建插件

```bash
cd packages/switchblade/switchblade
pnpm run build
```

它做什么：
1. `tsc -b .` → 产出 `lib/`（ESM + `.d.ts`）
2. `node scripts/fix-imports.mjs` → 把 `lib/` 里的相对 `./x.ts` 重写成 `./x.js`，让 Node 直接加载
3. `pnpm exec tsdown` → 打包 `lib/index.js`（尽力而为；tsdown 不可用时，tsc 产物 + 修正后的 import 仍可加载）

加载冒烟测试：

```bash
node -e "import('./lib/index.js').then(m=>console.log('OK',Object.keys(m))).catch(e=>{console.error('FAIL',e.message);process.exit(1)})"
```

期望 `OK`，且 keys 包含 `Switchblade`、`SwitchbladeSettingsSchema`。

---

## 第 2 步 · 装进临时应用（不走 registry）

```bash
mkdir -p ~/dsh-test && cd ~/dsh-test
npm init -y
npm install @deepseek-ai/dsh-switchblade@file:../deepseek-harness/packages/switchblade/switchblade
```

`file:` 安装直接来自你的 checkout——无需 npm 登录、无需发布。

---

## 第 3 步 · 接入 harness profile 并启动

创建一个列出该 bundle 的 dev profile：

```bash
# 找到你的 harness home
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

用该 profile 启动：

```bash
dsh --profile dev
```

（如果 checkout 还没构建，`dsh` 本身跑不起来——先跑仓库的 `pnpm run build`，或在 checkout 内用 `pnpm dsh --profile dev`。）

---

## 第 4 步 · 会话内功能冒烟

在 harness 会话里跑 `/sw` 命令族：

```
/sw                       → 目录：技能/配置文件/命令，带状态徽章
/sw-enable code-review    → 把 skill:code-review 置为启用
/sw-disable code-review   → 置回禁用
/sw-install code-review   → 读取 ./dsh/skills/code-review.md，装为运行时技能
/sw-uninstall code-review → 卸载
/sw-profile default graybeard → 持久化会话默认 profile
/sw-export               → 写出 .dsh/switchblade.cordis.patch.yml
/sw-import ./x.patch.yml → 从 patch 恢复技能/命令
```

---

## 第 5 步 · 稳定性检查

```bash
# 1. 开关循环——无重复注册报错
for i in $(seq 1 10); do echo "/sw-enable code-review"; echo "/sw-disable code-review"; done

# 2. 重启持久化——停 dsh 再启动，然后
/sw     # installedSkills/customCommands 应从 settings 恢复

# 3. 原子写入——/sw-export 进行中杀掉进程，重启后确认
#    settings namespace 'switchblade' 仍然有效

# 4. 空目录——不配置技能启动；/sw 显示空行不抛错

# 5. 并发读取——快速连调 /sw 两次；无重复体、无泄漏
```

---

## 第 6 步 · UI 预览（可选，30 秒）

```bash
start packages/switchblade/switchblade/demo/demo.html   # Windows
# 或任意浏览器打开
```

---

## 第 7 步 · 全绿后才发布

```bash
npm login
npm run release -- patch   # 剥掉 workspace 引用、构建、发布
# 或推 v* tag → .github/workflows/publish.yml 自动发布
```

---

## 故障排查

| 症状 | 修复 |
| --- | --- |
| `Cannot find module '@deepseek-ai/dsh-...'` | 在仓库根目录重跑 `pnpm install`；首次 pnpm 链接常坏 |
| `lib` 缺失 | 在 `packages/switchblade/switchblade` 跑 `pnpm run build` |
| 找不到 `dsh` 命令 | 用 checkout 里的 `pnpm dsh`，或把构建好的 bin 加入 PATH |
| tsdown 失败（原生工具链） | 某些沙箱预期如此；tsc+fix-imports 产物仍可加载 |
| Windows junction `UNKNOWN` 错误 | 重跑 `pnpm install`；仍不行就删 `node_modules` 重装 |
