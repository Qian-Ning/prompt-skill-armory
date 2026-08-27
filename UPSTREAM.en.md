# Upstream Integration Guide

> This document lists every change to ship **Prompt•Skill-Armory** natively in the DeepSeek Harness ecosystem, so the panel appears in both `dsh web` and the DSH Desktop client — including the book icon in the settings sidebar.

[**中文**](./UPSTREAM.md) · **English**

Two upstream repos:
1. `deepseek-ai/deepseek-harness` — the main repo (web + core)
2. `anywhere-labs/dsh-desktop` — the desktop client

---

## A. deepseek-ai/deepseek-harness

### A1. Add the Host package `packages/switchblade/switchblade`

New package `@deepseek-ai/dsh-switchblade`:
- `src/index.ts` — function plugin (exports `name`/`inject`/`apply`)
- `src/switchblade.ts` — `Switchblade extends Service` (`static inject = ['loader','skills','systemPrompt']`): prompt CRUD (globally injected via `ctx.systemPrompt.section`), skill install/manage, preset handling
- `src/commands.ts` — `/armory` command family (incl. `/sw-*` aliases)
- `src/invariant.ts` / `src/types.ts` / `src/patch.ts`
- `cordis.patch.yml` — bundle manifest (`dsh.bundle.patch`)
- `package.json` — peerDeps on core dsh packages

### A2. Add the Web panel `packages/client/ui-switchblade`

New package `@deepseek-ai/dsh-client-ui-switchblade`:
- `src/client/SwitchbladeSection.tsx` — settings panel (3 tabs: Prompts/Skills/Agent Presets)
- `src/client/store.ts` — connection-RPC data layer
- `src/client/locales.ts` — zh/en
- `src/client/index.ts` — registers `settings.section` + `LocaleNamespaceMap`
- `package.json` — `dsh.client` declaration (web platform)

### A3. Register the panel in the web bundle

Add to `packages/bundle/web-app/cordis.patch.yml`:

```yaml
    - id: ui-switchblade
      name: '@deepseek-ai/dsh-client-ui-switchblade'
```

### A4. Book icon in the settings sidebar

Add `IconBookOutline16` (open book, 16px, `fill="currentColor"` outline style) to `packages/client/ui-primitives/src/icons/index.tsx`.

Extend `navIcon(id)` in `packages/client/ui-settings-general/src/client/SettingsRoot.tsx`:

```tsx
if (id === 'switchblade') return <IconBookOutline16 className={css.navIcon} size={16} />
```

And import `IconBookOutline16` from `@deepseek-ai/dsh-client-ui-primitives`.

### A5. tsconfig aggregates

- `tsconfig.client.json`: add `{ "path": "./packages/client/ui-switchblade" }`
- `tsconfig.host.json`: add the Host package reference

### A6. Tests / docs

- Add a smoke spec under `packages/client/ui-switchblade/tests`
- Document the feature in the repo README / web UI docs

---

## B. anywhere-labs/dsh-desktop

The desktop client ships a packaged dsh whose web-app bundle lacks our panel. To show it natively:

### B1. Ship the two packages in the client's dsh

Add `@deepseek-ai/dsh-switchblade` and `@deepseek-ai/dsh-client-ui-switchblade` into the client's bundled `node_modules/@deepseek-ai`.

### B2. Add ui-switchblade to the client's web-app patch

The client's packaged `dsh-web-app/cordis.patch.yml` needs the `ui-switchblade` row (same as A3).

### B3. Book icon

Bring `IconBookOutline16` (A4) and the `navIcon` mapping into the client's `ui-settings-general`.

---

## C. PR checklist

- [ ] Host package complete + typecheck passes
- [ ] Client package complete + typecheck passes
- [ ] web-app patch row added
- [ ] `IconBookOutline16` + `navIcon` mapping added
- [ ] tsconfig aggregates updated
- [ ] Desktop client bundles the packages + web-app row
- [ ] Both `dsh web` and DSH Desktop show the panel + book icon

---

## D. Why this matters

- Users of the npm installer get the panel today via profile composition.
- Upstreaming makes it **native**: the sidebar icon is a book (not a gear), and every client update includes it automatically.
