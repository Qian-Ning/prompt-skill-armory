# Local functional testing

> Test everything locally without publishing to npm — use a `file:`/`link:` install or the monorepo workspace. All steps below are copy-pasteable on a normal machine (Windows/macOS/Linux; `$HOME` = your home directory).

[**中文**](./TESTING.md) · **English**

---

## Step 0 — prerequisites

- Node 22.19+ and pnpm 11 (the repo pins `pnpm@11.7.0`).
- The full `deepseek-harness` checkout with the switchblade package inside it (the runtime we adapt to lives at <https://github.com/deepseek-ai/deepseek-harness>; the desktop client at <https://github.com/anywhere-labs/dsh-desktop>): `packages/switchblade/switchblade`.

```bash
cd deepseek-harness
corepack enable            # ensure pnpm 11
pnpm install               # links all workspace packages incl. switchblade
```

> ⚠ If pnpm's links are broken in your environment (Windows junction issues can cause `Cannot find module '@deepseek-ai/dsh-settings'` failures), rerun `pnpm install` once; on a normal machine this resolves.

---

## Step 1 — build the plugin locally

```bash
cd packages/switchblade/switchblade
pnpm run build
```

What this does:
1. `tsc -b .` → emits `lib/` (ESM + `.d.ts`)
2. `node scripts/fix-imports.mjs` → rewrites relative `./x.ts` → `./x.js` inside `lib/` so Node can load it directly
3. `pnpm exec tsdown` → bundles `lib/index.js` (best-effort; if tsdown is unavailable the tsc output + fixed imports is still loadable)

Sanity check that it loads:

```bash
node -e "import('./lib/index.js').then(m=>console.log('OK',Object.keys(m))).catch(e=>{console.error('FAIL',e.message);process.exit(1)})"
```

Expect `OK` with keys including `Switchblade`, `SwitchbladeSettingsSchema`.

---

## Step 2 — local install into a scratch app (no registry)

```bash
mkdir -p ~/dsh-test && cd ~/dsh-test
npm init -y
npm install @deepseek-ai/dsh-switchblade@file:../deepseek-harness/packages/switchblade/switchblade
```

`file:` installs from your checkout — no npm login, no publish.

---

## Step 3 — wire into a profile and launch

Create a dev profile that lists the bundle:

```bash
# find your harness home
dsh --help | grep -i home        # or echo $DSH_HOME (default: ~/.dsh)

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

Launch the harness against that profile:

```bash
dsh --profile dev
```

(If your checkout isn't built, `dsh` won't run — run the repo's `pnpm run build` once, or use `pnpm dsh --profile dev` inside the checkout.)

---

## Step 4 — functional smoke in the session

Run the `/sw` command family in the session:

```
/sw                       → catalog: skills, profiles, commands with state badges
/sw-enable code-review    → flips skill:code-review to enabled
/sw-disable code-review   → flips back
/sw-install code-review   → reads ./dsh/skills/code-review.md, installs as runtime skill
/sw-uninstall code-review → removes it
/sw-profile default graybeard → persists session default profile
/sw-export               → writes .dsh/switchblade.cordis.patch.yml
/sw-import ./x.patch.yml → reinstates skills/commands from a patch
```

---

## Step 5 — stability checks

```bash
# 1. toggle loop — no duplicate registration errors
for i in $(seq 1 10); do echo "/sw-enable code-review"; echo "/sw-disable code-review"; done

# 2. restart persistence — stop dsh, relaunch, then
/sw     # installedSkills/customCommands should be reinstated from settings

# 3. atomic writes — during /sw-export kill the process; relaunch and
#    confirm the settings namespace 'switchblade' is still valid

# 4. empty catalog — launch with no skills configured; /sw shows empty rows, no throw

# 5. parallel get — call /sw twice quickly; no duplicated bodies or leaks
```

---

## Step 6 — UI preview (optional, 30s)

```bash
start packages/switchblade/switchblade/demo/demo.html   # Windows
# or open the file in any browser
```

---

## Step 7 — only when all green: publish

```bash
npm login
npm run release -- patch   # peels workspace refs, builds, publishes
# or push a v* tag → .github/workflows/publish.yml publishes for you
```

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `Cannot find module '@deepseek-ai/dsh-...'` | rerun `pnpm install` at repo root; pnpm links broken on first run |
| `lib` missing | run `pnpm run build` in `packages/switchblade/switchblade` |
| `dsh` command not found | use `pnpm dsh` from the checkout, or add the built bin to PATH |
| tsdown fails (native toolchain) | expected in some sandboxes; the tsc+fix-imports output is still loadable |
| junction `UNKNOWN` errors on Windows | rerun `pnpm install`; if persistent, delete `node_modules` and reinstall |
