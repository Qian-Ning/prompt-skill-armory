import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { Service } from "@deepseek-ai/cordis";
import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { homedir } from "node:os";
import { settingsNamespace } from "@deepseek-ai/dsh-settings";
import z from "@deepseek-ai/schemastery";
import { zstdDecompressSync } from "node:zlib";
//#region src/commands.ts
/**
* The `/sw` slash-command family.
*
* Registered through `ctx.commands.register` (global layer) by the Switchblade
* service constructor. Each handler runs directly, without a model round-trip,
* exactly like a CCswitch toggle — the result text is what surfaces.
*
* @module @deepseek-ai/dsh-switchblade
*/
/** Extract non-empty space-separated tokens from a command's raw input. */
function tokens(input) {
	return input.trim().split(/\s+/).filter((token) => token.length > 0);
}
/** One result helper: `text` yields a success result, `error` an error one. */
function ok(text) {
	return {
		kind: "success",
		text
	};
}
function err(text) {
	return {
		kind: "error",
		text
	};
}
/** Render a compact two-column table from normalized entries. */
function renderRows(rows) {
	if (rows.length === 0) return "  (empty)";
	return rows.map((row) => `  [${row.state.padEnd(9)}] ${row.id} — ${row.description}`).join("\n");
}
/** Register every `/sw` command against a live Switchblade instance. */
function defineCommands(ctx, sb) {
	const commands = [
		{
			name: "armory",
			description: "Switchblade: list installed skills, profiles, and slash commands",
			handler: async (invocation) => {
				const catalog = await sb.catalog(invocation.agent);
				const skills = catalog.entries.filter((row) => row.kind === "skill");
				const profiles = catalog.entries.filter((row) => row.kind === "profile");
				const commands = catalog.entries.filter((row) => row.kind === "command");
				return ok(`skills:\n${renderRows(skills)}\nprofiles${catalog.defaultProfile === void 0 ? "" : ` (default: ${catalog.defaultProfile})`}:\n${renderRows(profiles)}\ncommands:\n${renderRows(commands)}`);
			}
		},
		{
			name: "armory-enable",
			description: "Switchblade: enable an installed skill by name",
			handler: async (invocation) => {
				const name = tokens(invocation.rawInput)[0];
				if (name === void 0) return err("/armory-enable <skill-name>");
				const result = await sb.setSkillEnabled(name, true);
				return ok(`enabled ${result.id} (${result.state})`);
			}
		},
		{
			name: "armory-disable",
			description: "Switchblade: disable an installed skill by name",
			handler: async (invocation) => {
				const name = tokens(invocation.rawInput)[0];
				if (name === void 0) return err("/armory-disable <skill-name>");
				const result = await sb.setSkillEnabled(name, false);
				return ok(`disabled ${result.id} (${result.state})`);
			}
		},
		{
			name: "armory-install",
			description: "Switchblade: install a local skill (<name>.md) and enable it at once",
			handler: async (invocation) => {
				const args = tokens(invocation.rawInput);
				const name = args[0];
				if (name === void 0) return err("/armory-install <skill-name>");
				const source = args[1] ?? name;
				try {
					const content = await readFile(join(process.cwd(), ".dsh", "skills", `${source}.md`), "utf8");
					const result = await sb.installSkill({
						name,
						content,
						description: `installed from ${source}.md`
					});
					return ok(`installed ${result.id} (${result.state})`);
				} catch (error) {
					return err(`could not install ${name}: ${error instanceof Error ? error.message : String(error)}`);
				}
			}
		},
		{
			name: "armory-uninstall",
			description: "Switchblade: uninstall an owned skill by name",
			handler: async (invocation) => {
				const name = tokens(invocation.rawInput)[0];
				if (name === void 0) return err("/armory-uninstall <skill-name>");
				const result = await sb.uninstallSkill(name);
				return ok(`uninstalled ${result.id} (${result.state})`);
			}
		},
		{
			name: "armory-profile",
			description: "Switchblade: show or set the default prompt profile",
			handler: async (invocation) => {
				const args = tokens(invocation.rawInput);
				if (args[0] === "default" && args[1] !== void 0) {
					await sb.setDefaultProfile(args[1]);
					return ok(`default profile set to ${args[1]}`);
				}
				const catalog = await sb.catalog(invocation.agent);
				return ok(catalog.entries.filter((row) => row.kind === "profile").length === 0 ? "  (no profiles)" : renderRows(catalog.entries.filter((row) => row.kind === "profile")));
			}
		},
		{
			name: "armory-export",
			description: "Switchblade: export the managed state as a bundle patch layer",
			handler: async (_invocation) => {
				const patch = await sb.exportBundle();
				const destination = join(process.cwd(), ".dsh", "switchblade.cordis.patch.yml");
				try {
					await writeFile(destination, patch, "utf8");
					return ok(`exported ${destination}`);
				} catch (error) {
					return err(`could not write ${destination}: ${error instanceof Error ? error.message : String(error)}`);
				}
			}
		},
		{
			name: "armory-import",
			description: "Switchblade: import switchblade rows from a bundle patch file",
			handler: async (invocation) => {
				const path = tokens(invocation.rawInput)[0];
				if (path === void 0) return err("/armory-import <path-to-cordis.patch.yml>");
				try {
					const text = await readFile(path, "utf8");
					await sb.importBundle(text);
					return ok(`imported ${path}`);
				} catch (error) {
					return err(`could not import ${path}: ${error instanceof Error ? error.message : String(error)}`);
				}
			}
		},
		{
			name: "armory-skill-dir",
			description: "Switchblade: install a skill directory (SKILL.md + references) into ~/.dsh/skills",
			handler: async (invocation) => {
				const dir = tokens(invocation.rawInput)[0];
				if (dir === void 0) return err("/armory-skill-dir <absolute-skill-directory>");
				try {
					const name = await sb.installSkillFromDir(dir);
					return ok(`installed skill "${name}" from ${dir} — now invocable via /${name}`);
				} catch (error) {
					return err(`could not install skill dir ${dir}: ${error instanceof Error ? error.message : String(error)}`);
				}
			}
		},
		{
			name: "armory-install-zip",
			description: "Switchblade: install skills from a .zip archive into ~/.dsh/skills",
			handler: async (invocation) => {
				const zip = tokens(invocation.rawInput)[0];
				if (zip === void 0) return err("/armory-install-zip <absolute-path-to-skill.zip>");
				try {
					const installed = await sb.installSkillFromZip(zip);
					if (installed.length === 0) return err("zip contained no entries");
					return ok(`installed from ${zip}: ${installed.join(", ")} — now invocable via /<name>`);
				} catch (error) {
					return err(`could not install zip ${zip}: ${error instanceof Error ? error.message : String(error)}`);
				}
			}
		}
	];
	for (const definition of commands) {
		ctx.commands.register(definition);
		if (definition.name.startsWith("armory")) {
			const legacy = definition.name === "armory" ? "sw" : `sw-${definition.name.slice(7)}`;
			ctx.commands.register({
				...definition,
				name: legacy
			});
		}
	}
}
//#endregion
//#region src/invariant.ts
/** All three managed kinds in canonical order. */
const MANAGED_KINDS = [
	"skill",
	"profile",
	"command"
];
/** Prefix used to namespaced-entry `id`s at the action seam. */
const ID_PREFIX = {
	skill: "skill",
	profile: "profile",
	command: "command"
};
/**
* Return whether a string looks like a stable Switchblade entry id
* (`skill:<kebab>`, `profile:<id>`, `command:<name>`).
* @param value - candidate entry id.
* @returns whether the id is split into a known kind prefix and a non-empty tail.
*/
function isEntryId(value) {
	const slash = value.indexOf(":");
	if (slash <= 0 || slash === value.length - 1) return false;
	const kind = value.slice(0, slash);
	return MANAGED_KINDS.includes(kind);
}
/**
* Return whether a candidate install name is a safe runtime skill name.
* @param name - candidate skill name.
* @returns whether it satisfies the public skill-name grammar (kebab-case).
*/
function isInstallSkillName(name) {
	return /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(name);
}
/**
* Return whether a kebab or underscore command name is a safe slash command.
* @param name - candidate command name without a leading slash.
* @returns whether it satisfies the command grammar.
*/
function isCommandName(name) {
	return /^[a-z][a-z0-9_-]*$/u.test(name);
}
//#endregion
//#region src/patch.ts
/** Prefix each patch row carries so an importer can find its own rows. */
const SWITCHBLADE_ROW = "switchblade";
const AGENT_PRESETS_ROW = "agent-presets";
/**
* Render the current Switchblade state as a `cordis.patch.yml` bundle layer.
* @param patch - state to persist into the patch.
* @returns YAML text ready to drop into a profile bundle's `cordis.patch.yml`.
*/
function renderPatch(patch) {
	const lines = ["# Generated by @deepseek-ai/dsh-switchblade export — re-instates the", "# managed skills, custom commands, and default profile on this profile."];
	lines.push("", "- insert:");
	lines.push(...renderRow(SWITCHBLADE_ROW, "@deepseek-ai/dsh-switchblade", {
		installedSkills: patch.installedSkills.map((skill) => ({
			name: skill.name,
			content: skill.content,
			description: skill.description,
			invocation: skill.invocation
		})),
		customCommands: patch.customCommands.map((command) => ({
			name: command.name,
			description: command.description,
			handlerBehavior: "passthrough"
		}))
	}));
	if (patch.defaultProfile !== void 0) lines.push(...renderRow(AGENT_PRESETS_ROW, "@deepseek-ai/dsh-agent-presets", { default: patch.defaultProfile }));
	return `${lines.join("\n")}\n`;
}
/** Render one `- insert:` row as indented YAML lines. */
function renderRow(id, name, config) {
	const out = [
		`    - id: ${id}`,
		`      name: '${name}'`,
		"      config:"
	];
	out.push(...renderValue(config, 8));
	return out;
}
/** Render a JSON-compatible value as indented YAML. Arrays of objects emit `- key:` items. */
function renderValue(value, indent) {
	const pad = " ".repeat(indent);
	if (Array.isArray(value)) {
		const out = [];
		for (const entry of value) if (Array.isArray(entry) || typeof entry === "object" && entry !== null) out.push(...renderObject(entry, indent, true));
		else out.push(`${pad}- ${scalar(entry)}`);
		return out;
	}
	if (typeof value === "object" && value !== null) return renderObject(value, indent, false);
	return [`${pad}${scalar(value)}`];
}
/** Render an object; when `dash` is true the first key carries the `- ` list marker. */
function renderObject(obj, indent, dash) {
	const pad = " ".repeat(indent);
	const out = [];
	const entries = Object.entries(obj);
	for (let index = 0; index < entries.length; index += 1) {
		const entry = entries[index];
		if (entry === void 0) continue;
		const [key, val] = entry;
		const prefix = index === 0 && dash ? `${pad}- ` : pad;
		if (typeof val === "object" && val !== null) {
			out.push(`${prefix}${key}:`);
			out.push(...renderValue(val, indent + (index === 0 && dash ? 4 : 2)));
		} else out.push(`${prefix}${key}: ${scalar(val)}`);
	}
	return out;
}
/** Render a scalar leaf, quoting strings for YAML safety. */
function scalar(value) {
	if (typeof value === "string") return JSON.stringify(value);
	if (value === void 0) return "null";
	return String(value);
}
/**
* Best-effort parse of the rows this exporter writes. Rows it does not
* recognize are ignored, so an external patch may carry other plugins.
* @param text - a `cordis.patch.yml` document.
* @returns the switchblade-owned rows found in it.
*/
function parsePatch(text) {
	let installedSkills = [];
	let customCommands = [];
	let defaultProfile;
	const lines = text.split(/\r?\n/);
	let inInsert = false;
	let currentRow;
	let currentArray;
	let currentItem;
	let pendingItems = [];
	const flush = () => {
		if (currentItem !== void 0) pendingItems.push(currentItem);
		currentItem = void 0;
		if (currentArray === "installedSkills") installedSkills = pendingItems.map((item) => ({
			name: item.name ?? "",
			content: item.content ?? "",
			description: item.description ?? "",
			invocation: {
				modelInvocable: true,
				userInvocable: true
			},
			provider: "runtime",
			source: "custom"
		}));
		else if (currentArray === "customCommands") customCommands = pendingItems.map((item) => ({
			name: item.name ?? "",
			description: item.description ?? "",
			handler: () => ({
				kind: "success",
				text: ""
			})
		}));
		pendingItems = [];
	};
	for (const raw of lines) {
		const line = raw.trim();
		if (/^- insert:/.test(line)) {
			inInsert = true;
			continue;
		}
		if (!inInsert) continue;
		const idMatch = /^- id:\s*(.+)$/.exec(line);
		if (idMatch !== null) {
			flush();
			currentArray = void 0;
			currentRow = idMatch[1];
			continue;
		}
		if (currentRow === void 0) continue;
		if (line.startsWith("config:")) {
			flush();
			currentArray = void 0;
			const inline = /^config:\s*\{([^}]*)\}\s*$/.exec(raw.trim());
			if (inline !== null) {
				const body = inline[1] ?? "";
				const def = /default:\s*["']?([^"',}]+)["']?/.exec(body);
				if (def !== null) defaultProfile = def[1] ?? def[0];
			}
			continue;
		}
		if (currentRow === AGENT_PRESETS_ROW) {
			const def = /^default:\s*["']?([^"']+)["']?$/.exec(line);
			if (def !== null) defaultProfile = dequote(def[1] ?? "");
		}
		const arrayMatch = /^installedSkills:|^customCommands:/.exec(line);
		if (arrayMatch !== null) {
			flush();
			currentArray = arrayMatch[0].replace(":", "");
			continue;
		}
		if (currentArray !== void 0) {
			const itemStart = /^-\s+(\w+):\s*(.*)$/.exec(line);
			if (itemStart !== null) {
				flush();
				const key = itemStart[1];
				const rawValue = itemStart[2];
				if (key !== void 0 && rawValue !== void 0) currentItem = { [key]: dequote(rawValue) };
				continue;
			}
			const field = /^(\w+):\s*(.*)$/.exec(line);
			if (field !== null && currentItem !== void 0) {
				const key = field[1];
				const rawValue = field[2];
				if (key !== void 0 && rawValue !== void 0) {
					if (key === "name" || key === "content" || key === "description") currentItem[key] = dequote(rawValue);
				}
			}
		}
	}
	flush();
	return {
		installedSkills,
		customCommands,
		...defaultProfile === void 0 ? {} : { defaultProfile }
	};
}
/** Strip surrounding quotes from a scalar produced by this exporter. */
function dequote(raw) {
	const value = raw.trim();
	if (value.length >= 2 && value.startsWith("\"") && value.endsWith("\"")) return value.slice(1, -1).replaceAll("\\\"", "\"");
	if (value.length >= 2 && value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1);
	return value;
}
//#endregion
//#region src/conversations.ts
/**
* Conversation import/export for Armory.
*
* DSH persists each conversation as `~/.dsh/sessions/<projectKey>/<sessionId>/session.jsonl.zstd`
* (the projectKey is a path-encoded form like `--C-Users-17526--`), with media
* attachments under `~/.dsh/attachments/v1` and workspace context under
* `~/.dsh/storages/workspace.json`. Export bundles those files verbatim (no
* zstd re-compression — the bytes are already portable), and import restores
* them so the conversation looks identical on another machine.
*
* Archive format: a ZIP containing:
*   manifest.json         { format:1, exportedAt, projectKeys[] }
*   sessions/<key>/<id>/session.jsonl.zstd
*   attachments/…         (optional)
*   storages/workspace.json (optional)
*
* Uses Windows PowerShell Compress-Archive / Expand-Archive (no heavy npm deps;
* the host already runs on Windows here).
*/
const exec = promisify(execFile);
const HOME = join(homedir(), ".dsh");
const SESSIONS_ROOT = join(HOME, "sessions");
const ATTACHMENTS_ROOT = join(HOME, "attachments");
const STORAGES_ROOT = join(HOME, "storages");
const EXPORT_ROOT = join(HOME, "armory-exports");
const PREFIX = "/api/armory";
function json(res, status, body) {
	res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
	res.end(JSON.stringify(body));
}
const LOOPBACK = /* @__PURE__ */ new Set([
	"127.0.0.1",
	"localhost",
	"[::1]",
	"::1"
]);
function sameOrigin(req) {
	if (req.headers["sec-fetch-site"] === "cross-site") return false;
	const host = req.headers.host ?? "";
	let bare = host;
	if (bare.startsWith("[")) {
		const e = bare.indexOf("]");
		if (e !== -1) bare = bare.slice(0, e + 1);
	} else {
		const c = bare.indexOf(":");
		if (c !== -1) bare = bare.slice(0, c);
	}
	return LOOPBACK.has(bare) || LOOPBACK.has(host);
}
function readBody(req, limit) {
	return new Promise((resolve, reject) => {
		const chunks = [];
		let size = 0;
		req.on("data", (c) => {
			size += c.length;
			if (size > limit) {
				req.pause();
				reject(/* @__PURE__ */ new Error("body-too-large"));
				return;
			}
			chunks.push(c);
		});
		req.on("end", () => resolve(Buffer.concat(chunks)));
		req.on("error", reject);
	});
}
function readJson(req) {
	return readBody(req, 1024 * 1024).then((b) => JSON.parse(b.toString("utf8") || "{}"));
}
async function ps(cmd) {
	await exec("powershell.exe", [
		"-NoProfile",
		"-Command",
		cmd
	]);
}
/** Read the session title / project map from the DSH session project cache. */
async function readTitleIndex() {
	const out = /* @__PURE__ */ new Map();
	try {
		const sessions = JSON.parse(await readFile(join(STORAGES_ROOT, "session_projcache.json"), "utf8")).tables?.sessions ?? {};
		for (const [id, v] of Object.entries(sessions)) {
			const title = typeof v.rows?.title?.val === "string" ? v.rows.title.val : "";
			const cwd = typeof v.identity?.cwd === "string" ? v.identity.cwd : "";
			out.set(id, {
				title,
				cwd
			});
		}
	} catch {}
	return out;
}
/** Read the full workspace registry (`~/.dsh/storages/workspace.json`). */
async function readWorkspaceRegistry() {
	try {
		return JSON.parse(await readFile(join(STORAGES_ROOT, "workspace.json"), "utf8")).tables?.workspaces ?? {};
	} catch {
		return {};
	}
}
/** Read the full session identity map (createdAt + cwd) from the projcache. */
async function readSessionIdentities() {
	const out = /* @__PURE__ */ new Map();
	try {
		const sessions = JSON.parse(await readFile(join(STORAGES_ROOT, "session_projcache.json"), "utf8")).tables?.sessions ?? {};
		for (const [id, v] of Object.entries(sessions)) out.set(id, {
			createdAt: typeof v.identity?.createdAt === "number" ? v.identity.createdAt : void 0,
			cwd: typeof v.identity?.cwd === "string" ? v.identity.cwd : void 0
		});
	} catch {}
	return out;
}
const ZSTD_MAGIC = [
	40,
	181,
	47,
	253
];
/** Decompress the first few zstd frames of a session log (the title lives early). */
async function readSessionHead(sdir, maxFrames) {
	try {
		const buf = await readFile(join(sdir, "session.jsonl.zstd"));
		const starts = [];
		for (let i = 0; i + 4 <= buf.length && starts.length < maxFrames; i++) if (buf[i] === ZSTD_MAGIC[0] && buf[i + 1] === ZSTD_MAGIC[1] && buf[i + 2] === ZSTD_MAGIC[2] && buf[i + 3] === ZSTD_MAGIC[3]) starts.push(i);
		let text = "";
		for (let f = 0; f < starts.length; f++) {
			const from = starts[f];
			const to = f + 1 < starts.length ? starts[f + 1] : buf.length;
			try {
				text += zstdDecompressSync(buf.subarray(from, to)).toString("utf8");
			} catch {}
			if (text.length > 65536) break;
		}
		return text;
	} catch {
		return "";
	}
}
function firstUserText(head) {
	const lines = head.split("\n");
	for (const line of lines) {
		let o;
		try {
			o = JSON.parse(line);
		} catch {
			continue;
		}
		if (o === void 0 || o.type === void 0) continue;
		if (o.type === "session/title" && typeof o.data?.title === "string" && o.data.title.trim() !== "") return o.data.title.trim().slice(0, 60);
		if (o.type === "user/message" && o.data?.source?.kind === "user") {
			let txt = "";
			if (typeof o.data.text === "string") txt = o.data.text;
			else if (typeof o.data.content === "string") txt = o.data.content;
			else if (Array.isArray(o.data.content)) txt = o.data.content.map((c) => c && typeof c === "object" && "text" in c ? String(c.text ?? "") : "").join(" ");
			const clean = txt.replace(/\s+/g, " ").trim();
			if (clean !== "") return clean.slice(0, 60);
		}
	}
	return "";
}
async function listConversations() {
	const titles = await readTitleIndex();
	const out = [];
	const projects = await readdir(SESSIONS_ROOT).catch(() => []);
	for (const projectKey of projects) {
		const pdir = join(SESSIONS_ROOT, projectKey);
		const ps = await stat(pdir).catch(() => void 0);
		if (ps === void 0 || !ps.isDirectory()) continue;
		const sessions = await readdir(pdir).catch(() => []);
		for (const sessionId of sessions) {
			const sdir = join(pdir, sessionId);
			const ss = await stat(sdir).catch(() => void 0);
			if (ss === void 0 || !ss.isDirectory() || !sessionId.startsWith("session-")) continue;
			const fs = await stat(join(sdir, "session.jsonl.zstd")).catch(() => void 0);
			const meta = titles.get(sessionId);
			let title = meta?.title ?? "";
			if (title === "") title = firstUserText(await readSessionHead(sdir, 80));
			out.push({
				projectKey,
				sessionId,
				title,
				cwd: meta?.cwd ?? "",
				mtime: ss.mtimeMs,
				size: fs?.size ?? 0
			});
		}
	}
	return out.sort((a, b) => b.mtime - a.mtime);
}
function validName(name) {
	return /^[a-zA-Z0-9._-]+$/.test(name);
}
/** Local-timezone `YYYY-MM-DD` for a millisecond instant (avoids UTC shift). */
function localDate(ms) {
	const d = new Date(ms);
	const p = (n) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
/** Simple default pricing (USD per 1M tokens); mirrors common API pricing. */
const PRICING = {
	inputPerM: .3,
	outputPerM: 1.2,
	cacheReadPerM: .03,
	cacheWritePerM: .6
};
function costOf(t) {
	return t.uncachedInputTokens / 1e6 * PRICING.inputPerM + t.outputTokens / 1e6 * PRICING.outputPerM + t.cacheReadTokens / 1e6 * PRICING.cacheReadPerM + t.cacheWriteTokens / 1e6 * PRICING.cacheWritePerM;
}
function hitRateOf(t) {
	const total = t.uncachedInputTokens + t.cacheReadTokens + t.cacheWriteTokens;
	return total > 0 ? t.cacheReadTokens / total : 0;
}
/** Resolve a time-range cutoff (ms epoch) for the `range` query param. */
function rangeCutoff(range) {
	const now = Date.now();
	switch (range) {
		case "today": {
			const d = /* @__PURE__ */ new Date();
			d.setHours(0, 0, 0, 0);
			return d.getTime();
		}
		case "7d": return now - 7 * 864e5;
		case "30d": return now - 30 * 864e5;
		default: return 0;
	}
}
const zeroTokens = () => ({
	uncachedInputTokens: 0,
	outputTokens: 0,
	cacheReadTokens: 0,
	cacheWriteTokens: 0
});
async function collectStats(range = "all") {
	const cutoff = rangeCutoff(range);
	const byDay = /* @__PURE__ */ new Map();
	const byProject = /* @__PURE__ */ new Map();
	const byModel = /* @__PURE__ */ new Map();
	const recent = [];
	const byHour = /* @__PURE__ */ new Map();
	const totals = {
		sessions: 0,
		turns: 0,
		steps: 0,
		llmMs: 0,
		toolMs: 0,
		inputTokens: 0,
		outputTokens: 0,
		cacheReadTokens: 0,
		cacheWriteTokens: 0,
		ttftMs: 0,
		ttftSteps: 0,
		decodeMs: 0,
		costUsd: 0
	};
	try {
		const rows = JSON.parse(await readFile(join(STORAGES_ROOT, "session_projcache.json"), "utf8")).tables?.sessions ?? {};
		for (const [id, v] of Object.entries(rows)) {
			const sv = v.rows?.sessionStats?.val;
			if (sv === void 0 || (sv.steps ?? 0) === 0) continue;
			const created = v.identity?.createdAt ?? 0;
			const active = typeof v.rows?.sessionListMetadata?.val?.lastPromptAt === "number" && v.rows.sessionListMetadata.val.lastPromptAt > 0 ? v.rows.sessionListMetadata.val.lastPromptAt : created;
			if (active < cutoff) continue;
			const t = v.rows?.tokenUsage?.val?.totals ?? zeroTokens();
			const turns = sv.turns ?? 0;
			const steps = sv.steps ?? 0;
			const llmMs = sv.llmMs ?? 0;
			const toolMs = sv.toolMs ?? 0;
			const ttftMs = sv.ttftMs ?? 0;
			const ttftSteps = sv.ttftSteps ?? 0;
			const decodeMs = sv.decodeMs ?? 0;
			const cost = costOf(t);
			totals.sessions++;
			totals.turns += turns;
			totals.steps += steps;
			totals.llmMs += llmMs;
			totals.toolMs += toolMs;
			totals.inputTokens += t.uncachedInputTokens;
			totals.outputTokens += t.outputTokens;
			totals.cacheReadTokens += t.cacheReadTokens;
			totals.cacheWriteTokens += t.cacheWriteTokens;
			totals.ttftMs += ttftMs;
			totals.ttftSteps += ttftSteps;
			totals.decodeMs += decodeMs;
			totals.costUsd += cost;
			const date = active > 0 ? localDate(active) : "未知";
			const d = byDay.get(date) ?? {
				date,
				sessions: 0,
				turns: 0,
				steps: 0,
				llmMs: 0,
				toolMs: 0,
				inputTokens: 0,
				outputTokens: 0,
				cacheReadTokens: 0,
				cacheWriteTokens: 0
			};
			d.sessions++;
			d.turns += turns;
			d.steps += steps;
			d.llmMs += llmMs;
			d.toolMs += toolMs;
			d.inputTokens += t.uncachedInputTokens;
			d.outputTokens += t.outputTokens;
			d.cacheReadTokens += t.cacheReadTokens;
			d.cacheWriteTokens += t.cacheWriteTokens;
			byDay.set(date, d);
			const hour = active > 0 ? new Date(active).getHours() : 0;
			const hb = byHour.get(hour) ?? {
				hour,
				steps: 0,
				outputTokens: 0,
				inputTokens: 0,
				cacheReadTokens: 0,
				cacheWriteTokens: 0
			};
			hb.steps += steps;
			hb.outputTokens += t.outputTokens;
			hb.inputTokens += t.uncachedInputTokens;
			hb.cacheReadTokens += t.cacheReadTokens;
			hb.cacheWriteTokens += t.cacheWriteTokens;
			byHour.set(hour, hb);
			const cwd = v.identity?.cwd ?? "";
			const project = cwd.split(/[\\/]/).filter(Boolean).pop() || cwd || "未知";
			const pr = byProject.get(project) ?? {
				project,
				sessions: 0,
				steps: 0,
				llmMs: 0,
				toolMs: 0,
				inputTokens: 0,
				outputTokens: 0,
				cacheReadTokens: 0,
				cacheWriteTokens: 0,
				costUsd: 0
			};
			pr.sessions++;
			pr.steps += steps;
			pr.llmMs += llmMs;
			pr.toolMs += toolMs;
			pr.inputTokens += t.uncachedInputTokens;
			pr.outputTokens += t.outputTokens;
			pr.cacheReadTokens += t.cacheReadTokens;
			pr.cacheWriteTokens += t.cacheWriteTokens;
			pr.costUsd += cost;
			byProject.set(project, pr);
			const model = v.rows?.title?.val && v.rows.title.val.startsWith("model:") ? v.rows.title.val.slice(6) : "default";
			const mo = byModel.get(model) ?? {
				model,
				sessions: 0,
				steps: 0,
				inputTokens: 0,
				outputTokens: 0,
				costUsd: 0,
				cacheReadTokens: 0,
				cacheWriteTokens: 0
			};
			mo.sessions++;
			mo.steps += steps;
			mo.inputTokens += t.uncachedInputTokens;
			mo.outputTokens += t.outputTokens;
			mo.costUsd += cost;
			mo.cacheReadTokens += t.cacheReadTokens;
			mo.cacheWriteTokens += t.cacheWriteTokens;
			byModel.set(model, mo);
			recent.push({
				time: active,
				provider: project,
				model,
				inputTokens: t.uncachedInputTokens,
				outputTokens: t.outputTokens,
				cacheReadTokens: t.cacheReadTokens,
				cacheWriteTokens: t.cacheWriteTokens,
				cacheHitRate: hitRateOf(t),
				costUsd: cost,
				latencyMs: llmMs,
				firstTokenMs: ttftSteps > 0 ? ttftMs / ttftSteps : 0,
				status: sv.openStep === null ? "done" : "running",
				source: "dsh"
			});
		}
	} catch {}
	const totalTokensAll = totals.inputTokens + totals.outputTokens + totals.cacheReadTokens + totals.cacheWriteTokens;
	const cacheHitRate = totalTokensAll > 0 ? totals.cacheReadTokens / totalTokensAll : 0;
	const avgTtftMs = totals.ttftSteps > 0 ? totals.ttftMs / totals.ttftSteps : 0;
	const tokPerSec = totals.decodeMs > 0 ? totals.outputTokens / (totals.decodeMs / 1e3) : 0;
	const perSessionSteps = totals.sessions > 0 ? totals.steps / totals.sessions : 0;
	return {
		range,
		totals: {
			...totals,
			avgTtftMs,
			tokPerSec,
			perSessionSteps,
			activeDays: byDay.size,
			cacheHitRate
		},
		byDay: [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date)),
		byHour: range === "today" ? Array.from({ length: 24 }, (_, h) => byHour.get(h) ?? {
			hour: h,
			steps: 0,
			outputTokens: 0,
			inputTokens: 0,
			cacheReadTokens: 0,
			cacheWriteTokens: 0
		}) : [],
		byProject: [...byProject.values()].map((p) => ({
			...p,
			successRate: 100,
			avgLatencyMs: p.steps > 0 ? p.llmMs / p.steps : 0,
			cacheHitRate: p.inputTokens + p.cacheReadTokens + p.cacheWriteTokens > 0 ? p.cacheReadTokens / (p.inputTokens + p.cacheReadTokens + p.cacheWriteTokens) : 0
		})).sort((a, b) => b.steps - a.steps),
		byModel: [...byModel.values()].map((m) => ({
			...m,
			cacheHitRate: m.inputTokens + m.cacheReadTokens + m.cacheWriteTokens > 0 ? m.cacheReadTokens / (m.inputTokens + m.cacheReadTokens + m.cacheWriteTokens) : 0
		})).sort((a, b) => b.steps - a.steps),
		recent: recent.sort((a, b) => b.time - a.time).slice(0, 30)
	};
}
/** Resolve a conversation id of the form `<projectKey>/<sessionId>`. */
function resolveSession(key, id) {
	if (!/^[a-zA-Z0-9._-]+$/.test(key) || !/^session-[a-f0-9-]+$/.test(id)) return void 0;
	const dir = join(SESSIONS_ROOT, key, id);
	return existsSync(join(dir, "session.jsonl.zstd")) ? dir : void 0;
}
/** Delete one or more conversations: remove the session dir + the index entry. */
async function deleteConversations(ids) {
	let count = 0;
	for (const full of ids) {
		const slash = full.indexOf("/");
		if (slash <= 0) continue;
		const dir = resolveSession(full.slice(0, slash), full.slice(slash + 1));
		if (dir === void 0) continue;
		await rm(dir, {
			recursive: true,
			force: true
		});
		count++;
	}
	try {
		const indexPath = join(STORAGES_ROOT, "session_projcache.json");
		const raw = JSON.parse(await readFile(indexPath, "utf8"));
		const sessions = raw.tables?.sessions;
		if (sessions !== void 0) {
			let changed = false;
			for (const full of ids) {
				const id = full.slice(full.indexOf("/") + 1);
				if (id in sessions) {
					delete sessions[id];
					changed = true;
				}
			}
			if (changed) await writeFile(indexPath, JSON.stringify(raw, null, 2));
		}
	} catch {}
	return count;
}
async function buildExport(ids, projectKey, includeAttachments, includeWorkspace) {
	await mkdir(EXPORT_ROOT, { recursive: true });
	const tmp = join(EXPORT_ROOT, "staging-" + randomBytes(6).toString("hex"));
	const zip = join(EXPORT_ROOT, `armory-chat-${Date.now()}.zip`);
	await mkdir(tmp, { recursive: true });
	const picked = [];
	if (projectKey !== void 0 && projectKey !== "") {
		const pdir = join(SESSIONS_ROOT, projectKey);
		const sessions = await readdir(pdir).catch(() => []);
		for (const id of sessions) {
			if (!id.startsWith("session-")) continue;
			const s = await stat(join(pdir, id)).catch(() => void 0);
			if (s !== void 0 && s.isDirectory()) picked.push({
				key: projectKey,
				id
			});
		}
	} else for (const full of ids) {
		const slash = full.indexOf("/");
		if (slash <= 0) continue;
		picked.push({
			key: full.slice(0, slash),
			id: full.slice(slash + 1)
		});
	}
	const projectKeys = /* @__PURE__ */ new Set();
	const exportedIds = [];
	for (const { key, id } of picked) {
		const src = resolveSession(key, id);
		if (src === void 0) continue;
		const dst = join(tmp, "sessions", key, id);
		await mkdir(dst, { recursive: true });
		await cp(src, dst, { recursive: true });
		projectKeys.add(key);
		exportedIds.push(id);
	}
	const registry = await readWorkspaceRegistry();
	const identities = await readSessionIdentities();
	const titles = await readTitleIndex();
	const idSet = new Set(exportedIds);
	const workspaces = {};
	for (const [wid, rec] of Object.entries(registry)) if (rec.sessionIds.some((sid) => idSet.has(sid))) workspaces[wid] = rec;
	const sessions = {};
	for (const id of exportedIds) {
		const ident = identities.get(id);
		sessions[id] = {
			createdAt: ident?.createdAt,
			cwd: ident?.cwd,
			title: titles.get(id)?.title
		};
	}
	await writeFile(join(tmp, "manifest.json"), JSON.stringify({
		format: 2,
		exportedAt: Date.now(),
		projectKeys: [...projectKeys],
		workspaces,
		sessions
	}, null, 2));
	await ps(`Compress-Archive -Path "${join(tmp, "*")}" -DestinationPath "${zip}" -Force`);
	await rm(tmp, {
		recursive: true,
		force: true
	});
	return {
		zipPath: zip,
		name: basename(zip)
	};
}
/** Merge the exported workspaces into the local registry, returning how many were created/updated. */
async function mergeWorkspaceRegistry(manifest) {
	const indexPath = join(STORAGES_ROOT, "workspace.json");
	const raw = JSON.parse(await readFile(indexPath, "utf8").catch(() => "{}"));
	const tables = raw.tables ?? {};
	const workspaces = tables.workspaces ?? {};
	const ids = raw.global?.workspaceIds ?? [];
	let changed = false;
	for (const [wid, rec] of Object.entries(manifest.workspaces ?? {})) {
		let existingId;
		for (const [id, w] of Object.entries(workspaces)) if (w.path === rec.path) {
			existingId = id;
			break;
		}
		const targetId = existingId ?? wid;
		const prior = workspaces[targetId];
		workspaces[targetId] = {
			path: rec.path,
			title: rec.title,
			sessionIds: [.../* @__PURE__ */ new Set([...prior?.sessionIds ?? [], ...rec.sessionIds])],
			createdAt: prior?.createdAt ?? rec.createdAt,
			updatedAt: (/* @__PURE__ */ new Date()).toISOString()
		};
		if (!ids.includes(targetId)) ids.push(targetId);
		changed = true;
	}
	if (changed) {
		raw.tables = {
			...tables,
			workspaces
		};
		raw.global = {
			initialized: true,
			workspaceIds: ids,
			archivedSessionIds: raw.global?.archivedSessionIds ?? []
		};
		await writeFile(indexPath, JSON.stringify(raw, null, 2));
	}
	return changed ? Object.keys(manifest.workspaces ?? {}).length : 0;
}
/** Write session identity + title rows back into the projcache so workspace
* names and titles survive an import (avoids the "未命名" fallback). */
async function mergeSessionCache(manifest) {
	const sessions = manifest.sessions ?? {};
	if (Object.keys(sessions).length === 0) return;
	const indexPath = join(STORAGES_ROOT, "session_projcache.json");
	const raw = JSON.parse(await readFile(indexPath, "utf8").catch(() => "{}"));
	const tables = raw.tables ?? {};
	const rows = tables.sessions ?? {};
	let changed = false;
	for (const [sid, meta] of Object.entries(sessions)) {
		const row = rows[sid] ?? {};
		const identity = row.identity ?? {};
		if (meta.createdAt !== void 0 && identity.createdAt === void 0) {
			identity.createdAt = meta.createdAt;
			changed = true;
		}
		if (meta.cwd !== void 0 && meta.cwd !== "" && identity.cwd === void 0) {
			identity.cwd = meta.cwd;
			changed = true;
		}
		const r = row.rows ?? {};
		if (meta.title !== void 0 && meta.title !== "" && (r.title?.val ?? "") === "") {
			r.title = { val: meta.title };
			changed = true;
		}
		rows[sid] = {
			identity,
			rows: r
		};
	}
	if (changed) {
		raw.tables = {
			...tables,
			sessions: rows
		};
		await writeFile(indexPath, JSON.stringify(raw, null, 2));
	}
}
async function importArchive(zipPath, targetProjectKey) {
	const tmp = join(EXPORT_ROOT, "import-" + randomBytes(6).toString("hex"));
	await mkdir(tmp, { recursive: true });
	await ps(`Expand-Archive -Path "${zipPath}" -DestinationPath "${tmp}" -Force`);
	let manifest = {};
	try {
		manifest = JSON.parse(await readFile(join(tmp, "manifest.json"), "utf8"));
	} catch {}
	const sessionsDir = join(tmp, "sessions");
	let count = 0;
	if (existsSync(sessionsDir)) {
		const keys = await readdir(sessionsDir);
		for (const key of keys) {
			const destKey = targetProjectKey !== void 0 && targetProjectKey !== "" ? targetProjectKey : key;
			if (!/^[a-zA-Z0-9._-]+$/.test(destKey)) continue;
			const srcDir = join(sessionsDir, key);
			const dstDir = join(SESSIONS_ROOT, destKey);
			await mkdir(dstDir, { recursive: true });
			const sessions = await readdir(srcDir);
			for (const id of sessions) {
				const s = await stat(join(srcDir, id)).catch(() => void 0);
				if (s === void 0 || !s.isDirectory()) continue;
				await cp(join(srcDir, id), join(dstDir, id), { recursive: true });
				count++;
			}
		}
	}
	const att = join(tmp, "attachments");
	if (existsSync(att)) {
		await mkdir(ATTACHMENTS_ROOT, { recursive: true });
		await cp(att, ATTACHMENTS_ROOT, { recursive: true });
	}
	if (manifest.format !== void 0 && manifest.format >= 2) {
		try {
			await mergeWorkspaceRegistry(manifest);
		} catch {}
		try {
			await mergeSessionCache(manifest);
		} catch {}
	}
	await rm(tmp, {
		recursive: true,
		force: true
	});
	return count;
}
function makeConversationRoutes() {
	return [
		{
			kind: "exact",
			path: `${PREFIX}/stats`,
			handler: async (req, res) => {
				if (!sameOrigin(req)) {
					json(res, 403, {
						ok: false,
						error: "rejected"
					});
					return;
				}
				if (req.method !== "GET") {
					json(res, 405, { ok: false });
					return;
				}
				json(res, 200, {
					ok: true,
					...await collectStats(new URL(req.url ?? "/", "http://localhost").searchParams.get("range") ?? "all")
				});
			}
		},
		{
			kind: "exact",
			path: `${PREFIX}/sessions`,
			handler: async (req, res) => {
				if (!sameOrigin(req)) {
					json(res, 403, {
						ok: false,
						error: "rejected"
					});
					return;
				}
				if (req.method !== "GET") {
					json(res, 405, { ok: false });
					return;
				}
				json(res, 200, {
					ok: true,
					sessions: await listConversations()
				});
			}
		},
		{
			kind: "exact",
			path: `${PREFIX}/export`,
			handler: async (req, res) => {
				if (!sameOrigin(req)) {
					json(res, 403, {
						ok: false,
						error: "rejected"
					});
					return;
				}
				if (req.method !== "POST") {
					json(res, 405, { ok: false });
					return;
				}
				try {
					const body = await readJson(req);
					const ids = Array.isArray(body.sessionIds) ? body.sessionIds.filter((x) => typeof x === "string") : [];
					const projectKey = typeof body.projectKey === "string" && body.projectKey !== "" ? body.projectKey : void 0;
					const includeAttachments = body.includeAttachments !== false;
					const includeWorkspace = body.includeWorkspace !== false;
					if (projectKey === void 0 && ids.length === 0) {
						json(res, 400, {
							ok: false,
							error: "empty export"
						});
						return;
					}
					json(res, 200, {
						ok: true,
						name: (await buildExport(ids, projectKey, includeAttachments, includeWorkspace)).name
					});
				} catch (e) {
					json(res, 400, {
						ok: false,
						error: e instanceof Error ? e.message : String(e)
					});
				}
			}
		},
		{
			kind: "prefix",
			path: `${PREFIX}/export`,
			handler: async (req, res) => {
				if (!sameOrigin(req)) {
					json(res, 403, {
						ok: false,
						error: "rejected"
					});
					return;
				}
				if (req.method !== "GET") {
					json(res, 405, { ok: false });
					return;
				}
				const name = (req.url ?? "").slice(`${PREFIX}/export`.length + 1);
				if (!validName(name)) {
					json(res, 404, { ok: false });
					return;
				}
				const file = join(EXPORT_ROOT, name);
				if (!existsSync(file)) {
					json(res, 404, { ok: false });
					return;
				}
				res.writeHead(200, {
					"content-type": "application/zip",
					"content-disposition": `attachment; filename="${name}"`
				});
				res.end(await readFile(file));
			}
		},
		{
			kind: "exact",
			path: `${PREFIX}/version`,
			handler: async (req, res) => {
				if (!sameOrigin(req)) {
					json(res, 403, {
						ok: false,
						error: "rejected"
					});
					return;
				}
				if (req.method !== "GET") {
					json(res, 405, { ok: false });
					return;
				}
				try {
					json(res, 200, {
						ok: true,
						latest: (await (await fetch("https://registry.npmjs.org/prompt-skill-armory/latest")).json()).version ?? ""
					});
				} catch {
					json(res, 200, {
						ok: true,
						latest: ""
					});
				}
			}
		},
		{
			kind: "exact",
			path: `${PREFIX}/update`,
			handler: async (req, res) => {
				if (!sameOrigin(req)) {
					json(res, 403, {
						ok: false,
						error: "rejected"
					});
					return;
				}
				if (req.method !== "POST") {
					json(res, 405, { ok: false });
					return;
				}
				try {
					const { stdout, stderr } = await exec("npm.cmd", [
						"exec",
						"--yes",
						"--package=prompt-skill-armory",
						"--",
						"armory"
					], {
						timeout: 3e5,
						windowsHide: true,
						maxBuffer: 16 * 1024 * 1024,
						shell: true
					});
					json(res, 200, {
						ok: true,
						log: (stdout || "").slice(-4e3) + (stderr || "").slice(-2e3)
					});
				} catch (e) {
					json(res, 400, {
						ok: false,
						error: e instanceof Error ? `${e.message}\n${e.stderr ?? ""}`.slice(0, 3e3) : String(e)
					});
				}
			}
		},
		{
			kind: "exact",
			path: `${PREFIX}/delete`,
			handler: async (req, res) => {
				if (!sameOrigin(req)) {
					json(res, 403, {
						ok: false,
						error: "rejected"
					});
					return;
				}
				if (req.method !== "POST") {
					json(res, 405, { ok: false });
					return;
				}
				try {
					const body = await readJson(req);
					json(res, 200, {
						ok: true,
						deleted: await deleteConversations(Array.isArray(body.sessionIds) ? body.sessionIds.filter((x) => typeof x === "string") : [])
					});
				} catch (e) {
					json(res, 400, {
						ok: false,
						error: e instanceof Error ? e.message : String(e)
					});
				}
			}
		},
		{
			kind: "exact",
			path: `${PREFIX}/import`,
			handler: async (req, res) => {
				if (!sameOrigin(req)) {
					json(res, 403, {
						ok: false,
						error: "rejected"
					});
					return;
				}
				if (req.method !== "POST") {
					json(res, 405, { ok: false });
					return;
				}
				try {
					const target = new URL(req.url ?? "/", "http://localhost").searchParams.get("project") ?? void 0;
					const body = await readBody(req, 512 * 1024 * 1024);
					await mkdir(EXPORT_ROOT, { recursive: true });
					const zipPath = join(EXPORT_ROOT, "upload-" + randomBytes(6).toString("hex") + ".zip");
					await writeFile(zipPath, body);
					const count = await importArchive(zipPath, target);
					await rm(zipPath, { force: true });
					json(res, 200, {
						ok: true,
						imported: count
					});
				} catch (e) {
					json(res, 400, {
						ok: false,
						error: e instanceof Error ? e.message : String(e)
					});
				}
			}
		}
	];
}
//#endregion
//#region src/switchblade.ts
/**
* `Switchblade` — the Host-side core of the management surface.
*
* One service reasons about the three CCswitch-style targets through the real
* DSH seams:
*
*  - `ctx.skill` — owner skills are registered as *runtime* skills via
*    `ctx.skills.register()` (each returns a disposer = uninstall), and
*    provider-discovered skills are listed for visibility.
*  - `ctx.agentPresets` — prompt profiles map onto the preset roster
*    (`copy`/`remove`), and the session default lives in the `agent-presets`
*    settings namespace.
*  - `ctx.commands` — custom slash commands register via `ctx.commands.register()`.
*
* State persists through a `switchblade` settings namespace. Public methods are
* `@Remote` so the Web UI projection calls the same Host service over the
* generated Typert RPC.
*
* @module @deepseek-ai/dsh-switchblade
*/
/** Promise-wrapped execFile for the zip extraction helper. */
const execFileAsync = promisify(execFile);
/** Switchblade settings namespace name. */
const SETTINGS_NAMESPACE = "switchblade";
/** Same-origin background API prefix the browser half fetches on startup. */
const BACKGROUND_API_PREFIX = "/api/switchblade-wallpaper";
/** Defaults merged over the stored user section when reading. */
const DEFAULT_BACKGROUND = {
	enabled: false,
	kind: "image",
	uploadId: "",
	url: "",
	opacity: 1,
	scrim: .25,
	panelOpacity: 1,
	blur: 16,
	wallpaperBlur: 0,
	fit: "cover"
};
/** Plugin-owned media dir under the harness home (bytes live on disk, never in settings). */
function wallpaperDir() {
	const dir = join(homedir(), ".dsh", "wallpapers");
	mkdir(dir, { recursive: true }).catch(() => {});
	return dir;
}
const ACCEPTED_MEDIA = {
	"image/jpeg": {
		ext: "jpg",
		kind: "image"
	},
	"image/png": {
		ext: "png",
		kind: "image"
	},
	"image/webp": {
		ext: "webp",
		kind: "image"
	},
	"image/gif": {
		ext: "gif",
		kind: "image"
	},
	"image/svg+xml": {
		ext: "svg",
		kind: "image"
	},
	"video/mp4": {
		ext: "mp4",
		kind: "video"
	},
	"video/webm": {
		ext: "webm",
		kind: "video"
	}
};
/** JSON helper for route responses. */
function jsonResponse(res, status, body) {
	res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
	res.end(JSON.stringify(body));
}
/** Loopback host check for the same-origin fence (see the reference skin plugins). */
const LOOPBACK_HOSTS = /* @__PURE__ */ new Set([
	"127.0.0.1",
	"localhost",
	"[::1]",
	"::1"
]);
function isLoopbackHost(host) {
	let bare = host;
	if (host.startsWith("[")) {
		const end = host.indexOf("]");
		if (end !== -1) bare = host.slice(0, end + 1);
	} else {
		const colon = host.indexOf(":");
		if (colon !== -1) bare = host.slice(0, colon);
	}
	return LOOPBACK_HOSTS.has(bare) || LOOPBACK_HOSTS.has(host);
}
/** Reject cross-site browser requests against the local wallpaper endpoint. */
function isSameOriginRequest(req) {
	if (req.headers["sec-fetch-site"] === "cross-site") return false;
	const host = req.headers.host;
	if (typeof host !== "string" || !isLoopbackHost(host)) return false;
	const origin = req.headers.origin;
	if (typeof origin === "string" && origin !== "" && origin !== "null") try {
		return new URL(origin).host === host;
	} catch {
		return false;
	}
	return true;
}
/** Runtime schema for the persisted slice. */
const SwitchbladeSettingsSchema = z.object({
	installedSkills: z.array(z.any()).default([]),
	customCommands: z.array(z.any()).default([]),
	prompts: z.array(z.any()).default([]),
	mcpServers: z.array(z.any()).default([]),
	mcpStatus: z.dict(z.any()).default({}),
	mcpTestRequest: z.any(),
	background: z.any()
});
/** One prompt section id prefix registered on ctx.systemPrompt. */
const PROMPT_SECTION_PREFIX = "switchblade:prompt:";
/**
* Registry over skills, prompt profiles, and slash commands.
*
* Lifecycle model matches CCswitch: an initialized object is "installed", then
* flipped between "enabled" (registered/visible) and "disabled" (registration
* disposed). Only owned skills — those installed from a local source — change
* the registry; provider-discovered skills are treated as read-only inventory.
*/
var Switchblade = class extends Service {
	config;
	/** Services the plugin reads from ctx; inject-declared so Cordis resolves them. */
	static inject = [
		"loader",
		"skills",
		"systemPrompt"
	];
	/** Registry configuration. */
	static Config = z.object({ defaultProfile: z.string() });
	/** Live enabled registration disposers, keyed by entry id. */
	registrations = /* @__PURE__ */ new Map();
	/** Live disposers for enabled prompt sections, keyed by prompt id. */
	promptSections = /* @__PURE__ */ new Map();
	/** Live mcp-client loader entry ids, keyed by serverName. */
	mcpEntries = /* @__PURE__ */ new Map();
	/** Last startup/connection error per serverName, surfaced in mcpStatus. */
	mcpErrors = /* @__PURE__ */ new Map();
	/** Last processed test-request timestamp per serverName (idempotency guard). */
	lastTestTs = /* @__PURE__ */ new Map();
	/** The settings namespace scope; present only while a settings provider is composed. */
	settingsScope;
	/** The settings service behind {@link settingsScope}, for path writes. */
	settingsService;
	constructor(ctx, config = {}) {
		super(ctx, "switchblade");
		this.config = config;
		ctx.logger.warn("[switchblade] Switchblade service constructed");
		ctx.inject(["settings", "webServer"], (settingsCtx) => {
			const scope = settingsCtx.settings.register(settingsNamespace(SETTINGS_NAMESPACE), SwitchbladeSettingsSchema, { base: {} });
			this.settingsScope = scope;
			this.settingsService = settingsCtx.settings;
			let reconciling = false;
			let scheduled = false;
			const reconcile = () => {
				if (scheduled) return;
				scheduled = true;
				queueMicrotask(() => {
					scheduled = false;
					if (reconciling) return;
					reconciling = true;
					try {
						this.applyPromptRegistrations();
					} catch (e) {
						settingsCtx.logger.warn(`[switchblade] prompt reconcile: ${String(e)}`);
					}
					try {
						this.applySkillRegistrations();
					} catch (e) {
						settingsCtx.logger.warn(`[switchblade] skill reconcile: ${String(e)}`);
					}
					try {
						this.reconcileMcpServers();
					} catch (e) {
						settingsCtx.logger.warn(`[switchblade] mcp reconcile: ${String(e)}`);
					}
					try {
						this.handleMcpTestRequest();
					} catch (e) {
						settingsCtx.logger.warn(`[switchblade] mcp test reconcile: ${String(e)}`);
					}
					try {
						this.publishMcpStatus();
					} catch (e) {
						settingsCtx.logger.warn(`[switchblade] mcp status reconcile: ${String(e)}`);
					}
					reconciling = false;
				});
			};
			scope.watch(reconcile);
			settingsCtx.effect(() => () => {
				this.settingsScope = void 0;
				this.settingsService = void 0;
			}, "switchblade.settings()");
			settingsCtx.logger.warn(`[switchblade] settings registered; prompts=${scope.get().prompts.length} skills=${scope.get().installedSkills.length}`);
			this.reinstall(scope.get());
			try {
				for (const route of [...this.wallpaperRoutes(), ...makeConversationRoutes()]) settingsCtx.effect(() => {
					try {
						settingsCtx.webServer.register(route);
					} catch (e) {
						settingsCtx.logger.warn(`[switchblade] route failed: ${String(e)}`);
					}
				}, "switchblade: bg route");
			} catch (e) {
				settingsCtx.logger.warn(`[switchblade] route setup failed: ${String(e)}`);
			}
		});
	}
	/** All persisted state, merged over schema defaults. */
	settings() {
		return this.settingsScope?.get() ?? {
			installedSkills: [],
			customCommands: [],
			prompts: [],
			mcpServers: [],
			mcpStatus: {}
		};
	}
	/** All managed prompts, sorted (default first, then by order). */
	listPrompts() {
		return [...this.settings().prompts].sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.order - b.order);
	}
	/**
	* Add a new prompt. Persists it, marks it enabled, and injects it into the
	* system prompt (global scope — every agent reads it).
	* @param input - name, description, and content.
	* @returns the created prompt.
	*/
	async addPrompt(input) {
		const name = input.name.trim();
		if (name.length === 0) throw new Error("prompt name is required");
		if (input.content.trim().length === 0) throw new Error("prompt content is required");
		const id = this.slugify(name);
		const prompts = this.settings().prompts;
		if (prompts.some((p) => p.id === id)) throw new Error(`a prompt named "${name}" already exists`);
		const prompt = {
			id,
			name,
			description: input.description.trim(),
			content: input.content,
			order: prompts.length,
			enabled: true,
			isDefault: prompts.length === 0
		};
		await this.writePrompts([...prompts, prompt]);
		this.applyPromptRegistrations();
		return prompt;
	}
	/** Toggle one prompt's global injection. */
	async setPromptEnabled(id, enabled) {
		const next = this.settings().prompts.map((p) => p.id === id ? {
			...p,
			enabled
		} : p);
		await this.writePrompts(next);
		this.applyPromptRegistrations();
	}
	/** Mark one prompt as the default (sorted first); clears the others. */
	async setDefaultPrompt(id) {
		const next = this.settings().prompts.map((p) => ({
			...p,
			isDefault: p.id === id
		}));
		await this.writePrompts(next);
	}
	/** Update a prompt's name/description/content. */
	async updatePrompt(id, patch) {
		const next = this.settings().prompts.map((p) => {
			if (p.id !== id) return p;
			return {
				...p,
				name: patch.name?.trim() || p.name,
				description: patch.description?.trim() ?? p.description,
				content: patch.content ?? p.content
			};
		});
		await this.writePrompts(next);
		this.applyPromptRegistrations();
	}
	/** Delete one prompt and un-inject it. */
	async deletePrompt(id) {
		const next = this.settings().prompts.filter((p) => p.id !== id);
		await this.writePrompts(next);
		this.applyPromptRegistrations();
	}
	/** Persist the prompt list. */
	async writePrompts(prompts) {
		await this.settingsService?.mutate(settingsNamespace(SETTINGS_NAMESPACE), [{
			op: "set",
			path: ["prompts"],
			value: prompts
		}]);
	}
	/**
	* Reconcile live systemPrompt registrations against the persisted prompt
	* list. Directly reads this.ctx.systemPrompt (the plugin's own context can
	* resolve it; no ctx.inject here — that would spawn a fiber inside the
	* settings watch callback and deadlock the commit path). Fully guarded so a
	* bad prompt never wedges settings.
	*/
	applyPromptRegistrations() {
		try {
			const system = this.ctx.systemPrompt;
			if (system === void 0 || typeof system.section !== "function") {
				this.ctx.logger.warn("[switchblade] systemPrompt service unavailable — prompts will NOT be injected");
				return;
			}
			this.ctx.logger.warn(`[switchblade] applying prompt registrations: ${this.listPrompts().filter((p) => p.enabled).length} enabled`);
			const wanted = /* @__PURE__ */ new Set();
			for (const prompt of this.listPrompts()) {
				if (!prompt.enabled) continue;
				wanted.add(prompt.id);
				const key = `${PROMPT_SECTION_PREFIX}${prompt.id}`;
				if (!this.promptSections.has(prompt.id)) try {
					const dispose = system.section({
						name: key,
						order: 200 + prompt.order,
						text: prompt.content
					});
					this.promptSections.set(prompt.id, dispose);
					this.ctx.logger.warn(`[switchblade] registered prompt section ${key} (order ${200 + prompt.order})`);
				} catch (error) {
					this.ctx.logger.warn(`[switchblade] failed to register prompt ${prompt.name}: ${String(error)}`);
				}
			}
			for (const [id, dispose] of [...this.promptSections]) if (!wanted.has(id)) {
				dispose();
				this.promptSections.delete(id);
			}
		} catch (error) {
			this.ctx.logger.warn(`[switchblade] prompt reconcile failed: ${String(error)}`);
		}
	}
	/** Live disposers for enabled prompt sections, keyed by prompt id. */
	/**
	* Reconcile live runtime-skill registrations against the persisted
	* installedSkills list (honoring each skill's `enabled` flag). Called on
	* startup and whenever the settings namespace changes.
	*/
	applySkillRegistrations() {
		try {
			const skills = this.ctx.skills;
			if (skills === void 0 || typeof skills.register !== "function") return;
			const wanted = /* @__PURE__ */ new Set();
			for (const def of this.settings().installedSkills) {
				const id = `${ID_PREFIX.skill}:${def.name}`;
				if (!(def.enabled ?? true)) continue;
				wanted.add(id);
				if (!this.registrations.has(id)) try {
					this.registrations.set(id, skills.register(def));
				} catch (error) {
					this.ctx.logger.warn(`[switchblade] failed to register skill ${def.name}: ${String(error)}`);
				}
			}
			for (const [id, dispose] of [...this.registrations]) if (!wanted.has(id)) {
				dispose();
				this.registrations.delete(id);
			}
		} catch (error) {
			this.ctx.logger.warn(`[switchblade] skill reconcile failed: ${String(error)}`);
		}
	}
	/** Sluggify a display name into a stable id. */
	slugify(value) {
		const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
		return slug.length > 0 ? slug : `prompt-${Date.now()}`;
	}
	/**
	* The full management catalog.
	* @param agent - agent whose command view to read; omitted, the command
	*   section is empty (the CLI handler supplies it).
	* @returns normalized entries and the defaulted profile id.
	*/
	async catalog(agent) {
		const raw = await this.snapshot(agent);
		const entries = [
			...raw.skills.map((skill) => this.ownedSkillEntry(skill)),
			...raw.presets.map((preset) => this.profileEntry(preset)),
			...raw.commands.map((descriptor) => this.commandEntry(descriptor))
		];
		const defaultProfile = this.config.defaultProfile ?? await this.currentProfile();
		return {
			entries,
			...defaultProfile === void 0 ? {} : { defaultProfile }
		};
	}
	/**
	* Install an owned skill from a local source and enable it immediately.
	* @param input - skill name, body, and routing metadata.
	* @returns the addressed id and resulting state.
	*/
	async installSkill(input) {
		if (!isInstallSkillName(input.name)) throw new TypeError(`skill name "${input.name}" must be kebab-case`);
		const id = `${ID_PREFIX.skill}:${input.name}`;
		if (this.registrations.get(id) !== void 0) return {
			id,
			state: "enabled"
		};
		const definition = {
			name: input.name,
			content: input.content,
			description: input.description,
			invocation: input.invocation ?? {
				modelInvocable: true,
				userInvocable: true
			},
			provider: input.provider ?? "runtime",
			source: "custom"
		};
		return {
			id,
			state: await this.setOwnedSkill(id, definition, true)
		};
	}
	/**
	* Install a skill from a local directory (SKILL.md + references, or a flat
	* .md) by copying it into the user skills root (`~/.dsh/skills`), which the
	* official `skill-filesystem` provider scans. This makes directory skills
	* (multi-file, with references) fully loadable and invocable via `/name`.
	* @param sourceDir - absolute path of the skill directory (or .md file).
	* @returns the installed skill name.
	*/
	async installSkillFromDir(sourceDir) {
		const root = join(homedir(), ".dsh", "skills");
		await mkdir(root, { recursive: true });
		const name = basename(sourceDir).replace(/\.md$/i, "");
		const target = join(root, name);
		await cp(sourceDir, target, {
			recursive: true,
			force: true
		});
		this.ctx.logger.warn(`[switchblade] installed skill from dir ${sourceDir} → ${target}`);
		try {
			const { readFile } = await import("node:fs/promises");
			const md = await readFile(join(sourceDir, "SKILL.md"), "utf8").catch(() => void 0) ?? await readFile(sourceDir, "utf8").catch(() => void 0);
			if (md !== void 0) {
				const skillName = parseSkillName(md) ?? name;
				const desc = parseSkillDescription(md) ?? "";
				await this.registerManagedSkill(skillName, desc, md);
			}
		} catch (error) {
			this.ctx.logger.warn(`[switchblade] failed to register dir skill ${name}: ${String(error)}`);
		}
		return name;
	}
	/** Write a flat skill .md into the user skills root. */
	async installSkillFile(name, content) {
		const root = join(homedir(), ".dsh", "skills");
		await mkdir(root, { recursive: true });
		const target = join(root, `${name}.md`);
		await writeFile(target, content, "utf8");
		this.ctx.logger.warn(`[switchblade] wrote skill file ${target}`);
		return name;
	}
	/**
	* Register a skill into the managed installedSkills list (persisted) and as
	* a runtime registration, so it appears in the panel's Skills tab and is
	* callable via /name.
	*/
	async registerManagedSkill(name, description, content) {
		const definition = {
			name,
			content,
			description,
			invocation: {
				modelInvocable: true,
				userInvocable: true
			},
			provider: "runtime",
			source: "custom"
		};
		const id = `${ID_PREFIX.skill}:${name}`;
		const existing = this.registrations.get(id);
		if (existing !== void 0) {
			existing();
			this.registrations.delete(id);
		}
		try {
			this.registrations.set(id, this.ctx.skills.register(definition));
		} catch (error) {
			this.ctx.logger.warn(`[switchblade] runtime register of ${name} failed: ${String(error)}`);
		}
		const current = this.settings().installedSkills;
		if (!current.some((s) => s.name === name)) {
			await this.settingsService?.mutate(settingsNamespace(SETTINGS_NAMESPACE), [{
				op: "set",
				path: ["installedSkills"],
				value: [...current, definition]
			}]);
			this.ctx.logger.warn(`[switchblade] registered managed skill ${name}`);
		}
	}
	/**
	* Install skills from a zip archive by extracting it into the user skills
	* root (`~/.dsh/skills`). Uses the platform archive tool (tar on Windows
	* 10+ handles zip; macOS/Linux tar handles zip) — zero extra dependencies.
	* The zip may contain one skill (SKILL.md at root) or many skill dirs.
	* @param zipPath - absolute path to the .zip archive.
	* @returns the extracted directory names.
	*/
	async installSkillFromZip(zipPath) {
		const root = join(homedir(), ".dsh", "skills");
		await mkdir(root, { recursive: true });
		const temp = join(root, `.zip-tmp-${Date.now()}`);
		await mkdir(temp, { recursive: true });
		try {
			await execFileAsync("tar", [
				"-xf",
				zipPath,
				"-C",
				temp
			]);
		} catch {
			await execFileAsync("powershell", [
				"-NoProfile",
				"-Command",
				`Expand-Archive -LiteralPath '${zipPath}' -DestinationPath '${temp}' -Force`
			]);
		}
		const { readdir, readFile } = await import("node:fs/promises");
		const entries = await readdir(temp);
		const installed = [];
		for (const entry of entries) {
			const src = join(temp, entry);
			const target = join(root, entry);
			await cp(src, target, {
				recursive: true,
				force: true
			});
			installed.push(entry);
			this.ctx.logger.warn(`[switchblade] installed zip entry ${entry} → ${target}`);
			try {
				const md = await readFile(join(target, "SKILL.md"), "utf8").catch(() => void 0);
				if (md !== void 0) {
					const name = parseSkillName(md) ?? entry;
					const desc = parseSkillDescription(md) ?? "";
					await this.registerManagedSkill(name, desc, md);
				} else {
					const flat = await readFile(src, "utf8").catch(() => void 0);
					if (flat !== void 0) {
						const name = parseSkillName(flat) ?? entry.replace(/\.md$/i, "");
						const desc = parseSkillDescription(flat) ?? "";
						await this.registerManagedSkill(name, desc, flat);
					}
				}
			} catch (error) {
				this.ctx.logger.warn(`[switchblade] failed to register zip entry ${entry} as managed: ${String(error)}`);
			}
		}
		await execFileAsync(process.platform === "win32" ? "rmdir" : "rm", process.platform === "win32" ? [
			"/s",
			"/q",
			temp
		] : ["-rf", temp]);
		return installed;
	}
	/**
	* Uninstall an owned skill, disposing its runtime registration.
	* @param name - runtime skill name to remove.
	* @returns the addressed id and resulting state.
	*/
	async uninstallSkill(name) {
		const id = `${ID_PREFIX.skill}:${name}`;
		await this.setOwnedSkill(id, void 0, false);
		return {
			id,
			state: "disabled"
		};
	}
	/** Toggle one owned skill's runtime registration on or off. */
	async setSkillEnabled(name, enabled) {
		const id = `${ID_PREFIX.skill}:${name}`;
		return {
			id,
			state: await this.setOwnedSkillEnabled(id, enabled)
		};
	}
	/** List all skill summary rows, regardless of ownership. */
	async listSkills() {
		return (await this.ctx.skills.list({})).map((skill) => ({
			id: `${ID_PREFIX.skill}:${skill.name}`,
			name: skill.name,
			description: skill.description
		}));
	}
	/** Copy a shipped preset into a locally authored prompt profile. */
	async addProfile(from, id, name) {
		await this.authorableRoster().copy(from, id, name);
	}
	/** Remove a locally authored prompt profile. */
	async removeProfile(id) {
		await this.agentPresetsOrThrow().remove(id);
	}
	/** The prompt profile composed when a session names none. */
	async currentProfile() {
		return this.agentPresetsOrThrow().defaultId;
	}
	/** Persist a new session default prompt profile. */
	async setDefaultProfile(id) {
		const service = this.settingsService;
		if (service === void 0) return;
		await service.mutate(settingsNamespace("agent-presets"), [{
			op: "set",
			path: ["default"],
			value: id
		}]);
	}
	/** Register a custom slash command and persist it for reinstatement. */
	async registerCommand(definition) {
		if (!isCommandName(definition.name)) throw new TypeError(`command name "${definition.name}" must match the command grammar`);
		this.ctx.commands.register(definition);
		const next = this.settings().customCommands;
		if (!next.some((row) => row.name === definition.name)) await this.settingsService?.mutate(settingsNamespace(SETTINGS_NAMESPACE), [{
			op: "set",
			path: ["customCommands"],
			value: [...next, definition]
		}]);
	}
	/** Unregister a custom slash command. */
	async unregisterCommand(name) {
		const id = `${ID_PREFIX.command}:${name}`;
		this.registrations.get(id)?.();
		this.registrations.delete(id);
		const rest = this.settings().customCommands.filter((row) => row.name !== name);
		await this.settingsService?.mutate(settingsNamespace(SETTINGS_NAMESPACE), [{
			op: "set",
			path: ["customCommands"],
			value: rest
		}]);
	}
	/**
	* Export the current managed state as a bundle patch layer (`cordis.patch.yml`).
	* Drop the returned text into a profile bundle's patch file to re-instate the
	* same skills, custom commands, and default profile on another process.
	*/
	async exportBundle() {
		const settings = this.settings();
		const defaultProfile = this.config.defaultProfile;
		return renderPatch({
			installedSkills: settings.installedSkills,
			customCommands: settings.customCommands,
			...defaultProfile === void 0 ? {} : { defaultProfile }
		});
	}
	/**
	* Import switchblade-owned rows from a bundle patch and apply them. The
	* persisted slice is replaced, live registrations are rebuilt, and any
	* `agent-presets` default in the patch is adopted.
	* @param patch - a `cordis.patch.yml` document the exporter (or a compatible
	*   bundle) produced.
	*/
	async importBundle(patch) {
		const parsed = parsePatch(patch);
		for (const dispose of this.registrations.values()) dispose();
		this.registrations.clear();
		for (const definition of parsed.installedSkills) this.registrations.set(`${ID_PREFIX.skill}:${definition.name}`, this.ctx.skills.register(definition));
		for (const row of parsed.customCommands) this.registrations.set(`${ID_PREFIX.command}:${row.name}`, this.ctx.commands.register(passthroughCommand(row)));
		await this.settingsService?.mutate(settingsNamespace(SETTINGS_NAMESPACE), [{
			op: "set",
			path: ["installedSkills"],
			value: parsed.installedSkills
		}, {
			op: "set",
			path: ["customCommands"],
			value: parsed.customCommands
		}]);
		if (parsed.defaultProfile !== void 0) await this.setDefaultProfile(parsed.defaultProfile);
	}
	/** Build the raw snapshot underlying a catalog. */
	async snapshot(agent) {
		const [skills, presets] = await Promise.all([this.ctx.skills.list({}), this.agentPresetsOrThrow().list()]);
		return {
			skills,
			presets,
			commands: this.ctx.commands === void 0 ? [] : this.ctx.commands.list(agent)
		};
	}
	/** Re-register every persisted owned row after a settings reload. */
	reinstall(settings) {
		this.applySkillRegistrations();
		try {
			const commands = this.ctx.commands;
			if (commands !== void 0 && typeof commands.register === "function") for (const row of settings.customCommands) {
				const id = `${ID_PREFIX.command}:${row.name}`;
				if (!this.registrations.has(id)) this.registrations.set(id, commands.register(passthroughCommand(row)));
			}
		} catch (error) {
			this.ctx.logger.warn(`[switchblade] custom command reinstall failed: ${String(error)}`);
		}
		if (settings.prompts.length > 0) this.applyPromptRegistrations();
		for (const server of settings.mcpServers) if (server.enabled) this.startMcpServer(server.serverName);
		this.publishMcpStatus();
	}
	/** Persist the background section through the switchblade settings document. */
	async writeBackground(section) {
		await this.settingsService?.mutate(settingsNamespace(SETTINGS_NAMESPACE), [{
			op: "set",
			path: ["background"],
			value: section
		}]);
	}
	/** Read the resolved background section (defaults merged over the user layer). */
	readBackground() {
		const raw = this.settings().background;
		return {
			...DEFAULT_BACKGROUND,
			...raw ?? {}
		};
	}
	/**
	* Same-origin media routes: POST /upload stores a local image/video on disk
	* (bytes NEVER enter the settings document, so it stays well under the size
	* cap and survives restarts) and GET /image/<id> serves it back. Mirrors the
	* reference dsh-background / skin-center pattern.
	*/
	wallpaperRoutes() {
		const readRawBody = (req, limit) => new Promise((resolve, reject) => {
			const chunks = [];
			let size = 0;
			req.on("data", (c) => {
				size += c.length;
				if (size > limit) {
					req.pause();
					reject(/* @__PURE__ */ new Error("body-too-large"));
					return;
				}
				chunks.push(c);
			});
			req.on("end", () => resolve(Buffer.concat(chunks)));
			req.on("error", reject);
		});
		return [{
			kind: "exact",
			path: `${BACKGROUND_API_PREFIX}/upload`,
			handler: async (req, res) => {
				if (!isSameOriginRequest(req)) {
					jsonResponse(res, 403, {
						ok: false,
						error: "rejected"
					});
					return;
				}
				if (req.method !== "POST") {
					jsonResponse(res, 405, {
						ok: false,
						error: "method-not-allowed"
					});
					return;
				}
				const mime = (req.headers["content-type"] ?? "").split(";")[0]?.trim() ?? "";
				const meta = ACCEPTED_MEDIA[mime];
				if (meta === void 0) {
					jsonResponse(res, 400, {
						ok: false,
						error: "unsupported-media-type"
					});
					return;
				}
				try {
					const body = await readRawBody(req, 60 * 1024 * 1024);
					if (body.length === 0) {
						jsonResponse(res, 400, {
							ok: false,
							error: "empty-body"
						});
						return;
					}
					const id = "up-" + randomBytes(12).toString("hex");
					await writeFile(join(wallpaperDir(), `${id}.${meta.ext}`), body);
					jsonResponse(res, 200, {
						ok: true,
						id,
						kind: meta.kind,
						url: `${BACKGROUND_API_PREFIX}/image/${id}`
					});
				} catch (error) {
					jsonResponse(res, 400, {
						ok: false,
						error: error instanceof Error ? error.message : String(error)
					});
				}
			}
		}, {
			kind: "prefix",
			path: `${BACKGROUND_API_PREFIX}/image`,
			handler: async (req, res) => {
				if (!isSameOriginRequest(req)) {
					jsonResponse(res, 403, {
						ok: false,
						error: "rejected"
					});
					return;
				}
				if (req.method !== "GET") {
					jsonResponse(res, 405, { ok: false });
					return;
				}
				const id = (req.url ?? "").slice(`${BACKGROUND_API_PREFIX}/image`.length + 1).replace(/[^a-z0-9.-]/gi, "");
				if (!/^up-[a-f0-9]{24}/.test(id)) {
					jsonResponse(res, 404, { ok: false });
					return;
				}
				const dir = join(homedir(), ".dsh", "wallpapers");
				if (!existsSync(dir)) {
					jsonResponse(res, 404, { ok: false });
					return;
				}
				const found = Object.values(ACCEPTED_MEDIA).map((m) => join(dir, id.endsWith(m.ext) ? id : `${id}.${m.ext}`)).find((p) => existsSync(p));
				if (found === void 0) {
					jsonResponse(res, 404, { ok: false });
					return;
				}
				const mime = extname(found).slice(1) === "mp4" ? "video/mp4" : extname(found).slice(1) === "webm" ? "video/webm" : `image/${extname(found).slice(1).replace("jpg", "jpeg")}`;
				res.writeHead(200, {
					"content-type": mime,
					"cache-control": "public, max-age=31536000, immutable"
				});
				res.end(await readFile(found));
			}
		}];
	}
	/** Reconcile live mcp-client instances against the persisted config list. */
	reconcileMcpServers() {
		const servers = this.settings().mcpServers;
		const wanted = /* @__PURE__ */ new Set();
		for (const server of servers) {
			wanted.add(server.serverName);
			if (server.enabled && !this.mcpEntries.has(server.serverName)) this.startMcpServer(server.serverName);
			else if (!server.enabled && this.mcpEntries.has(server.serverName)) this.stopMcpServer(server.serverName);
		}
		for (const name of [...this.mcpEntries.keys()]) if (!wanted.has(name)) this.stopMcpServer(name);
	}
	/** List all configured MCP servers with their runtime status. */
	async listMcpServers() {
		return this.settings().mcpServers.map((server) => this.statusOf(server.serverName));
	}
	/** Compute the runtime status of one configured server. */
	statusOf(name) {
		const server = this.settings().mcpServers.find((s) => s.serverName === name);
		const running = this.mcpEntries.has(name);
		const tools = this.listMcpTools().filter((t) => t.name.startsWith(`mcp__${name}__`));
		const lastError = this.mcpErrors.get(name);
		return {
			serverName: name,
			transport: server?.transport ?? "stdio",
			enabled: server?.enabled ?? false,
			running,
			toolCount: tools.length,
			tools,
			...lastError !== void 0 ? { lastError } : {}
		};
	}
	/** Compute the full runtime status map for all configured servers. */
	computeMcpStatus() {
		const status = {};
		for (const server of this.settings().mcpServers) status[server.serverName] = this.statusOf(server.serverName);
		return status;
	}
	/**
	* Publish the runtime status map into the settings namespace so the Web
	* panel (which reads settings over the connection RPC, not Typert) can
	* render per-server tools, running state, and last error. Skips the write
	* when nothing changed to avoid a settings-watch reconcile loop.
	*/
	async publishMcpStatus() {
		const current = this.settings().mcpStatus ?? {};
		const next = this.computeMcpStatus();
		if (JSON.stringify(current) === JSON.stringify(next)) return;
		await this.settingsService?.mutate(settingsNamespace(SETTINGS_NAMESPACE), [{
			op: "set",
			path: ["mcpStatus"],
			value: next
		}]);
	}
	/**
	* Process a one-shot test request written by the Web panel. Idempotent per
	* timestamp: ensures the server is started, waits for tool discovery, then
	* republishes status so the panel sees the live result.
	*/
	handleMcpTestRequest() {
		const req = this.settings().mcpTestRequest;
		if (req === void 0) return;
		const last = this.lastTestTs.get(req.serverName) ?? 0;
		if (req.ts <= last) return;
		this.lastTestTs.set(req.serverName, req.ts);
		this.runMcpTest(req.serverName);
	}
	/** Start (if needed) one server, wait for tools, then republish status. */
	async runMcpTest(name) {
		if (!this.mcpEntries.has(name)) await this.startMcpServer(name);
		await new Promise((resolve) => setTimeout(resolve, 1500));
		await this.publishMcpStatus();
	}
	/** Add a new MCP server config and start it if enabled. */
	async addMcpServer(config) {
		const servers = this.settings().mcpServers;
		if (servers.some((s) => s.serverName === config.serverName)) throw new Error(`MCP server "${config.serverName}" already exists`);
		await this.writeMcpServers([...servers, config]);
		if (config.enabled) await this.startMcpServer(config.serverName);
	}
	/** Update an MCP server config; restarts it if it was running. */
	async updateMcpServer(name, patch) {
		const servers = this.settings().mcpServers;
		const index = servers.findIndex((s) => s.serverName === name);
		if (index < 0) throw new Error(`MCP server "${name}" not found`);
		if (this.mcpEntries.has(name)) await this.stopMcpServer(name);
		const next = servers.map((s, i) => i === index ? {
			...s,
			...patch,
			serverName: name
		} : s);
		await this.writeMcpServers(next);
		if (patch.enabled ?? next[index].enabled) await this.startMcpServer(name);
	}
	/** Remove an MCP server config and stop it if running. */
	async removeMcpServer(name) {
		if (this.mcpEntries.has(name)) await this.stopMcpServer(name);
		const next = this.settings().mcpServers.filter((s) => s.serverName !== name);
		await this.writeMcpServers(next);
	}
	/** Start (load) one MCP server's mcp-client instance. */
	async startMcpServer(name) {
		if (this.mcpEntries.has(name)) return;
		const server = this.settings().mcpServers.find((s) => s.serverName === name);
		if (server === void 0) throw new Error(`MCP server "${name}" not found`);
		const loader = this.ctx.loader;
		if (loader === void 0 || typeof loader.create !== "function") {
			this.ctx.logger.warn(`[switchblade] loader unavailable — cannot start MCP server ${name}`);
			return;
		}
		try {
			const id = await loader.create({
				name: "@deepseek-ai/dsh-mcp-client",
				config: {
					serverName: server.serverName,
					transport: server.transport,
					...server.transport === "stdio" ? {
						command: server.command,
						args: server.args ?? [],
						env: server.env ?? {}
					} : {
						url: server.url,
						headers: server.headers ?? {}
					}
				}
			});
			this.mcpEntries.set(name, id);
			this.mcpErrors.delete(name);
			this.ctx.logger.warn(`[switchblade] started MCP server ${name}`);
		} catch (error) {
			this.mcpErrors.set(name, String(error));
			this.ctx.logger.warn(`[switchblade] failed to start MCP server ${name}: ${String(error)}`);
		}
	}
	/** Stop (unload) one MCP server's mcp-client instance. */
	async stopMcpServer(name) {
		const id = this.mcpEntries.get(name);
		if (id === void 0) return;
		const loader = this.ctx.loader;
		if (loader !== void 0 && typeof loader.remove === "function") try {
			await loader.remove(id);
		} catch (error) {
			this.ctx.logger.warn(`[switchblade] failed to stop MCP server ${name}: ${String(error)}`);
		}
		this.mcpEntries.delete(name);
		this.mcpErrors.delete(name);
	}
	/** List all MCP tools currently registered on ctx.tools. */
	listMcpTools() {
		const tools = this.ctx.tools;
		if (tools === void 0 || typeof tools.schemas !== "function") return [];
		return tools.schemas().filter((t) => t.name.startsWith("mcp__")).map((t) => ({
			name: t.name,
			description: t.description ?? ""
		}));
	}
	/** Persist the MCP server config list. */
	async writeMcpServers(servers) {
		await this.settingsService?.mutate(settingsNamespace(SETTINGS_NAMESPACE), [{
			op: "set",
			path: ["mcpServers"],
			value: servers
		}]);
	}
	/** Flip one owned skill's runtime registration and persist the definition set. */
	async setOwnedSkill(id, def, enabled) {
		const existing = this.registrations.get(id);
		if (existing !== void 0) {
			existing();
			this.registrations.delete(id);
		}
		if (def !== void 0 && enabled) this.registrations.set(id, this.ctx.skills.register(def));
		const kept = this.settings().installedSkills.filter((row) => `${ID_PREFIX.skill}:${row.name}` !== id);
		const next = def === void 0 ? kept : [...kept, def];
		await this.settingsService?.mutate(settingsNamespace(SETTINGS_NAMESPACE), [{
			op: "set",
			path: ["installedSkills"],
			value: next
		}]);
		return enabled ? "enabled" : "disabled";
	}
	async setOwnedSkillEnabled(id, enabled) {
		const definition = this.settings().installedSkills.find((row) => `${ID_PREFIX.skill}:${row.name}` === id);
		if (definition === void 0) throw new Error(`owned skill "${id}" is not installed`);
		const existing = this.registrations.get(id);
		if (existing !== void 0) {
			existing();
			this.registrations.delete(id);
		}
		if (enabled) this.registrations.set(id, this.ctx.skills.register(definition));
		return enabled ? "enabled" : "disabled";
	}
	ownedSkillEntry(skill) {
		return {
			kind: "skill",
			id: `${ID_PREFIX.skill}:${skill.name}`,
			name: skill.name,
			description: skill.description,
			state: this.registrations.has(`${ID_PREFIX.skill}:${skill.name}`) ? "enabled" : "disabled",
			source: skill.source,
			invocation: skill.invocation,
			owned: this.registrations.has(`${ID_PREFIX.skill}:${skill.name}`)
		};
	}
	profileEntry(preset) {
		return {
			kind: "profile",
			id: `${ID_PREFIX.profile}:${preset.id}`,
			name: preset.name ?? preset.id,
			description: preset.description ?? "agent preset",
			state: "installed",
			isDefault: preset.id === this.config.defaultProfile,
			preset
		};
	}
	commandEntry(descriptor) {
		return {
			kind: "command",
			id: `${ID_PREFIX.command}:${descriptor.name}`,
			name: descriptor.name,
			description: descriptor.description,
			state: this.registrations.has(`${ID_PREFIX.command}:${descriptor.name}`) ? "enabled" : "installed",
			descriptor
		};
	}
	/** The agent-preset roster, read live from the composition. */
	agentPresetsOrThrow() {
		const service = this.ctx.get("agentPresets");
		if (service === void 0) throw new Error("switchblade requires the agent-presets service to manage prompt profiles");
		return service;
	}
	authorableRoster() {
		return this.agentPresetsOrThrow();
	}
};
/** Parse the frontmatter `name:` field from a skill markdown body. */
function parseSkillName(md) {
	return /^---[\s\S]*?^name:\s*([^\n]+)/m.exec(md)?.[1]?.trim();
}
/** Parse the frontmatter `description:` field from a skill markdown body. */
function parseSkillDescription(md) {
	return /^---[\s\S]*?^description:\s*([^\n]+)/m.exec(md)?.[1]?.trim();
}
/** Starter handler for imported command rows that arrive without a real handler. */
function passthroughCommand(row) {
	if (typeof row.handler === "function") return row;
	return {
		...row,
		handler: async () => ({
			kind: "success",
			text: row.description
		})
	};
}
//#endregion
//#region src/index.ts
/** Cordis plugin identity. */
const name = "switchblade";
/** Services this plugin requires; declaring them makes ctx.commands resolvable. */
const inject = ["commands"];
/** Mount switchblade and its /sw command family. */
function apply(ctx) {
	ctx.logger.warn("[switchblade] apply() invoked — mounting Switchblade service");
	ctx.plugin(Switchblade).then((fiber) => {
		ctx.logger.warn("[switchblade] Switchblade service mounted");
		const service = fiber.ctx.switchblade;
		defineCommands(ctx, service);
	}, (error) => {
		ctx.logger.warn(`[switchblade] command registration failed: ${error instanceof Error ? error.message : String(error)}`);
	});
}
//#endregion
export { ID_PREFIX, MANAGED_KINDS, SETTINGS_NAMESPACE, Switchblade, SwitchbladeSettingsSchema, apply, inject, isCommandName, isEntryId, isInstallSkillName, name };
