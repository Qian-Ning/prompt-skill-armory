window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-client-ui-switchblade",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		let _deepseek_ai_dsh_client_runtime_client = require("@deepseek-ai/dsh-client-runtime/client");
		//#region src/client/locales.ts
		/**
		* Switchblade management page dictionaries.
		* @module @deepseek-ai/dsh-client-ui-switchblade
		*/
		/** Locale namespace owned by this plugin (settings.* prefix per the slot contract). */
		const NS = "settings.switchblade";
		/** zh-CN copy. */
		const zh = {
			nav: "Armory",
			skillsTitle: "技能",
			promptsTitle: "提示词",
			commandsTitle: "命令",
			empty: "(空)",
			enabled: "启用",
			disabled: "停用",
			installed: "已装",
			refresh: "刷新",
			setDefault: "设为默认",
			loadFailed: "加载失败",
			globalHint: "· 全局生效",
			promptNamePlaceholder: "提示词名称",
			promptDescPlaceholder: "描述（可选）",
			promptContentPlaceholder: "提示词内容…",
			addPrompt: "添加提示词",
			enable: "启用",
			disable: "停用",
			delete: "删除",
			installSkill: "技能",
			skillNamePlaceholder: "技能名称（kebab-case）",
			skillDescPlaceholder: "描述（可选）",
			skillContentPlaceholder: "技能指令内容…",
			install: "安装",
			uninstall: "卸载",
			pickSkillFile: "选择本地 .md 技能文件导入",
			searchPlaceholder: "搜索…",
			installedSkills: "本地化技能",
			installedSkillsGoRight: "已安装的技能在右侧第四列管理",
			manage: "托管",
			localSkills: "本地扫描技能",
			edit: "编辑",
			save: "保存",
			cancel: "取消",
			addSkill: "添加技能",
			pickZipFile: "导入 .zip 技能包",
			cliHint: "CLI 直接安装（在会话里输入）："
		};
		/** en-US copy. */
		const en = {
			nav: "Armory",
			skillsTitle: "Skills",
			promptsTitle: "Prompts",
			commandsTitle: "Commands",
			empty: "(empty)",
			enabled: "enabled",
			disabled: "disabled",
			installed: "installed",
			refresh: "Refresh",
			setDefault: "Set default",
			loadFailed: "Failed to load",
			globalHint: "· global",
			promptNamePlaceholder: "Prompt name",
			promptDescPlaceholder: "Description (optional)",
			promptContentPlaceholder: "Prompt content…",
			addPrompt: "Add prompt",
			enable: "Enable",
			disable: "Disable",
			delete: "Delete",
			installSkill: "Skills",
			skillNamePlaceholder: "Skill name (kebab-case)",
			skillDescPlaceholder: "Description (optional)",
			skillContentPlaceholder: "Skill instructions…",
			install: "Install",
			uninstall: "Uninstall",
			pickSkillFile: "Pick a local .md skill file",
			searchPlaceholder: "Search…",
			installedSkills: "Local skills",
			installedSkillsGoRight: "Installed skills are managed in the right column",
			manage: "Manage",
			localSkills: "Scanned skills",
			edit: "Edit",
			save: "Save",
			cancel: "Cancel",
			addSkill: "Add skill",
			pickZipFile: "Import .zip skill bundle",
			cliHint: "Install via CLI (type in a session):"
		};
		//#endregion
		//#region src/client/background.ts
		/** Built-in fancy gradient text schemes for the hint/stats line. */
		const GRADIENTS = [
			{
				id: "",
				name: "纯色",
				css: ""
			},
			{
				id: "aurora",
				name: "极光",
				css: "linear-gradient(90deg,#58a6ff,#8b5cf6,#ec4899)"
			},
			{
				id: "fire",
				name: "火焰",
				css: "linear-gradient(90deg,#fbbf24,#f97316,#ef4444)"
			},
			{
				id: "sky",
				name: "晴空",
				css: "linear-gradient(90deg,#38bdf8,#818cf8)"
			},
			{
				id: "neon",
				name: "霓虹",
				css: "linear-gradient(90deg,#22d3ee,#a78bfa,#f0abfc)"
			},
			{
				id: "ocean",
				name: "海洋",
				css: "linear-gradient(90deg,#34d399,#22d3ee,#3b82f6)"
			},
			{
				id: "sunset",
				name: "晚霞",
				css: "linear-gradient(90deg,#f472b6,#fb923c,#f59e0b)"
			}
		];
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
			fit: "cover",
			hint: {
				enabled: false,
				color: "#79c0ff",
				size: 11,
				gradient: ""
			}
		};
		const ACTIVE_ATTR = "data-ar-bg";
		const GLASS_ATTR = "data-ar-glass";
		const CSS_TAG = "prompt-skill-armory/background";
		const BACKGROUND_CSS = `
  .ar-bg-layer { position: fixed; inset: 0; z-index: -2; overflow: hidden; pointer-events: none; }
  .ar-bg-layer .ar-bg-image { width: 100%; height: 100%; display: block; border: 0;
    object-fit: var(--ar-bg-fit, cover); opacity: var(--ar-bg-opacity, 1);
    filter: blur(var(--ar-bg-blur, 0px)); transform: scale(var(--ar-bg-scale, 1)); transform-origin: center; }
  .ar-bg-scrim { position: fixed; inset: 0; z-index: -1; pointer-events: none;
    background: rgba(255,255,255, var(--ar-bg-scrim, 0.25)); }
  body[data-ds-dark-theme] .ar-bg-scrim { background: rgba(0,0,0, var(--ar-bg-scrim, 0.25)); }
  body[${ACTIVE_ATTR}] { --dsw-alias-bg-base: transparent; --dsw-specific-sidebar-fill: transparent; }
  body[${GLASS_ATTR}] [data-composer-card],
  body[${GLASS_ATTR}] [class*="_bubble"]:not([role="tooltip"]),
  body[${GLASS_ATTR}] .md-code-block,
  body[${GLASS_ATTR}] [data-terminal], body[${GLASS_ATTR}] [data-diff],
  body[${GLASS_ATTR}] [data-read], body[${GLASS_ATTR}] [data-search],
  body[${GLASS_ATTR}] [data-web], body[${GLASS_ATTR}] [class*="_ioCard"],
  body[${GLASS_ATTR}] [class*="_instructionsCard"],
  body[${GLASS_ATTR}] [class*="_markdown"] :not(pre) > code {
    background-image: linear-gradient(180deg, rgba(255,255,255, var(--ar-glass-sheen, 0.07)), rgba(255,255,255, var(--ar-glass-sheen-mid, 0.02)) 38%, rgba(255,255,255, 0.01));
    -webkit-backdrop-filter: blur(var(--ar-glass-blur, 16px)) saturate(var(--ar-glass-saturate, 1.4)) brightness(var(--ar-glass-brightness, 1)) contrast(1.01);
    backdrop-filter: blur(var(--ar-glass-blur, 16px)) saturate(var(--ar-glass-saturate, 1.4)) brightness(var(--ar-glass-brightness, 1)) contrast(1.01);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.32), inset 0 -1px 0 rgba(255,255,255,0.08), inset 0 0 0 0.5px rgba(255,255,255,0.08), 0 12px 40px rgba(0,0,0,0.12);
  }
  body[${ACTIVE_ATTR}] .md-code-block [class*="_bannerWrap"] { background-color: var(--dsw-alias-markdown-code-block-banner); }
`;
		function injectBackgroundCss() {
			try {
				if (document.querySelector(`style[data-plugin-css="${CSS_TAG}"]`)) return;
				const tag = document.createElement("style");
				tag.dataset.plugin = "prompt-skill-armory";
				tag.dataset.pluginCss = CSS_TAG;
				tag.textContent = BACKGROUND_CSS;
				document.head.appendChild(tag);
			} catch {}
		}
		const GLASS_TOKENS = [
			"--dsw-specific-input-major",
			"--dsw-specific-bubble",
			"--dsw-alias-markdown-code-block",
			"--dsw-alias-markdown-code-block-banner",
			"--dsw-alias-markdown-inline-code",
			"--dsw-specific-tip"
		];
		function glassAlpha(panelOpacity) {
			const alpha = .05 + panelOpacity * .85;
			return Math.max(0, Math.min(.9, alpha));
		}
		var BackgroundPainter = class {
			layer = null;
			img = null;
			scrim = null;
			observer;
			settings;
			saved = /* @__PURE__ */ new Map();
			rememberOnce(prop) {
				if (this.saved.has(prop)) return;
				try {
					this.saved.set(prop, document.body.style.getPropertyValue(prop));
				} catch {
					this.saved.set(prop, "");
				}
			}
			setVar(name, value) {
				this.rememberOnce(name);
				try {
					document.body.style.setProperty(name, value);
				} catch {}
			}
			apply(settings) {
				this.settings = settings;
				if (!settings.enabled) {
					this.dispose();
					return;
				}
				try {
					injectBackgroundCss();
					const hasSource = settings.url !== "" || settings.uploadId !== "";
					for (const prop of ["--dsw-alias-bg-base", "--dsw-specific-sidebar-fill"]) {
						this.rememberOnce(prop);
						document.body.style.setProperty(prop, "transparent");
					}
					if (!hasSource) {
						this.removeLayers();
						document.body.removeAttribute(ACTIVE_ATTR);
						this.applyGlass(settings, true);
						return;
					}
					const mediaUrl = settings.uploadId !== "" ? `/api/switchblade-wallpaper/image/${settings.uploadId}` : settings.url;
					const isVideo = settings.kind === "video";
					if (!this.layer) {
						this.layer = document.createElement("div");
						this.layer.className = "ar-bg-layer";
						this.img = document.createElement(isVideo ? "video" : "img");
						this.img.className = "ar-bg-image";
						if (isVideo) {
							this.img.setAttribute("autoplay", "");
							this.img.setAttribute("loop", "");
							this.img.setAttribute("muted", "");
							this.img.setAttribute("playsinline", "");
						} else {
							this.img.referrerPolicy = "no-referrer";
							this.img.alt = "";
						}
						this.img.onerror = () => {
							if (this.img && this.img.dataset.failed !== "1") {
								this.img.dataset.failed = "1";
								this.img.style.visibility = "hidden";
							}
						};
						this.layer.appendChild(this.img);
						document.body.appendChild(this.layer);
					}
					if (this.img && this.img.getAttribute("src") !== mediaUrl) {
						delete this.img.dataset.failed;
						this.img.style.visibility = "";
						this.img.setAttribute("src", mediaUrl);
					}
					if (!this.scrim) {
						this.scrim = document.createElement("div");
						this.scrim.className = "ar-bg-scrim";
						document.body.appendChild(this.scrim);
					}
					document.body.setAttribute(ACTIVE_ATTR, "on");
					document.body.style;
					this.setVar("--ar-bg-fit", settings.fit);
					this.setVar("--ar-bg-opacity", String(settings.opacity));
					this.setVar("--ar-bg-blur", `${settings.wallpaperBlur}px`);
					this.setVar("--ar-bg-scale", (1 + settings.wallpaperBlur * .006).toFixed(4));
					this.setVar("--ar-bg-scrim", String(settings.scrim));
					this.setVar("--ar-glass-blur", `${settings.blur}px`);
					this.setVar("--ar-glass-saturate", String(settings.blur > 0 ? Math.round(Math.min(1.6, 1.1 + settings.blur * .02) * 1e3) / 1e3 : 1));
					this.setVar("--ar-glass-brightness", document.body.dataset.dsDarkTheme !== void 0 ? "1.04" : "0.98");
					this.setVar("--ar-glass-sheen", document.body.dataset.dsDarkTheme !== void 0 ? "0.16" : "0.07");
					this.setVar("--ar-glass-sheen-mid", document.body.dataset.dsDarkTheme !== void 0 ? "0.05" : "0.02");
					this.applyGlass(settings, false);
					if (!this.observer) {
						this.observer = new MutationObserver(() => {
							if (this.settings) this.applyGlass(this.settings, false);
						});
						this.observer.observe(document.body, {
							attributes: true,
							attributeFilter: ["data-ds-dark-theme"]
						});
					}
				} catch {
					this.dispose();
				}
			}
			dispose() {
				try {
					this.observer?.disconnect();
					this.observer = void 0;
					this.removeLayers();
					const s = document.body.style;
					document.body.removeAttribute(ACTIVE_ATTR);
					document.body.removeAttribute(GLASS_ATTR);
					for (const [prop, value] of this.saved) s.setProperty(prop, value);
					this.saved.clear();
					this.settings = void 0;
				} catch {}
			}
			applyGlass(settings, forceRestore) {
				try {
					const s = document.body.style;
					for (const t of GLASS_TOKENS) this.rememberOnce(t);
					if (forceRestore || settings === void 0 || settings.panelOpacity >= 1) {
						for (const t of GLASS_TOKENS) {
							const o = this.saved.get(t);
							if (o !== void 0 && o !== "") s.setProperty(t, o);
							else s.removeProperty(t);
						}
						document.body.removeAttribute(GLASS_ATTR);
						this.setVar("--ar-glass-blur", "0px");
						return;
					}
					document.body.setAttribute(GLASS_ATTR, "on");
					const inDark = document.body.dataset.dsDarkTheme !== void 0;
					const alpha = glassAlpha(settings.panelOpacity) * (inDark ? .4 : .8);
					for (const t of GLASS_TOKENS) s.setProperty(t, `rgba(255,255,255,${alpha.toFixed(3)})`);
				} catch {}
			}
			removeLayers() {
				try {
					if (this.layer) {
						this.layer.remove();
						this.layer = null;
						this.img = null;
					}
					if (this.scrim) {
						this.scrim.remove();
						this.scrim = null;
					}
				} catch {}
			}
		};
		const painter = new BackgroundPainter();
		const bgState = {
			status: "loading",
			value: DEFAULT_BACKGROUND
		};
		const bgListeners = /* @__PURE__ */ new Set();
		const notifyBg = () => {
			for (const l of bgListeners) l();
		};
		let bgApi;
		/** Bind the transport to a live connection API (set once at plugin apply). */
		function initBackgroundClient(api) {
			bgApi = api;
		}
		/** Surface key: separate wallpaper per web vs desktop (they share the settings doc). */
		const isDesktopSurface = typeof navigator !== "undefined" && navigator.userAgent.toLowerCase().includes("electron");
		const surfaceKey = () => isDesktopSurface ? "backgroundDesktop" : "backgroundWeb";
		/** Read the background section for the current surface from the switchblade settings. */
		function readSection(value) {
			const raw = (value.namespaces?.find((n) => n.ns === "switchblade")?.value)?.[surfaceKey()];
			return {
				...DEFAULT_BACKGROUND,
				...typeof raw === "object" && raw !== null ? raw : {}
			};
		}
		const backgroundClient = {
			getSnapshot() {
				return bgState;
			},
			subscribe(l) {
				bgListeners.add(l);
				return () => {
					bgListeners.delete(l);
				};
			},
			/** Fetch the durable section. @returns true on success (status ready). */
			async load() {
				if (bgApi === void 0) {
					bgState.status = "error";
					return false;
				}
				try {
					const res = await bgApi.settings.describe({});
					if (!res.result.ok) throw new Error(res.result.error.message);
					bgState.status = "ready";
					bgState.value = readSection(res.result.value);
					notifyBg();
					return true;
				} catch {
					bgState.status = "error";
					return false;
				}
			},
			async save(section) {
				if (bgApi === void 0) return;
				try {
					const res = await bgApi.settings.mutate({
						ns: "switchblade",
						ops: [{
							op: "set",
							path: [surfaceKey()],
							value: section
						}]
					});
					if (!res.result.ok) throw new Error(res.result.error.message);
					bgState.status = "ready";
					bgState.value = { ...section };
				} catch {
					bgState.status = "error";
					bgState.value = section;
				}
				notifyBg();
			}
		};
		/** Upload a local image/video to the Host (bytes go to disk, never settings). */
		async function uploadMedia(file) {
			try {
				const res = await fetch("/api/switchblade-wallpaper/upload", {
					method: "POST",
					headers: { "content-type": file.type },
					body: file
				});
				const body = await res.json();
				if (!res.ok || !body.ok || !body.id || !body.kind || !body.url) return null;
				return {
					id: body.id,
					kind: body.kind,
					url: body.url
				};
			} catch {
				return null;
			}
		}
		/** Apply a full section through the painter (idempotent, never throws). */
		function applyBackground(section) {
			try {
				painter.apply(section);
			} catch {}
			applyHintStyle();
		}
		let hintObserver;
		/** Inject (or clear) the per-surface style for the composer's hint row + dock stats line. */
		function applyHintStyle() {
			try {
				const hint = (bgState.value ?? DEFAULT_BACKGROUND).hint ?? DEFAULT_BACKGROUND.hint;
				const existing = document.getElementById("switchblade-hint");
				if (!hint.enabled) {
					if (existing !== null) existing.remove();
					hintObserver?.disconnect();
					hintObserver = void 0;
					return;
				}
				if (existing === null) {
					const t = document.createElement("style");
					t.id = "switchblade-hint";
					document.head.appendChild(t);
				}
				const tag = document.getElementById("switchblade-hint");
				const color = hint.color || (isDesktopSurface ? "#7ee787" : "#79c0ff");
				const size = hint.size || 11;
				const gradPreset = GRADIENTS.find((g) => g.id === (hint.gradient ?? ""));
				const grad = gradPreset !== void 0 ? gradPreset.css : "";
				let hintCss = `[data-decoration="hint"]{font-size:${size}px;letter-spacing:0.3px;font-weight:600;opacity:0.95;`;
				const statsStyle = (root) => {
					if (grad !== "") {
						root.style.backgroundImage = grad;
						root.style.webkitBackgroundClip = "text";
						root.style.backgroundClip = "text";
						root.style.color = "transparent";
					} else {
						root.style.backgroundImage = "none";
						root.style.webkitBackgroundClip = "initial";
						root.style.backgroundClip = "initial";
						root.style.color = color;
					}
					root.style.fontSize = `${size}px`;
					root.style.fontWeight = "600";
					root.style.opacity = "0.95";
				};
				if (grad !== "") hintCss += `background-image:${grad};-webkit-background-clip:text;background-clip:text;color:transparent`;
				else hintCss += `color:${color}`;
				hintCss += "}";
				tag.textContent = hintCss;
				const applyStats = () => {
					try {
						const seps = Array.from(document.querySelectorAll("span[aria-hidden]"));
						for (const sep of seps) {
							if (sep.textContent !== "|") continue;
							const root = sep.parentElement;
							if (root !== null) statsStyle(root);
						}
					} catch {}
				};
				if (hintObserver !== void 0) hintObserver.disconnect();
				hintObserver = new MutationObserver(applyStats);
				hintObserver.observe(document.body, {
					childList: true,
					subtree: true
				});
				applyStats();
			} catch {}
		}
		//#endregion
		//#region src/client/conversations.ts
		async function listConversations() {
			try {
				const b = await (await fetch("/api/armory/sessions")).json();
				return b.ok ? b.sessions ?? [] : [];
			} catch {
				return [];
			}
		}
		async function exportConversations(ids) {
			try {
				const b = await (await fetch("/api/armory/export", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						sessionIds: ids,
						includeAttachments: true,
						includeWorkspace: true
					})
				})).json();
				return b.ok && b.name !== void 0 ? b.name : null;
			} catch {
				return null;
			}
		}
		async function downloadExport(name) {
			const blob = await (await fetch(`/api/armory/export/${name}`)).blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = name;
			document.body.appendChild(a);
			a.click();
			a.remove();
			setTimeout(() => URL.revokeObjectURL(url), 1e3);
		}
		async function deleteConversations(ids) {
			try {
				const b = await (await fetch("/api/armory/delete", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ sessionIds: ids })
				})).json();
				return b.ok ? b.deleted ?? 0 : null;
			} catch {
				return null;
			}
		}
		/** Query the npm registry for the latest published prompt-skill-armory version. */
		async function checkLatestVersion() {
			try {
				const b = await (await fetch("/api/armory/version")).json();
				return b.ok ? b.latest ?? "" : "";
			} catch {
				return "";
			}
		}
		/** Trigger an in-place update (runs the installer, which reinstalls the plugin). */
		async function runUpdate() {
			try {
				const b = await (await fetch("/api/armory/update", { method: "POST" })).json();
				return {
					ok: b.ok === true,
					error: b.error
				};
			} catch {
				return {
					ok: false,
					error: String("网络请求失败")
				};
			}
		}
		/** Compare dotted versions; true when `a` is older than `b`. */
		function isOlder(a, b) {
			const pa = a.split(".").map((n) => Number(n) || 0);
			const pb = b.split(".").map((n) => Number(n) || 0);
			for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
				const x = pa[i] ?? 0;
				const y = pb[i] ?? 0;
				if (x !== y) return x < y;
			}
			return false;
		}
		async function fetchStats(range = "all") {
			try {
				const b = await (await fetch(`/api/armory/stats?range=${encodeURIComponent(range)}`)).json();
				return b.ok ? {
					range: b.range,
					totals: b.totals,
					byDay: b.byDay,
					byHour: b.byHour,
					byProject: b.byProject,
					byModel: b.byModel,
					recent: b.recent
				} : null;
			} catch {
				return null;
			}
		}
		async function importConversations(file, targetProject) {
			try {
				const q = targetProject !== void 0 && targetProject !== "" ? `?project=${encodeURIComponent(targetProject)}` : "";
				const b = await (await fetch(`/api/armory/import${q}`, {
					method: "POST",
					headers: { "content-type": "application/zip" },
					body: file
				})).json();
				return b.ok ? b.imported ?? 0 : null;
			} catch {
				return null;
			}
		}
		//#endregion
		//#region src/client/SwitchbladeSection.tsx
		/**
		* Prompt-SkillArmory management page.
		*
		* Three tabs within the settings dialog's fixed width: Prompts / Skills /
		* MCP / Wallpaper / Chat / Stats. The Skills tab is the single home for skills — both the ones
		* installed through this panel and the ones scanned from the local skill
		* roots — merged into one list with full management (add / edit / toggle /
		* remove / invoke hint). A CLI entry box offers direct command installation.
		* @module @deepseek-ai/dsh-client-ui-switchblade
		*/
		const BG = "#0d1117";
		const SURFACE = "#161b22";
		const BORDER = "#30363d";
		const TEXT = "#e6edf3";
		const TEXT_MUTED = "#8b949e";
		const ACCENT = "#58a6ff";
		const SUCCESS = "#3fb950";
		const DANGER = "#f85149";
		const WARN = "#d29922";
		const MONO = "'JetBrains Mono',ui-monospace,'SF Mono',Consolas,monospace";
		const CSS = {
			root: {
				fontFamily: "-apple-system,'Segoe UI','Inter',Roboto,'Helvetica Neue',sans-serif",
				background: BG,
				color: TEXT,
				padding: "20px",
				border: `1px solid ${BORDER}`,
				borderRadius: "12px",
				width: "100%",
				boxSizing: "border-box"
			},
			head: {
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				borderBottom: `1px solid ${BORDER}`,
				paddingBottom: "12px",
				marginBottom: "14px"
			},
			title: {
				fontSize: "15px",
				fontWeight: 600,
				letterSpacing: "0.2px",
				display: "flex",
				alignItems: "center",
				gap: "8px",
				color: TEXT
			},
			titleAccent: { color: ACCENT },
			tabs: {
				display: "flex",
				gap: "2px",
				borderBottom: `1px solid ${BORDER}`,
				marginBottom: "14px",
				flexWrap: "wrap"
			},
			tab: {
				background: "transparent",
				border: "none",
				borderBottom: "2px solid transparent",
				color: TEXT_MUTED,
				font: "inherit",
				fontSize: "13px",
				fontWeight: 500,
				padding: "8px 12px",
				cursor: "pointer",
				transition: "color .15s ease, border-color .15s ease"
			},
			tabActive: {
				color: TEXT,
				borderBottomColor: ACCENT
			},
			content: {
				height: "600px",
				display: "flex",
				flexDirection: "column",
				gap: "12px"
			},
			form: {
				display: "flex",
				flexDirection: "column",
				gap: "8px",
				padding: "12px",
				border: `1px solid ${BORDER}`,
				borderRadius: "10px",
				background: SURFACE
			},
			input: {
				background: BG,
				border: `1px solid ${BORDER}`,
				color: TEXT,
				font: "inherit",
				fontSize: "13px",
				padding: "8px 10px",
				borderRadius: "6px",
				outline: "none",
				transition: "border-color .15s ease"
			},
			textarea: {
				background: BG,
				border: `1px solid ${BORDER}`,
				color: TEXT,
				font: "inherit",
				fontSize: "13px",
				padding: "8px 10px",
				borderRadius: "6px",
				minHeight: "48px",
				resize: "vertical",
				outline: "none",
				transition: "border-color .15s ease"
			},
			actions: {
				display: "flex",
				gap: "8px",
				flexWrap: "wrap"
			},
			actionBtn: {
				background: "transparent",
				border: `1px solid ${BORDER}`,
				color: TEXT_MUTED,
				font: "inherit",
				fontSize: "12px",
				padding: "4px 10px",
				borderRadius: "6px",
				cursor: "pointer",
				transition: "color .15s ease, border-color .15s ease, background .15s ease"
			},
			dangerBtn: {
				borderColor: "rgba(248,81,73,.4)",
				color: DANGER
			},
			fileBtn: {
				background: "transparent",
				border: `1px dashed ${BORDER}`,
				color: TEXT_MUTED,
				font: "inherit",
				fontSize: "12px",
				padding: "10px",
				borderRadius: "8px",
				cursor: "pointer",
				textAlign: "center",
				transition: "color .15s ease, border-color .15s ease"
			},
			cliBox: {
				border: `1px solid ${BORDER}`,
				padding: "10px 12px",
				fontSize: "12px",
				color: TEXT_MUTED,
				background: SURFACE,
				borderRadius: "8px"
			},
			searchInput: {
				background: BG,
				border: `1px solid ${BORDER}`,
				color: TEXT_MUTED,
				font: "inherit",
				fontSize: "12px",
				padding: "7px 10px",
				borderRadius: "6px",
				width: "100%",
				boxSizing: "border-box",
				outline: "none",
				transition: "border-color .15s ease"
			},
			scrollBox: {
				flex: 1,
				overflowY: "auto",
				display: "flex",
				flexDirection: "column",
				gap: "8px",
				paddingRight: "6px",
				minHeight: "0"
			},
			wallGrid: {
				flex: 1,
				overflowY: "auto",
				display: "grid",
				gridTemplateColumns: "repeat(auto-fill, minmax(128px, 1fr))",
				gap: "10px",
				paddingRight: "6px",
				minHeight: "0",
				alignContent: "start"
			},
			wallCard: {
				border: `1px solid ${BORDER}`,
				background: SURFACE,
				borderRadius: "10px",
				overflow: "hidden",
				cursor: "pointer",
				transition: "border-color .15s ease"
			},
			wallActive: { borderColor: ACCENT },
			wallPreview: {
				height: "88px",
				backgroundSize: "cover",
				backgroundPosition: "center"
			},
			wallName: {
				padding: "6px 10px",
				fontSize: "12px",
				color: TEXT
			},
			card: {
				border: `1px solid ${BORDER}`,
				background: SURFACE,
				borderRadius: "10px",
				padding: "10px 12px",
				transition: "border-color .15s ease, background .15s ease"
			},
			cardTop: {
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				gap: "8px"
			},
			name: {
				fontSize: "13px",
				fontWeight: 600,
				wordBreak: "break-all",
				color: TEXT
			},
			badge: {
				fontSize: "11px",
				fontWeight: 500,
				padding: "2px 10px",
				borderRadius: "999px",
				flex: "none"
			},
			badgeEnabled: {
				color: SUCCESS,
				background: "rgba(63,185,80,.12)"
			},
			badgeDisabled: {
				color: TEXT_MUTED,
				background: "rgba(139,148,158,.12)"
			},
			badgeInstalled: {
				color: WARN,
				background: "rgba(210,153,34,.12)"
			},
			desc: {
				fontSize: "12px",
				color: TEXT_MUTED,
				marginTop: "6px",
				lineHeight: "1.5"
			},
			invokeHint: {
				fontSize: "11px",
				color: ACCENT,
				marginTop: "6px",
				fontFamily: MONO
			},
			empty: {
				fontSize: "12px",
				color: TEXT_MUTED,
				padding: "12px 0",
				textAlign: "center"
			},
			error: {
				color: DANGER,
				fontSize: "12px",
				padding: "10px 0"
			},
			refreshBtn: {
				background: "transparent",
				border: `1px solid ${BORDER}`,
				color: TEXT_MUTED,
				font: "inherit",
				fontSize: "12px",
				padding: "6px 12px",
				borderRadius: "6px",
				cursor: "pointer",
				transition: "color .15s ease, border-color .15s ease"
			},
			hint: {
				color: TEXT_MUTED,
				fontSize: "11px"
			},
			versionBadge: {
				fontSize: "11px",
				fontWeight: 600,
				letterSpacing: "0.3px",
				color: ACCENT,
				border: `1px solid ${BORDER}`,
				borderRadius: "999px",
				padding: "2px 10px",
				marginLeft: "8px",
				background: "rgba(88,166,255,.08)",
				flex: "none"
			}
		};
		/** Open-book glyph. */
		function BookIcon({ size = 16 }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 16 16",
				fill: "none",
				style: { flex: "none" },
				"aria-hidden": "true",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "M7.5 3.2C6.2 2.4 4.6 2.2 2.8 2.5c-.5.08-.8.5-.8 1v7.6c0 .4.3.7.7.7 1.7-.2 3.2.1 4.8 1V3.2z",
						fill: "currentColor",
						opacity: "0.55"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "M8.5 3.2c1.3-.8 2.9-1 4.7-.7.5.08.8.5.8 1v7.6c0 .4-.3.7-.7.7-1.7-.2-3.2.1-4.8 1V3.2z",
						fill: "currentColor",
						opacity: "0.85"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "M8 3.2v10.3",
						stroke: "currentColor",
						strokeWidth: "0.7"
					})
				]
			});
		}
		/** Bump with every release; keep in sync with package.json version + CHANGELOG. */
		const ARMORY_VERSION = "0.9.1";
		/** Compact duration: 45.2s / 2m42s / 1h05m. */
		function fmtDuration(ms) {
			const s = ms / 1e3;
			if (s < 60) return `${Math.round(s * 10) / 10}s`;
			const m = Math.floor(s / 60);
			if (m < 60) return `${m}m${Math.round(s % 60)}s`;
			return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}m`;
		}
		/** Compact token count: 517 / 12.2K / 1.2M. */
		function fmtTokens(n) {
			if (n < 1e3) return String(n);
			if (n < 1e6) return `${Math.round(n / 1e3)}K`;
			return `${Math.round(n / 1e6 * 10) / 10}M`;
		}
		/** USD cost, 4 decimals or compact. */
		function fmtUsd(n) {
			if (n === 0) return "$0";
			if (n < 1e-4) return "<$0.0001";
			return `$${n.toFixed(4)}`;
		}
		/** Percent. */
		function fmtPct(n) {
			return `${(n * 100).toFixed(1)}%`;
		}
		/** SVG line chart with dual axes (steps left, tokens right) + hover tooltip. */
		function TrendChart({ byDay }) {
			const [hover, setHover] = (0, react.useState)(null);
			const W = 640;
			const H = 180;
			const PAD = {
				l: 38,
				r: 52,
				t: 10,
				b: 22
			};
			const iw = W - PAD.l - PAD.r;
			const ih = H - PAD.t - PAD.b;
			const n = byDay.length;
			if (n === 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				style: CSS.empty,
				children: "暂无趋势数据"
			});
			const maxSteps = Math.max(...byDay.map((d) => d.steps), 1);
			const maxTokens = Math.max(...byDay.map((d) => d.outputTokens), 1);
			const x = (i) => PAD.l + (n === 1 ? iw / 2 : i / (n - 1) * iw);
			const ySteps = (v) => PAD.t + ih - v / maxSteps * ih;
			const yTok = (v) => PAD.t + ih - v / maxTokens * ih;
			const pathSteps = byDay.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${ySteps(d.steps).toFixed(1)}`).join(" ");
			const pathOut = byDay.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${yTok(d.outputTokens).toFixed(1)}`).join(" ");
			const pathIn = byDay.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${yTok(d.inputTokens).toFixed(1)}`).join(" ");
			const grid = [
				0,
				1,
				2,
				3,
				4
			].map((g) => {
				const v = maxSteps * (g / 4);
				return {
					yy: ySteps(v),
					label: g === 0 ? "0" : fmtTokens(v)
				};
			});
			const hovered = hover !== null ? byDay[hover] : void 0;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: {
					position: "relative",
					width: "100%"
				},
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
						viewBox: `0 0 ${W} ${H}`,
						width: "100%",
						height: "180",
						onMouseLeave: () => setHover(null),
						children: [
							grid.map((g, i) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("g", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("line", {
								x1: PAD.l,
								y1: g.yy,
								x2: W - PAD.r,
								y2: g.yy,
								stroke: "#21262d",
								strokeWidth: "1"
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("text", {
								x: PAD.l - 5,
								y: g.yy + 3,
								textAnchor: "end",
								fontSize: "9",
								fill: "#8b949e",
								children: g.label
							})] }, i)),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("text", {
								x: W - PAD.r + 6,
								y: PAD.t + 8,
								fontSize: "9",
								fill: "#3fb950",
								children: fmtTokens(maxTokens)
							}),
							byDay.map((d, i) => {
								if (n > 7 && i % Math.ceil(n / 7) !== 0 && i !== n - 1) return null;
								return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("text", {
									x: x(i),
									y: H - 6,
									textAnchor: "middle",
									fontSize: "9",
									fill: "#8b949e",
									children: d.date.includes(":") ? d.date : d.date.slice(5)
								}, i);
							}),
							hover !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("line", {
								x1: x(hover),
								y1: PAD.t,
								x2: x(hover),
								y2: PAD.t + ih,
								stroke: "#58a6ff",
								strokeDasharray: "3 3",
								strokeWidth: "1"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
								d: pathIn,
								fill: "none",
								stroke: "#58a6ff",
								strokeWidth: "1.6",
								opacity: "0.7"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
								d: pathOut,
								fill: "none",
								stroke: "#3fb950",
								strokeWidth: "1.8"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
								d: pathSteps,
								fill: "none",
								stroke: "#d29922",
								strokeWidth: "1.8",
								strokeDasharray: "4 3"
							}),
							byDay.map((d, i) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("g", { children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
									x: x(i) - 10,
									y: PAD.t,
									width: 20,
									height: ih,
									fill: "transparent",
									onMouseEnter: () => setHover(i)
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
									cx: x(i),
									cy: ySteps(d.steps),
									r: hover === i ? 4 : 3,
									fill: "#d29922",
									stroke: "#0d1117",
									strokeWidth: "1"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
									cx: x(i),
									cy: yTok(d.outputTokens),
									r: hover === i ? 4 : 3,
									fill: "#3fb950",
									stroke: "#0d1117",
									strokeWidth: "1"
								}),
								n <= 4 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("text", {
									x: x(i),
									y: ySteps(d.steps) - 6,
									textAnchor: "middle",
									fontSize: "8.5",
									fill: "#d29922",
									children: d.steps
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("text", {
									x: x(i),
									y: yTok(d.outputTokens) - 6,
									textAnchor: "middle",
									fontSize: "8.5",
									fill: "#3fb950",
									children: fmtTokens(d.outputTokens)
								})] })
							] }, i))
						]
					}),
					hovered !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: {
							position: "absolute",
							top: 0,
							left: Math.min(Math.max(x(hover) / W * 100, 10), 70) + "%",
							background: "rgba(22,27,34,.95)",
							border: "1px solid #30363d",
							borderRadius: "8px",
							padding: "8px 10px",
							fontSize: "11px",
							color: "#e6edf3",
							zIndex: 5,
							whiteSpace: "nowrap",
							boxShadow: "0 4px 14px rgba(0,0,0,.4)"
						},
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: {
									fontWeight: 600,
									marginBottom: "4px",
									color: "#58a6ff"
								},
								children: hovered.date
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: ["步骤：", hovered.steps] }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: ["输出：", fmtTokens(hovered.outputTokens)] }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: ["输入：", fmtTokens(hovered.inputTokens)] }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [
								"缓存读：",
								fmtTokens(hovered.cacheReadTokens),
								" · 写：",
								fmtTokens(hovered.cacheWriteTokens)
							] })
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: {
							display: "flex",
							gap: "12px",
							marginTop: "4px",
							fontSize: "11px",
							color: "#8b949e",
							flexWrap: "wrap"
						},
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: { color: "#d29922" },
								children: "—"
							}), " 步骤"] }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: { color: "#3fb950" },
								children: "—"
							}), " 输出 Token"] }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: { color: "#58a6ff" },
								children: "—"
							}), " 输入 Token"] })
						]
					})
				]
			});
		}
		/** Render the Prompt-SkillArmory management page. */
		function SwitchbladeSection(props) {
			const { useSwitchblade, t, load, addPrompt, updatePrompt, setPromptEnabled, setDefaultPrompt, deletePrompt, installSkill, updateSkill, setSkillEnabled, uninstallSkill, addMcpServer, updateMcpServer, toggleMcpServer, removeMcpServer, testMcpServer, refreshSessions } = props;
			const state = useSwitchblade((snapshot) => snapshot);
			const [promptName, setPromptName] = (0, react.useState)("");
			const [promptDesc, setPromptDesc] = (0, react.useState)("");
			const [promptContent, setPromptContent] = (0, react.useState)("");
			const [skillName, setSkillName] = (0, react.useState)("");
			const [skillDesc, setSkillDesc] = (0, react.useState)("");
			const [skillContent, setSkillContent] = (0, react.useState)("");
			const [busy, setBusy] = (0, react.useState)(false);
			const [pickedFile, setPickedFile] = (0, react.useState)("");
			const [promptQuery, setPromptQuery] = (0, react.useState)("");
			const [skillQuery, setSkillQuery] = (0, react.useState)("");
			const [activeTab, setActiveTab] = (0, react.useState)("prompts");
			const [editingPromptId, setEditingPromptId] = (0, react.useState)();
			const [editingSkillName, setEditingSkillName] = (0, react.useState)();
			const [mcpName, setMcpName] = (0, react.useState)("");
			const [mcpTransport, setMcpTransport] = (0, react.useState)("stdio");
			const [mcpCommand, setMcpCommand] = (0, react.useState)("");
			const [mcpArgs, setMcpArgs] = (0, react.useState)("");
			const [mcpEnv, setMcpEnv] = (0, react.useState)("");
			const [mcpUrl, setMcpUrl] = (0, react.useState)("");
			const [mcpHeaders, setMcpHeaders] = (0, react.useState)("");
			const [editingMcpName, setEditingMcpName] = (0, react.useState)();
			(0, react.useEffect)(() => {
				load();
			}, [load]);
			const refresh = () => {
				load();
			};
			/** Parse newline-separated `KEY=VALUE` lines into a record. */
			const parseKv = (text) => {
				const out = {};
				for (const line of text.split("\n")) {
					const idx = line.indexOf("=");
					if (idx <= 0) continue;
					const key = line.slice(0, idx).trim();
					const value = line.slice(idx + 1).trim();
					if (key !== "") out[key] = value;
				}
				return out;
			};
			/** Submit the MCP server form (add or update). */
			const submitMcpServer = () => {
				if (mcpName.trim() === "") return;
				setBusy(true);
				const base = {
					serverName: mcpName.trim(),
					transport: mcpTransport,
					enabled: true
				};
				const config = mcpTransport === "stdio" ? {
					...base,
					command: mcpCommand.trim(),
					args: mcpArgs.trim() ? mcpArgs.trim().split(/\s+/) : [],
					env: parseKv(mcpEnv)
				} : {
					...base,
					url: mcpUrl.trim(),
					headers: parseKv(mcpHeaders)
				};
				(editingMcpName !== void 0 ? updateMcpServer(editingMcpName, config) : addMcpServer(config)).catch((error) => console.error("[switchblade] mcp save failed", error)).finally(() => {
					setBusy(false);
					setMcpName("");
					setMcpCommand("");
					setMcpArgs("");
					setMcpEnv("");
					setMcpUrl("");
					setMcpHeaders("");
					setEditingMcpName(void 0);
				});
			};
			/** Load one MCP server into the edit form. */
			const startEditMcpServer = (server) => {
				setEditingMcpName(server.serverName);
				setMcpName(server.serverName);
				setMcpTransport(server.transport);
				setMcpCommand(server.command ?? "");
				setMcpArgs((server.args ?? []).join(" "));
				setMcpEnv(Object.entries(server.env ?? {}).map(([k, v]) => `${k}=${v}`).join("\n"));
				setMcpUrl(server.url ?? "");
				setMcpHeaders(Object.entries(server.headers ?? {}).map(([k, v]) => `${k}=${v}`).join("\n"));
			};
			const [bgDraft, setBgDraft] = (0, react.useState)(DEFAULT_BACKGROUND);
			const [chatRows, setChatRows] = (0, react.useState)([]);
			const [chatSelected, setChatSelected] = (0, react.useState)(/* @__PURE__ */ new Set());
			const [chatTarget, setChatTarget] = (0, react.useState)("");
			const [chatBusy, setChatBusy] = (0, react.useState)(false);
			const [chatMsg, setChatMsg] = (0, react.useState)("");
			const [latestVer, setLatestVer] = (0, react.useState)("");
			const [updating, setUpdating] = (0, react.useState)(false);
			const [updateMsg, setUpdateMsg] = (0, react.useState)("");
			const [stats, setStats] = (0, react.useState)(null);
			const [statsRange, setStatsRange] = (0, react.useState)("all");
			const reloadStats = async () => {
				setStats(await fetchStats(statsRange));
			};
			const changeStatsRange = (r) => {
				setStatsRange(r);
				fetchStats(r).then(setStats);
			};
			(0, react.useEffect)(() => {
				checkLatestVersion().then((v) => {
					if (v !== "") setLatestVer(v);
				});
			}, []);
			const reloadChat = async () => {
				setChatRows(await listConversations());
			};
			(0, react.useEffect)(() => {
				reloadChat();
			}, []);
			const toggleChatSel = (id) => {
				setChatSelected((prev) => {
					const n = new Set(prev);
					if (n.has(id)) n.delete(id);
					else n.add(id);
					return n;
				});
			};
			const doExportChat = async () => {
				setChatBusy(true);
				setChatMsg("");
				const name = await exportConversations([...chatSelected]);
				if (name === null) {
					setChatMsg("导出失败");
					setChatBusy(false);
					return;
				}
				await downloadExport(name);
				setChatMsg(`已导出 ${name}`);
				setChatBusy(false);
			};
			const doUpdate = async () => {
				setUpdating(true);
				setUpdateMsg("");
				const r = await runUpdate();
				setUpdateMsg(r.ok ? "更新完成，请重启客户端生效" : r.error !== void 0 && r.error !== "" ? `更新失败：${r.error.slice(0, 300)}` : "更新失败");
				setUpdating(false);
			};
			const onChatFile = async (file) => {
				if (file === void 0) return;
				setChatBusy(true);
				setChatMsg("");
				const n = await importConversations(file, chatTarget.trim() || void 0);
				setChatMsg(n === null ? "导入失败" : `已导入 ${n} 个对话，重启客户端后生效`);
				if (n !== null) {
					refreshSessions();
					await reloadChat();
				}
				setChatBusy(false);
			};
			const doDeleteChat = async () => {
				const ids = [...chatSelected];
				if (ids.length === 0) return;
				if (!window.confirm(`确定删除选中的 ${ids.length} 个对话吗？此操作不可恢复。`)) return;
				setChatBusy(true);
				setChatMsg("");
				const n = await deleteConversations(ids);
				if (n === null) {
					setChatMsg("删除失败");
					setChatBusy(false);
					return;
				}
				setChatSelected(/* @__PURE__ */ new Set());
				setChatMsg(`已删除 ${n} 个对话`);
				refreshSessions();
				await reloadChat();
				setChatBusy(false);
			};
			(0, react.useEffect)(() => {
				const snap = backgroundClient.getSnapshot();
				if (snap.status === "ready") {
					setBgDraft({ ...snap.value });
					applyBackground(snap.value);
				}
			}, []);
			const resetBackground = () => {
				const d = { ...DEFAULT_BACKGROUND };
				setBgDraft(d);
				applyBackground(d);
				backgroundClient.save(d);
			};
			const updateBgLive = (patch) => {
				setBgDraft((prev) => {
					const next = {
						...prev,
						...patch
					};
					applyBackground(next);
					backgroundClient.save(next);
					return next;
				});
			};
			const bgSlider = (label, key, min, max, step) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					alignItems: "center",
					gap: "8px"
				},
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						style: {
							...CSS.hint,
							width: "76px",
							flex: "none"
						},
						children: label
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
						type: "range",
						min,
						max,
						step,
						value: bgDraft[key],
						onChange: (e) => updateBgLive({ [key]: Number(e.target.value) }),
						style: { flex: 1 }
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						style: {
							...CSS.hint,
							width: "34px",
							textAlign: "right"
						},
						children: Math.round(bgDraft[key] * 100)
					})
				]
			});
			/** Read a local skill .md file into the import form. */
			const onSkillFile = (file) => {
				if (file === void 0) return;
				setPickedFile(file.name);
				file.text().then((text) => {
					const first = text.split("\n")[0]?.trim() ?? "";
					const nameMatch = /^#\s+([a-z0-9][a-z0-9-]*)$/i.exec(first);
					if (nameMatch !== null) setSkillName(nameMatch[1]?.toLowerCase() ?? "");
					setSkillContent(text.trim());
					const descLine = text.split("\n").find((l) => l.startsWith("> "));
					if (descLine !== void 0) setSkillDesc(descLine.slice(2).trim());
				}).catch((error) => console.error("[switchblade] read skill file failed", error));
			};
			const submitPrompt = () => {
				if (promptName.trim() === "" || promptContent.trim() === "") return;
				setBusy(true);
				(editingPromptId !== void 0 ? updatePrompt(editingPromptId, {
					name: promptName,
					description: promptDesc,
					content: promptContent
				}) : addPrompt({
					name: promptName,
					description: promptDesc,
					content: promptContent
				})).catch((error) => console.error("[switchblade] prompt save failed", error)).finally(() => {
					setBusy(false);
					setPromptName("");
					setPromptDesc("");
					setPromptContent("");
					setEditingPromptId(void 0);
				});
			};
			const startEditPrompt = (row) => {
				setEditingPromptId(row.promptId);
				setPromptName(row.name);
				setPromptDesc(row.desc);
				setPromptContent(row.content ?? "");
			};
			const togglePrompt = (id, enabled) => {
				setPromptEnabled(id, enabled).catch((error) => console.error("[switchblade] toggle failed", error));
			};
			const markDefault = (id) => {
				setDefaultPrompt(id).catch((error) => console.error("[switchblade] setDefault failed", error));
			};
			const removePrompt = (id) => {
				deletePrompt(id).catch((error) => console.error("[switchblade] delete failed", error));
			};
			const submitSkill = () => {
				if (skillName.trim() === "" || skillContent.trim() === "") return;
				setBusy(true);
				(editingSkillName !== void 0 ? updateSkill(editingSkillName, {
					name: skillName,
					description: skillDesc,
					content: skillContent
				}) : installSkill({
					name: skillName,
					description: skillDesc,
					content: skillContent
				})).catch((error) => console.error("[switchblade] skill save failed", error)).finally(() => {
					setBusy(false);
					setSkillName("");
					setSkillDesc("");
					setSkillContent("");
					setEditingSkillName(void 0);
				});
			};
			const startEditSkill = (row) => {
				const found = state.installedSkills.find((s) => s.name === row.installedName);
				setEditingSkillName(row.installedName);
				setSkillName(row.name);
				setSkillDesc(row.desc);
				setSkillContent(found?.content ?? "");
			};
			const toggleSkill = (name, enabled) => {
				setSkillEnabled(name, enabled).catch((error) => console.error("[switchblade] toggle skill failed", error));
			};
			const removeSkill = (name) => {
				uninstallSkill(name).catch((error) => console.error("[switchblade] uninstall failed", error));
			};
			/** Adopt a scanned (local) skill into the managed list. */
			const adoptSkill = (name) => {
				const found = state.skills.find((s) => s.name === name);
				if (found === void 0) return;
				installSkill({
					name: found.name,
					description: found.description,
					content: `# ${found.name}\n\n${found.description}`
				}).catch((error) => console.error("[switchblade] adopt skill failed", error));
			};
			const promptRows = state.prompts.map((p) => ({
				id: p.id,
				name: p.name,
				desc: p.description,
				state: p.enabled ? "enabled" : "disabled",
				promptId: p.id,
				isDefault: p.isDefault,
				content: p.content,
				promptEnabled: p.enabled
			}));
			const managedNames = new Set(state.installedSkills.map((s) => s.name));
			const managedRows = state.installedSkills.map((s) => ({
				key: `m-${s.name}`,
				name: s.name,
				desc: s.description,
				state: s.enabled ? "enabled" : "disabled",
				installedName: s.name,
				skillEnabled: s.enabled,
				source: "managed"
			}));
			const scannedRows = state.skills.filter((s) => !managedNames.has(s.name)).map((s) => ({
				key: `s-${s.name}`,
				name: s.name,
				desc: s.description,
				state: "installed",
				installedName: s.name,
				skillEnabled: false,
				source: "scanned"
			}));
			const allSkillRows = [...managedRows, ...scannedRows];
			const match = (row, q) => {
				const query = q.trim().toLowerCase();
				if (query === "") return true;
				return row.name.toLowerCase().includes(query) || row.desc.toLowerCase().includes(query);
			};
			const filteredPrompts = promptRows.filter((r) => match(r, promptQuery));
			const filteredSkills = allSkillRows.filter((r) => match(r, skillQuery));
			const badge = (state) => state === "enabled" ? CSS.badgeEnabled : state === "disabled" ? CSS.badgeDisabled : CSS.badgeInstalled;
			const label = (state) => state === "enabled" ? t("enabled") : state === "disabled" ? t("disabled") : t("installed");
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: CSS.root,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: CSS.head,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: CSS.title,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(BookIcon, { size: 16 }),
								" ",
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									style: CSS.titleAccent,
									children: "Armory"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									style: CSS.versionBadge,
									children: ["v", ARMORY_VERSION]
								})
							]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							style: CSS.refreshBtn,
							onClick: refresh,
							children: t("refresh")
						})]
					}),
					state.status === "error" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: CSS.error,
						children: [
							"✖ ",
							t("loadFailed"),
							": ",
							state.message
						]
					}),
					latestVer !== "" && isOlder(ARMORY_VERSION, latestVer) && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: {
							display: "flex",
							alignItems: "center",
							gap: "10px",
							padding: "8px 12px",
							marginBottom: "10px",
							borderRadius: "8px",
							border: "1px solid #58a6ff",
							background: "rgba(88,166,255,.08)"
						},
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								style: {
									fontSize: "12px",
									color: "#58a6ff",
									flex: 1
								},
								children: [
									"有新版本 v",
									latestVer,
									"（当前 v",
									ARMORY_VERSION,
									"）"
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								style: {
									...CSS.actionBtn,
									...CSS.badgeEnabled
								},
								disabled: updating,
								onClick: () => void doUpdate(),
								children: updating ? "更新中…" : "一键更新"
							}),
							updateMsg !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: { ...CSS.hint },
								children: updateMsg
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: CSS.tabs,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								style: {
									...CSS.tab,
									...activeTab === "prompts" ? CSS.tabActive : {}
								},
								onClick: () => setActiveTab("prompts"),
								children: [
									t("promptsTitle"),
									" (",
									state.status === "loading" ? "…" : promptRows.length,
									")"
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								style: {
									...CSS.tab,
									...activeTab === "skills" ? CSS.tabActive : {}
								},
								onClick: () => setActiveTab("skills"),
								children: [
									t("installSkill"),
									" (",
									state.status === "loading" ? "…" : allSkillRows.length,
									")"
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								style: {
									...CSS.tab,
									...activeTab === "mcp" ? CSS.tabActive : {}
								},
								onClick: () => setActiveTab("mcp"),
								children: [
									"MCP (",
									state.status === "loading" ? "…" : state.mcpServers.length,
									")"
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								style: {
									...CSS.tab,
									...activeTab === "wallpaper" ? CSS.tabActive : {}
								},
								onClick: () => setActiveTab("wallpaper"),
								children: "Wallpaper"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								style: {
									...CSS.tab,
									...activeTab === "chat" ? CSS.tabActive : {}
								},
								onClick: () => {
									setActiveTab("chat");
									reloadChat();
								},
								children: [
									"对话 (",
									chatRows.length,
									")"
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								style: {
									...CSS.tab,
									...activeTab === "stats" ? CSS.tabActive : {}
								},
								onClick: () => {
									setActiveTab("stats");
									reloadStats();
								},
								children: "统计"
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: CSS.content,
						children: [
							activeTab === "prompts" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									style: CSS.form,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											style: CSS.input,
											placeholder: t("promptNamePlaceholder"),
											value: promptName,
											onChange: (e) => setPromptName(e.target.value)
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											style: CSS.input,
											placeholder: t("promptDescPlaceholder"),
											value: promptDesc,
											onChange: (e) => setPromptDesc(e.target.value)
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
											style: CSS.textarea,
											placeholder: t("promptContentPlaceholder"),
											value: promptContent,
											onChange: (e) => setPromptContent(e.target.value)
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											style: CSS.actions,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												style: CSS.actionBtn,
												disabled: busy,
												onClick: submitPrompt,
												children: editingPromptId !== void 0 ? t("save") : t("addPrompt")
											}), editingPromptId !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												style: CSS.actionBtn,
												onClick: () => {
													setEditingPromptId(void 0);
													setPromptName("");
													setPromptDesc("");
													setPromptContent("");
												},
												children: t("cancel")
											})]
										})
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									style: CSS.searchInput,
									placeholder: t("searchPlaceholder"),
									value: promptQuery,
									onChange: (e) => setPromptQuery(e.target.value)
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									style: CSS.scrollBox,
									children: filteredPrompts.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										style: CSS.empty,
										children: t("empty")
									}) : filteredPrompts.map((row) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: CSS.card,
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												style: CSS.cardTop,
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
													style: CSS.name,
													children: [row.isDefault ? "★ " : "", row.name]
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													style: {
														...CSS.badge,
														...row.state === "enabled" ? CSS.badgeEnabled : CSS.badgeDisabled
													},
													children: row.state === "enabled" ? t("enabled") : t("disabled")
												})]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
												style: CSS.desc,
												children: row.desc || row.content?.slice(0, 80)
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												style: CSS.actions,
												children: [
													!row.isDefault && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
														style: CSS.actionBtn,
														onClick: () => markDefault(row.promptId),
														children: t("setDefault")
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
														style: CSS.actionBtn,
														onClick: () => togglePrompt(row.promptId, !row.promptEnabled),
														children: row.state === "enabled" ? t("disable") : t("enable")
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
														style: CSS.actionBtn,
														onClick: () => startEditPrompt(row),
														children: t("edit")
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
														style: {
															...CSS.actionBtn,
															...CSS.dangerBtn
														},
														onClick: () => removePrompt(row.promptId),
														children: t("delete")
													})
												]
											})
										]
									}, row.id))
								})
							] }),
							activeTab === "skills" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									style: CSS.form,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
											style: CSS.fileBtn,
											children: [pickedFile !== "" ? `📄 ${pickedFile}` : t("pickSkillFile"), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
												type: "file",
												accept: ".md,.markdown,text/markdown,text/plain",
												style: { display: "none" },
												onChange: (e) => onSkillFile(e.target.files?.[0])
											})]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											style: CSS.input,
											placeholder: t("skillNamePlaceholder"),
											value: skillName,
											onChange: (e) => setSkillName(e.target.value)
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											style: CSS.input,
											placeholder: t("skillDescPlaceholder"),
											value: skillDesc,
											onChange: (e) => setSkillDesc(e.target.value)
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
											style: CSS.textarea,
											placeholder: t("skillContentPlaceholder"),
											value: skillContent,
											onChange: (e) => setSkillContent(e.target.value)
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											style: CSS.actions,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												style: CSS.actionBtn,
												disabled: busy,
												onClick: submitSkill,
												children: editingSkillName !== void 0 ? t("save") : t("addSkill")
											}), editingSkillName !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												style: CSS.actionBtn,
												onClick: () => {
													setEditingSkillName(void 0);
													setSkillName("");
													setSkillDesc("");
													setSkillContent("");
												},
												children: t("cancel")
											})]
										})
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									style: CSS.cliBox,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										style: { marginBottom: "4px" },
										children: t("cliHint")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", {
										style: {
											fontSize: "11px",
											color: ACCENT,
											fontFamily: MONO
										},
										children: "/armory-skill-dir <目录> · /armory-install-zip <zip路径>"
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									style: CSS.searchInput,
									placeholder: t("searchPlaceholder"),
									value: skillQuery,
									onChange: (e) => setSkillQuery(e.target.value)
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									style: CSS.scrollBox,
									children: filteredSkills.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										style: CSS.empty,
										children: t("empty")
									}) : filteredSkills.map((row) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: CSS.card,
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												style: CSS.cardTop,
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													style: CSS.name,
													children: row.name
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													style: {
														...CSS.badge,
														...badge(row.state)
													},
													children: label(row.state)
												})]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
												style: CSS.desc,
												children: row.desc
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												style: CSS.invokeHint,
												children: ["/ ", row.name]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
												style: CSS.actions,
												children: row.source === "scanned" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													style: CSS.actionBtn,
													onClick: () => adoptSkill(row.name),
													children: t("manage")
												}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
														style: CSS.actionBtn,
														onClick: () => toggleSkill(row.installedName, !row.skillEnabled),
														children: row.state === "enabled" ? t("disable") : t("enable")
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
														style: CSS.actionBtn,
														onClick: () => startEditSkill(row),
														children: t("edit")
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
														style: {
															...CSS.actionBtn,
															...CSS.dangerBtn
														},
														onClick: () => removeSkill(row.installedName),
														children: t("uninstall")
													})
												] })
											})
										]
									}, row.key))
								})
							] }),
							activeTab === "mcp" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: CSS.form,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										style: CSS.input,
										placeholder: "服务器名称 (serverName)",
										value: mcpName,
										onChange: (e) => setMcpName(e.target.value)
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: CSS.actions,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											style: {
												...CSS.actionBtn,
												...mcpTransport === "stdio" ? CSS.tabActive : {}
											},
											onClick: () => setMcpTransport("stdio"),
											children: "stdio"
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											style: {
												...CSS.actionBtn,
												...mcpTransport === "streamable-http" ? CSS.tabActive : {}
											},
											onClick: () => setMcpTransport("streamable-http"),
											children: "HTTP"
										})]
									}),
									mcpTransport === "stdio" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											style: CSS.input,
											placeholder: "命令 (command, 如 npx)",
											value: mcpCommand,
											onChange: (e) => setMcpCommand(e.target.value)
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											style: CSS.input,
											placeholder: "参数 (args, 空格分隔)",
											value: mcpArgs,
											onChange: (e) => setMcpArgs(e.target.value)
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
											style: CSS.textarea,
											placeholder: "环境变量 (env, 每行 KEY=VALUE)",
											value: mcpEnv,
											onChange: (e) => setMcpEnv(e.target.value)
										})
									] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										style: CSS.input,
										placeholder: "URL (如 http://localhost:3000/mcp)",
										value: mcpUrl,
										onChange: (e) => setMcpUrl(e.target.value)
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
										style: CSS.textarea,
										placeholder: "请求头 (headers, 每行 KEY=VALUE)",
										value: mcpHeaders,
										onChange: (e) => setMcpHeaders(e.target.value)
									})] }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: CSS.actions,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											style: CSS.actionBtn,
											disabled: busy,
											onClick: submitMcpServer,
											children: editingMcpName !== void 0 ? "保存" : "添加"
										}), editingMcpName !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											style: CSS.actionBtn,
											onClick: () => {
												setEditingMcpName(void 0);
												setMcpName("");
												setMcpCommand("");
												setMcpArgs("");
												setMcpEnv("");
												setMcpUrl("");
												setMcpHeaders("");
											},
											children: "取消"
										})]
									})
								]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: CSS.scrollBox,
								children: state.mcpServers.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									style: CSS.empty,
									children: "暂无 MCP 服务器"
								}) : state.mcpServers.map((server) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									style: CSS.card,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											style: CSS.cardTop,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
												style: CSS.name,
												children: server.serverName
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												style: {
													...CSS.badge,
													...server.enabled ? CSS.badgeEnabled : CSS.badgeDisabled
												},
												children: server.enabled ? "启用" : "停用"
											})]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											style: CSS.desc,
											children: [
												server.transport,
												server.transport === "stdio" ? ` · ${server.command ?? ""}` : ` · ${server.url ?? ""}`,
												" · ",
												server.running ? `运行中 (${server.tools?.length ?? 0} 工具)` : "未运行"
											]
										}),
										server.lastError !== void 0 && server.lastError !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											style: {
												...CSS.error,
												marginTop: "4px"
											},
											children: ["✖ ", server.lastError]
										}),
										(server.tools?.length ?? 0) > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											style: {
												marginTop: "6px",
												display: "flex",
												flexDirection: "column",
												gap: "2px"
											},
											children: server.tools.map((tool) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
												style: {
													fontSize: "11px",
													color: ACCENT,
													fontFamily: MONO,
													wordBreak: "break-all"
												},
												children: tool.name
											}, tool.name))
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											style: CSS.actions,
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													style: CSS.actionBtn,
													onClick: () => toggleMcpServer(server.serverName, !server.enabled),
													children: server.enabled ? "停用" : "启用"
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													style: CSS.actionBtn,
													onClick: () => testMcpServer(server.serverName),
													children: "测试"
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													style: CSS.actionBtn,
													onClick: () => startEditMcpServer(server),
													children: "编辑"
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													style: {
														...CSS.actionBtn,
														...CSS.dangerBtn
													},
													onClick: () => removeMcpServer(server.serverName),
													children: "删除"
												})
											]
										})
									]
								}, server.serverName))
							})] }),
							activeTab === "wallpaper" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: CSS.form,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: {
											display: "flex",
											alignItems: "center",
											justifyContent: "space-between"
										},
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											style: {
												fontSize: "13px",
												fontWeight: 600,
												color: isDesktopSurface ? "#7ee787" : "#79c0ff"
											},
											children: isDesktopSurface ? "桌面客户端 · 全局壁纸" : "网页 · 全局壁纸"
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											style: {
												...CSS.actionBtn,
												...CSS.dangerBtn
											},
											onClick: resetBackground,
											children: "重置"
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										onClick: () => {
											const d = {
												...bgDraft,
												enabled: !bgDraft.enabled
											};
											setBgDraft(d);
											applyBackground(d);
											backgroundClient.save(d);
										},
										role: "switch",
										"aria-checked": bgDraft.enabled,
										style: {
											display: "flex",
											alignItems: "center",
											gap: "10px",
											cursor: "pointer",
											padding: "10px 12px",
											borderRadius: "8px",
											border: `1px solid ${bgDraft.enabled ? "#238636" : "#30363d"}`,
											background: bgDraft.enabled ? "rgba(35,134,54,0.22)" : "#161b22"
										},
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												style: {
													fontSize: "13px",
													fontWeight: 600,
													color: bgDraft.enabled ? "#7ee787" : "#8b949e"
												},
												children: "启用壁纸"
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { style: { flex: 1 } }),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												style: {
													width: "40px",
													height: "22px",
													borderRadius: "999px",
													background: bgDraft.enabled ? "#3fb950" : "#30363d",
													position: "relative",
													flex: "none",
													transition: "background .15s ease"
												},
												children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { style: {
													position: "absolute",
													top: "2px",
													left: bgDraft.enabled ? 20 : 2,
													width: "18px",
													height: "18px",
													borderRadius: "50%",
													background: "#fff",
													transition: "left .15s ease"
												} })
											})
										]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										style: CSS.fileBtn,
										children: ["🖼 上传本地壁纸（图片 / 视频，存盘不撑爆配置）", /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											type: "file",
											accept: "image/*,video/*",
											style: { display: "none" },
											onChange: async (e) => {
												const f = e.target.files?.[0];
												if (f === void 0) return;
												const up = await uploadMedia(f);
												if (up !== null) {
													const d = {
														...bgDraft,
														uploadId: up.id,
														kind: up.kind,
														url: ""
													};
													setBgDraft(d);
													applyBackground(d);
													backgroundClient.save(d);
												}
												e.target.value = "";
											}
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										style: CSS.input,
										placeholder: "图片 URL（https://…，留空则无壁纸）",
										value: bgDraft.url,
										onChange: (e) => setBgDraft({
											...bgDraft,
											url: e.target.value
										}),
										onBlur: () => {
											if (bgDraft.url.trim() !== "") {
												applyBackground(bgDraft);
												backgroundClient.save(bgDraft);
											}
										},
										onKeyDown: (e) => {
											if (e.key === "Enter" && bgDraft.url.trim() !== "") {
												applyBackground(bgDraft);
												backgroundClient.save(bgDraft);
											}
										}
									}),
									(bgDraft.uploadId !== "" || bgDraft.url.trim() !== "") && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: {
											display: "flex",
											alignItems: "center",
											gap: "8px",
											fontSize: "12px",
											color: "#58a6ff"
										},
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
												"已选择：",
												bgDraft.kind === "video" ? "🎬 视频" : "🖼 图片",
												bgDraft.uploadId !== "" ? "（本地上传）" : "（链接）"
											] }),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { style: { flex: 1 } }),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												style: {
													...CSS.actionBtn,
													...CSS.dangerBtn
												},
												onClick: () => {
													const d = {
														...bgDraft,
														uploadId: "",
														url: ""
													};
													setBgDraft(d);
													applyBackground(d);
													backgroundClient.save(d);
												},
												children: "清除"
											})
										]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: {
											display: "flex",
											alignItems: "center",
											gap: "8px",
											marginTop: "2px"
										},
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											style: {
												fontSize: "12px",
												fontWeight: 600,
												color: "#e6edf3"
											},
											children: "样式"
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { style: {
											flex: 1,
											height: "1px",
											background: "#30363d"
										} })]
									}),
									bgSlider("图片透明度", "opacity", 0, 1, .05),
									bgSlider("遮罩", "scrim", 0, 1, .05),
									bgSlider("面板透明度", "panelOpacity", 0, 1, .05),
									bgSlider("玻璃模糊", "blur", 0, 40, 1),
									bgSlider("壁纸模糊", "wallpaperBlur", 0, 40, 1),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: {
											display: "flex",
											gap: "8px",
											alignItems: "center"
										},
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											style: {
												...CSS.hint,
												width: "76px",
												flex: "none"
											},
											children: "铺法"
										}), ["cover", "contain"].map((f) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											style: {
												...CSS.actionBtn,
												...bgDraft.fit === f ? CSS.tabActive : {}
											},
											onClick: () => updateBgLive({ fit: f }),
											children: f === "cover" ? "铺满" : "适应"
										}, f))]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: {
											display: "flex",
											alignItems: "center",
											gap: "8px",
											marginTop: "4px"
										},
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											style: {
												fontSize: "12px",
												fontWeight: 600,
												color: "#e6edf3"
											},
											children: "输入框下方提示样式"
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { style: {
											flex: 1,
											height: "1px",
											background: "#30363d"
										} })]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: {
											display: "flex",
											gap: "8px",
											alignItems: "center"
										},
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											style: {
												...CSS.hint,
												width: "76px",
												flex: "none"
											},
											children: "启用"
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											style: {
												...CSS.actionBtn,
												...bgDraft.hint.enabled ? CSS.badgeEnabled : {}
											},
											onClick: () => updateBgLive({ hint: {
												...bgDraft.hint,
												enabled: !bgDraft.hint.enabled
											} }),
											children: bgDraft.hint.enabled ? "已启用" : "已停用"
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: {
											display: "flex",
											gap: "8px",
											alignItems: "center"
										},
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											style: {
												...CSS.hint,
												width: "76px",
												flex: "none"
											},
											children: "颜色"
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											type: "color",
											value: bgDraft.hint.color,
											onChange: (e) => updateBgLive({ hint: {
												...bgDraft.hint,
												color: e.target.value
											} }),
											style: {
												flex: "none",
												width: "34px",
												height: "26px",
												border: "none",
												background: "transparent",
												padding: 0
											}
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: {
											display: "flex",
											gap: "8px",
											alignItems: "center"
										},
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												style: {
													...CSS.hint,
													width: "76px",
													flex: "none"
												},
												children: "字号"
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
												type: "range",
												min: 10,
												max: 16,
												step: 1,
												value: bgDraft.hint.size,
												onChange: (e) => updateBgLive({ hint: {
													...bgDraft.hint,
													size: Number(e.target.value)
												} }),
												style: { flex: 1 }
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
												style: {
													...CSS.hint,
													width: "30px",
													textAlign: "right"
												},
												children: [bgDraft.hint.size, "px"]
											})
										]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: {
											display: "flex",
											gap: "6px",
											alignItems: "center",
											flexWrap: "wrap"
										},
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											style: {
												...CSS.hint,
												width: "76px",
												flex: "none"
											},
											children: "渐变色"
										}), GRADIENTS.map((g) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											title: g.name,
											style: {
												...CSS.actionBtn,
												...bgDraft.hint.gradient === g.id ? CSS.tabActive : {},
												...g.css !== "" ? {
													backgroundImage: g.css,
													color: "transparent",
													backgroundClip: "text",
													WebkitBackgroundClip: "text",
													fontWeight: 700
												} : {}
											},
											onClick: () => updateBgLive({ hint: {
												...bgDraft.hint,
												gradient: g.id
											} }),
											children: g.name
										}, g.id))]
									})
								]
							}) }),
							activeTab === "chat" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: CSS.form,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: {
											display: "flex",
											alignItems: "center",
											justifyContent: "space-between"
										},
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											style: {
												fontSize: "13px",
												fontWeight: 600
											},
											children: "对话导入 / 导出"
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											style: CSS.actionBtn,
											onClick: () => void reloadChat(),
											disabled: chatBusy,
											children: "刷新"
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										style: {
											...CSS.desc,
											lineHeight: "1.5"
										},
										children: "勾选要导出的对话，打成一个 zip；在另一台机器选该 zip 导入即可还原（含附件与工作区）。"
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: CSS.actions,
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
												style: CSS.actionBtn,
												disabled: chatBusy || chatSelected.size === 0,
												onClick: () => void doExportChat(),
												children: [
													"导出选中（",
													chatSelected.size,
													"）"
												]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
												style: {
													...CSS.actionBtn,
													...CSS.dangerBtn
												},
												disabled: chatBusy || chatSelected.size === 0,
												onClick: () => void doDeleteChat(),
												children: [
													"删除选中（",
													chatSelected.size,
													"）"
												]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
												style: CSS.fileBtn,
												children: [chatBusy ? "处理中…" : "选择 zip 导入", /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
													type: "file",
													accept: ".zip",
													style: { display: "none" },
													onChange: (e) => void onChatFile(e.target.files?.[0])
												})]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
												style: CSS.input,
												placeholder: "目标项目 key（留空=保持原项目）",
												value: chatTarget,
												onChange: (e) => setChatTarget(e.target.value)
											})
										]
									}),
									chatMsg !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										style: CSS.hint,
										children: chatMsg
									})
								]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: CSS.scrollBox,
								children: chatRows.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									style: CSS.empty,
									children: "暂无对话"
								}) : chatRows.map((row) => {
									const id = `${row.projectKey}/${row.sessionId}`;
									const sel = chatSelected.has(id);
									return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: CSS.card,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											style: CSS.cardTop,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												style: {
													display: "flex",
													alignItems: "center",
													gap: "8px",
													minWidth: 0,
													flex: 1
												},
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
													type: "checkbox",
													checked: sel,
													onChange: () => toggleChatSel(id),
													style: { flex: "none" }
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													style: {
														...CSS.name,
														whiteSpace: "nowrap",
														overflow: "hidden",
														textOverflow: "ellipsis",
														flex: 1,
														minWidth: 0
													},
													title: row.title || id,
													children: row.title || "未命名对话"
												})]
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												style: {
													...CSS.badge,
													...CSS.badgeDisabled,
													flex: "none"
												},
												children: row.cwd ? row.cwd.split(/[\\/]/).filter(Boolean).pop() : row.projectKey
											})]
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											style: {
												...CSS.desc,
												whiteSpace: "nowrap",
												overflow: "hidden",
												textOverflow: "ellipsis"
											},
											children: [
												row.cwd || row.projectKey,
												" · ",
												new Date(row.mtime).toLocaleString(),
												" · ",
												row.size >= 1024 ? (row.size / 1024).toFixed(1) + " KB" : row.size + " B"
											]
										})]
									}, id);
								})
							})] }),
							activeTab === "stats" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: CSS.form,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: {
											display: "flex",
											alignItems: "center",
											justifyContent: "space-between",
											gap: "8px",
											flexWrap: "wrap"
										},
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											style: {
												fontSize: "13px",
												fontWeight: 600
											},
											children: "使用统计"
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											style: {
												display: "flex",
												gap: "4px",
												alignItems: "center"
											},
											children: [[
												"all",
												"30d",
												"7d",
												"today"
											].map((r) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												style: {
													...CSS.actionBtn,
													...statsRange === r ? CSS.tabActive : {}
												},
												onClick: () => changeStatsRange(r),
												children: r === "all" ? "全部" : r === "30d" ? "30天" : r === "7d" ? "7天" : "今天"
											}, r)), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												style: CSS.actionBtn,
												onClick: () => void reloadStats(),
												children: "刷新"
											})]
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: {
											display: "grid",
											gridTemplateColumns: "repeat(3, 1fr)",
											gap: "8px",
											marginTop: "4px"
										},
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												style: CSS.card,
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													style: CSS.hint,
													children: "会话"
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													style: {
														fontSize: "15px",
														fontWeight: 700,
														color: "#e6edf3"
													},
													children: stats?.totals.sessions ?? "—"
												})]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												style: CSS.card,
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													style: CSS.hint,
													children: "轮 / 步骤"
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													style: {
														fontSize: "15px",
														fontWeight: 700,
														color: "#e6edf3"
													},
													children: stats ? `${stats.totals.turns} / ${stats.totals.steps}` : "—"
												})]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												style: CSS.card,
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													style: CSS.hint,
													children: "LLM / 工具时长"
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													style: {
														fontSize: "15px",
														fontWeight: 700,
														color: "#e6edf3"
													},
													children: stats ? `${fmtDuration(stats.totals.llmMs)} / ${fmtDuration(stats.totals.toolMs)}` : "—"
												})]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												style: CSS.card,
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													style: CSS.hint,
													children: "输入 Token"
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													style: {
														fontSize: "15px",
														fontWeight: 700,
														color: "#e6edf3"
													},
													children: stats ? fmtTokens(stats.totals.inputTokens) : "—"
												})]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												style: CSS.card,
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													style: CSS.hint,
													children: "输出 Token"
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													style: {
														fontSize: "15px",
														fontWeight: 700,
														color: "#e6edf3"
													},
													children: stats ? fmtTokens(stats.totals.outputTokens) : "—"
												})]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												style: CSS.card,
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													style: CSS.hint,
													children: "缓存读 / 写"
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													style: {
														fontSize: "15px",
														fontWeight: 700,
														color: "#e6edf3"
													},
													children: stats ? `${fmtTokens(stats.totals.cacheReadTokens)} / ${fmtTokens(stats.totals.cacheWriteTokens)}` : "—"
												})]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												style: CSS.card,
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													style: CSS.hint,
													children: "缓存命中率"
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													style: {
														fontSize: "15px",
														fontWeight: 700,
														color: "#e6edf3"
													},
													children: stats ? fmtPct(stats.totals.cacheHitRate) : "—"
												})]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												style: CSS.card,
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													style: CSS.hint,
													children: "总成本"
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													style: {
														fontSize: "15px",
														fontWeight: 700,
														color: "#e6edf3"
													},
													children: stats ? fmtUsd(stats.totals.costUsd) : "—"
												})]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												style: CSS.card,
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													style: CSS.hint,
													children: "平均首Token"
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													style: {
														fontSize: "15px",
														fontWeight: 700,
														color: "#e6edf3"
													},
													children: stats ? fmtDuration(stats.totals.avgTtftMs) : "—"
												})]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												style: CSS.card,
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													style: CSS.hint,
													children: "输出吞吐"
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													style: {
														fontSize: "15px",
														fontWeight: 700,
														color: "#e6edf3"
													},
													children: stats ? `${stats.totals.tokPerSec.toFixed(0)} tok/s` : "—"
												})]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												style: CSS.card,
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													style: CSS.hint,
													children: "每会话平均"
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													style: {
														fontSize: "15px",
														fontWeight: 700,
														color: "#e6edf3"
													},
													children: stats ? `${stats.totals.perSessionSteps.toFixed(1)} 步` : "—"
												})]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												style: CSS.card,
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													style: CSS.hint,
													children: "活跃天数"
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													style: {
														fontSize: "15px",
														fontWeight: 700,
														color: "#e6edf3"
													},
													children: stats?.totals.activeDays ?? "—"
												})]
											})
										]
									}),
									stats !== null && (stats.byDay.length > 0 || stats.byHour.length > 0) && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TrendChart, { byDay: stats.byHour.length > 0 ? stats.byHour.map((h) => ({
										date: `${String(h.hour).padStart(2, "0")}:00`,
										steps: h.steps,
										outputTokens: h.outputTokens,
										inputTokens: h.inputTokens,
										cacheReadTokens: h.cacheReadTokens,
										cacheWriteTokens: h.cacheWriteTokens
									})) : stats.byDay })
								]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: CSS.scrollBox,
								children: [
									(stats?.byProject ?? []).length === 0 && (stats?.recent ?? []).length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										style: CSS.empty,
										children: "暂无使用记录"
									}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, {}),
									(stats?.recent ?? []).length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: {
											...CSS.hint,
											marginBottom: "4px"
										},
										children: [
											"请求日志（最近 ",
											stats.recent.length,
											"）"
										]
									}), stats.recent.map((r) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: CSS.card,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											style: CSS.cardTop,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
												style: {
													...CSS.name,
													whiteSpace: "nowrap",
													overflow: "hidden",
													textOverflow: "ellipsis",
													flex: 1,
													minWidth: 0
												},
												children: r.provider
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												style: {
													...CSS.badge,
													...r.status === "done" ? CSS.badgeEnabled : CSS.badgeInstalled
												},
												children: r.status === "done" ? "完成" : "进行中"
											})]
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											style: CSS.desc,
											children: [
												new Date(r.time).toLocaleString(),
												" · ",
												fmtTokens(r.inputTokens),
												" in / ",
												fmtTokens(r.outputTokens),
												" out · R",
												fmtTokens(r.cacheReadTokens),
												"·W",
												fmtTokens(r.cacheWriteTokens),
												" · 命中 ",
												fmtPct(r.cacheHitRate),
												" · ",
												fmtUsd(r.costUsd),
												" · ",
												fmtDuration(r.latencyMs),
												" / 首字 ",
												fmtDuration(r.firstTokenMs)
											]
										})]
									}, r.time + "-" + r.provider))] }),
									(stats?.byProject ?? []).length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										style: {
											...CSS.hint,
											marginBottom: "4px"
										},
										children: "Provider / 项目统计"
									}), stats.byProject.slice(0, 20).map((p) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: CSS.card,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											style: CSS.cardTop,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
												style: {
													...CSS.name,
													whiteSpace: "nowrap",
													overflow: "hidden",
													textOverflow: "ellipsis",
													flex: 1,
													minWidth: 0
												},
												children: p.project
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
												style: {
													...CSS.badge,
													...CSS.badgeDisabled
												},
												children: [p.sessions, " 会话"]
											})]
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											style: CSS.desc,
											children: [
												p.steps,
												" 步 · ",
												fmtTokens(p.inputTokens),
												" in / ",
												fmtTokens(p.outputTokens),
												" out · R",
												fmtTokens(p.cacheReadTokens),
												" · 命中 ",
												fmtPct(p.cacheHitRate),
												" · ",
												fmtUsd(p.costUsd),
												" · 延迟 ",
												p.avgLatencyMs.toFixed(0),
												"ms · 成功 ",
												p.successRate.toFixed(0),
												"%"
											]
										})]
									}, p.project))] }),
									(stats?.byModel ?? []).length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										style: {
											...CSS.hint,
											marginBottom: "4px"
										},
										children: "模型统计"
									}), stats.byModel.slice(0, 20).map((m) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: CSS.card,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											style: CSS.cardTop,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
												style: {
													...CSS.name,
													whiteSpace: "nowrap",
													overflow: "hidden",
													textOverflow: "ellipsis",
													flex: 1,
													minWidth: 0
												},
												children: m.model
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
												style: {
													...CSS.badge,
													...CSS.badgeDisabled
												},
												children: [m.sessions, " 会话"]
											})]
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											style: CSS.desc,
											children: [
												m.steps,
												" 步 · ",
												fmtTokens(m.inputTokens),
												" in / ",
												fmtTokens(m.outputTokens),
												" out · 命中 ",
												fmtPct(m.cacheHitRate),
												" · ",
												fmtUsd(m.costUsd)
											]
										})]
									}, m.model))] })
								]
							})] })
						]
					})
				]
			});
		}
		//#endregion
		//#region src/client/store.ts
		/** Initial (idle) state. */
		const IDLE = {
			status: "idle",
			skills: [],
			commands: [],
			prompts: [],
			installedSkills: [],
			mcpServers: []
		};
		/** Normalize a thrown wire error to a message. */
		function messageOf(error) {
			return error instanceof Error ? error.message : String(error);
		}
		var SwitchbladeSectionController = class {
			api;
			sessionId;
			/** Snapshot store backing the section's view state. */
			store = (0, _deepseek_ai_dsh_client_runtime_client.createSnapshotStore)(IDLE);
			constructor(api, sessionId) {
				this.api = api;
				this.sessionId = sessionId;
			}
			/**
			* Load skills, prompts, and installed skills. Prompts and installed
			* skills come from the `switchblade` settings namespace (the Host watches
			* it and re-injects on change).
			*/
			async load() {
				this.store.set({
					...IDLE,
					status: "loading"
				});
				try {
					const sessionId = this.sessionId?.();
					const calls = [this.api.settings.describe({})];
					if (sessionId !== void 0) calls.push(this.api.skills.list({ sessionId }));
					const [settingsRes, skillRes] = await Promise.all(calls);
					if (!settingsRes.result.ok) throw new Error(`settings.describe: ${settingsRes.result.error.message}`);
					const skills = skillRes !== void 0 && skillRes.result.ok ? skillRes.result.value.skills.map((skill) => ({
						name: skill.name,
						description: skill.description,
						modelInvocable: skill.modelInvocable
					})) : [];
					const switchbladeSection = this.sectionFromSettings(settingsRes.result.value, "switchblade");
					const prompts = Array.isArray(switchbladeSection?.prompts) ? switchbladeSection.prompts : [];
					const installedSkills = Array.isArray(switchbladeSection?.installedSkills) ? switchbladeSection.installedSkills.map((s) => ({
						name: s.name ?? "",
						description: s.description ?? "",
						content: s.content ?? "",
						enabled: s.enabled ?? true
					})) : [];
					const mcpServers = Array.isArray(switchbladeSection?.mcpServers) ? switchbladeSection.mcpServers.map((s) => {
						const status = (switchbladeSection?.mcpStatus)?.[s.serverName];
						return {
							serverName: s.serverName,
							transport: s.transport,
							...s.command === void 0 ? {} : { command: s.command },
							...s.args === void 0 ? {} : { args: s.args },
							...s.env === void 0 ? {} : { env: s.env },
							...s.url === void 0 ? {} : { url: s.url },
							...s.headers === void 0 ? {} : { headers: s.headers },
							enabled: s.enabled ?? true,
							...status === void 0 ? {} : {
								running: status.running ?? false,
								tools: status.tools ?? [],
								...status.lastError === void 0 ? {} : { lastError: status.lastError }
							}
						};
					}) : [];
					this.store.set({
						status: "ready",
						skills,
						commands: [],
						prompts,
						installedSkills,
						mcpServers
					});
				} catch (error) {
					this.store.set({
						...IDLE,
						status: "error",
						message: messageOf(error)
					});
				}
			}
			/** Read one namespace's user section from a settings.describe value. */
			sectionFromSettings(value, ns) {
				if (typeof value !== "object" || value === null) return void 0;
				const entries = value.namespaces;
				if (!Array.isArray(entries)) return void 0;
				for (const entry of entries) {
					const row = entry;
					if (row.ns === ns) {
						const section = row.value;
						return typeof section === "object" && section !== null ? section : void 0;
					}
				}
			}
			/** Add a prompt. */
			async addPrompt(input) {
				const res = await this.api.settings.mutate({
					ns: "switchblade",
					ops: [{
						op: "set",
						path: ["prompts"],
						value: [...this.currentPrompts(), {
							id: this.slugify(input.name),
							name: input.name,
							description: input.description,
							content: input.content,
							order: this.currentPrompts().length,
							enabled: true,
							isDefault: this.currentPrompts().length === 0
						}]
					}]
				});
				if (!res.result.ok) throw new Error(res.result.error.message);
				await this.load();
			}
			/** Toggle one prompt's enabled state. */
			async setPromptEnabled(id, enabled) {
				const next = this.currentPrompts().map((p) => p.id === id ? {
					...p,
					enabled
				} : p);
				await this.writePrompts(next);
			}
			/** Mark one prompt default; clears others. */
			async setDefaultPrompt(id) {
				const next = this.currentPrompts().map((p) => ({
					...p,
					isDefault: p.id === id
				}));
				await this.writePrompts(next);
			}
			/** Delete one prompt. */
			async deletePrompt(id) {
				const next = this.currentPrompts().filter((p) => p.id !== id);
				await this.writePrompts(next);
			}
			/** Update a prompt's name/description/content. */
			async updatePrompt(id, patch) {
				const next = this.currentPrompts().map((p) => p.id === id ? {
					...p,
					name: patch.name?.trim() || p.name,
					description: patch.description ?? p.description,
					content: patch.content ?? p.content
				} : p);
				await this.writePrompts(next);
			}
			/** Persist the prompt list through the settings RPC. */
			async writePrompts(prompts) {
				const res = await this.api.settings.mutate({
					ns: "switchblade",
					ops: [{
						op: "set",
						path: ["prompts"],
						value: prompts
					}]
				});
				if (!res.result.ok) throw new Error(res.result.error.message);
				await this.load();
			}
			/** Current prompt list from the loaded snapshot. */
			currentPrompts() {
				return this.store.getSnapshot().prompts;
			}
			/** Sluggify a name into an id. */
			slugify(value) {
				const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
				return slug.length > 0 ? slug : `prompt-${Date.now()}`;
			}
			/** Install a skill from a name + content (enabled by default). */
			async installSkill(input) {
				const next = [...this.currentInstalledSkills(), {
					name: input.name,
					description: input.description,
					content: input.content,
					enabled: true
				}];
				const res = await this.api.settings.mutate({
					ns: "switchblade",
					ops: [{
						op: "set",
						path: ["installedSkills"],
						value: next
					}]
				});
				if (!res.result.ok) throw new Error(res.result.error.message);
				await this.load();
			}
			/** Toggle one installed skill's enabled state. */
			async setSkillEnabled(name, enabled) {
				const next = this.currentInstalledSkills().map((s) => s.name === name ? {
					...s,
					enabled
				} : s);
				const res = await this.api.settings.mutate({
					ns: "switchblade",
					ops: [{
						op: "set",
						path: ["installedSkills"],
						value: next
					}]
				});
				if (!res.result.ok) throw new Error(res.result.error.message);
				await this.load();
			}
			/** Uninstall one installed skill. */
			async uninstallSkill(name) {
				const next = this.currentInstalledSkills().filter((s) => s.name !== name);
				const res = await this.api.settings.mutate({
					ns: "switchblade",
					ops: [{
						op: "set",
						path: ["installedSkills"],
						value: next
					}]
				});
				if (!res.result.ok) throw new Error(res.result.error.message);
				await this.load();
			}
			/** Update an installed skill's name/description/content. */
			async updateSkill(name, patch) {
				const next = this.currentInstalledSkills().map((s) => s.name === name ? {
					...s,
					name: patch.name?.trim() || s.name,
					description: patch.description ?? s.description,
					content: patch.content ?? s.content
				} : s);
				const res = await this.api.settings.mutate({
					ns: "switchblade",
					ops: [{
						op: "set",
						path: ["installedSkills"],
						value: next
					}]
				});
				if (!res.result.ok) throw new Error(res.result.error.message);
				await this.load();
			}
			/** Current installed skills from the loaded snapshot. */
			currentInstalledSkills() {
				return this.store.getSnapshot().installedSkills;
			}
			/**
			* Queue a zip archive (base64) for extraction into ~/.dsh/skills. The Host
			* watch sees pendingZip and installs it (skil-filesystem then discovers it).
			*/
			async installSkillFromZip(name, dataBase64) {
				const res = await this.api.settings.mutate({
					ns: "switchblade",
					ops: [{
						op: "set",
						path: ["pendingZip"],
						value: {
							name,
							dataBase64
						}
					}]
				});
				if (!res.result.ok) throw new Error(res.result.error.message);
				await new Promise((r) => setTimeout(r, 500));
				await this.load();
			}
			/** Add a new MCP server config. */
			async addMcpServer(config) {
				const next = [...this.currentMcpServers(), config];
				await this.writeMcpServers(next);
			}
			/** Update an MCP server config. */
			async updateMcpServer(name, patch) {
				const next = this.currentMcpServers().map((s) => s.serverName === name ? {
					...s,
					...patch,
					serverName: name
				} : s);
				await this.writeMcpServers(next);
			}
			/** Toggle one MCP server's enabled state (Host auto-starts/stops). */
			async toggleMcpServer(name, enabled) {
				const next = this.currentMcpServers().map((s) => s.serverName === name ? {
					...s,
					enabled
				} : s);
				await this.writeMcpServers(next);
			}
			/** Remove an MCP server config. */
			async removeMcpServer(name) {
				const next = this.currentMcpServers().filter((s) => s.serverName !== name);
				await this.writeMcpServers(next);
			}
			/**
			* Ask the Host to (re)start one server and republish its live status. The
			* Host processes the one-shot request and updates mcpStatus; we refresh
			* after a short delay so the panel shows the fresh tool list / error.
			*/
			async testMcpServer(name) {
				const res = await this.api.settings.mutate({
					ns: "switchblade",
					ops: [{
						op: "set",
						path: ["mcpTestRequest"],
						value: {
							serverName: name,
							ts: Date.now()
						}
					}]
				});
				if (!res.result.ok) throw new Error(res.result.error.message);
				await new Promise((r) => setTimeout(r, 2e3));
				await this.load();
			}
			/** Persist the MCP server config list. */
			async writeMcpServers(servers) {
				const res = await this.api.settings.mutate({
					ns: "switchblade",
					ops: [{
						op: "set",
						path: ["mcpServers"],
						value: servers
					}]
				});
				if (!res.result.ok) throw new Error(res.result.error.message);
				await this.load();
			}
			/** Current MCP server list from the loaded snapshot. */
			currentMcpServers() {
				return this.store.getSnapshot().mcpServers;
			}
		};
		//#endregion
		//#region src/client/index.ts
		/** Required services (cordis fiber inject). */
		const inject = [
			"slots",
			"locale",
			"connection",
			"sessions"
		];
		/**
		* Mount the Switchblade settings section.
		* @param ctx - the browser plugin context.
		*/
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "ui-switchblade: dictionaries");
			const api = ctx.get("connection").api;
			const sessions = ctx.get("sessions");
			applyHintStyle();
			try {
				initBackgroundClient(api);
				const paintBackground = () => {
					const s = backgroundClient.getSnapshot();
					if (s.status === "ready") applyBackground(s.value);
				};
				backgroundClient.subscribe(paintBackground);
				const applyPersisted = () => {
					backgroundClient.load().then((ok) => {
						if (!ok) setTimeout(applyPersisted, 1200);
					});
				};
				applyPersisted();
			} catch (error) {
				console.warn("[switchblade] background init skipped:", error);
			}
			const controller = new SwitchbladeSectionController(api, () => {
				const state = sessions.list.getSnapshot();
				return state.current === void 0 ? void 0 : state.current;
			});
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "switchblade",
				order: 30,
				label: () => ctx.locale.bind(NS)("nav"),
				locale: NS,
				inject: () => ({
					hooks: { switchblade: controller.store },
					load: () => controller.load(),
					addPrompt: (input) => controller.addPrompt(input),
					updatePrompt: (id, patch) => controller.updatePrompt(id, patch),
					setPromptEnabled: (id, enabled) => controller.setPromptEnabled(id, enabled),
					setDefaultPrompt: (id) => controller.setDefaultPrompt(id),
					deletePrompt: (id) => controller.deletePrompt(id),
					installSkill: (input) => controller.installSkill(input),
					updateSkill: (name, patch) => controller.updateSkill(name, patch),
					setSkillEnabled: (name, enabled) => controller.setSkillEnabled(name, enabled),
					uninstallSkill: (name) => controller.uninstallSkill(name),
					installSkillFromZip: (name, dataBase64) => controller.installSkillFromZip(name, dataBase64),
					addMcpServer: (config) => controller.addMcpServer(config),
					updateMcpServer: (name, patch) => controller.updateMcpServer(name, patch),
					toggleMcpServer: (name, enabled) => controller.toggleMcpServer(name, enabled),
					removeMcpServer: (name) => controller.removeMcpServer(name),
					testMcpServer: (name) => controller.testMcpServer(name),
					refreshSessions: () => {
						sessions.refresh?.().catch(() => {});
					}
				})
			}, SwitchbladeSection));
		}
		/** Cordis plugin identity. */
		const name = "ui-switchblade";
		//#endregion
		exports.SwitchbladeSection = SwitchbladeSection;
		exports.SwitchbladeSectionController = SwitchbladeSectionController;
		exports.apply = apply;
		exports.inject = inject;
		exports.name = name;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map