# Publishing Guide

> This guide covers publishing and distributing **Armory** (0.9.0).

[**中文**](./PUBLISHING.md) · **English**

---

## Two packages

| Package | Role |
|---|---|
| `prompt-skill-armory` | npm installer (CLI) |
| `@deepseek-ai/dsh-switchblade` | Host service (prompts/skills/armory commands) |
| `@deepseek-ai/dsh-client-ui-switchblade` | Web panel |

---

## Already published

`prompt-skill-armory` is already on npm; users install with one command:

```bash
npx prompt-skill-armory
```

The installer: locates DSH home → ensures web+desktop profiles → installs both plugin packages → adds the Host bundle → mounts the panel (profile `cordis.patch.yml`) → health-checks settings.

---

## Publishing a new version

1. **Edit source** in `plugin-src/` (or `packages/*/src`)
2. **Version bumps in three places**:
   - `packages/*/package.json` `version`
   - `ARMORY_VERSION` in `plugin-src/client/src/client/SwitchbladeSection.tsx`
   - `CHANGELOG.md`
3. **Rebuild the client bundle** (so the version badge updates):
   ```bash
   # inside the DSH checkout
   pnpm exec tsc -b packages/client/ui-switchblade
   pnpm exec tsdown --env.DSH_BUILD_FACE client
   # then sync lib/client.js into release-repo/packages/client-ui-switchblade/lib/
   ```
4. **Sync builds**:
   ```bash
   node scripts/build-shipped.mjs <path-to-deepseek-harness>
   ```
5. **Publish**:
   ```bash
   cd release-repo
   npm version patch   # or minor/major
   npm publish
   ```

---

## Version history

- **0.1.0** — initial CCswitch-style manager
- **0.2.0** — editing / 4 tabs / renamed to Prompt•Skill-Armory / book icon
- **0.3.0** — prompts actually take effect (fixed `main` + `static inject`)
- **0.4.x** — installer multi-profile support, patch format fixes
- **0.5.0** — client + web dual-mode panel
- **0.5.5** — version badge rebuilt in sync
- **0.5.6** — vertical layout, fixed height, compact cards

See `CHANGELOG.md`.
