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
			nav: "Prompt•Skill-Armory",
			skillsTitle: "技能",
			presetsTitle: "提示词预设",
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
			agentPresetsTitle: "Agent预设",
			edit: "编辑",
			save: "保存",
			cancel: "取消",
			addSkill: "添加技能",
			pickZipFile: "导入 .zip 技能包",
			cliHint: "CLI 直接安装（在会话里输入）："
		};
		/** en-US copy. */
		const en = {
			nav: "Prompt•Skill-Armory",
			skillsTitle: "Skills",
			presetsTitle: "Prompt Presets",
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
			agentPresetsTitle: "Agent Presets",
			edit: "Edit",
			save: "Save",
			cancel: "Cancel",
			addSkill: "Add skill",
			pickZipFile: "Import .zip skill bundle",
			cliHint: "Install via CLI (type in a session):"
		};
		//#endregion
		//#region src/client/SwitchbladeSection.tsx
		/**
		* Prompt-SkillArmory management page.
		*
		* Three tabs within the settings dialog's fixed width: Prompts / Skills /
		* Agent Presets. The Skills tab is the single home for skills — both the ones
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
		const ARMORY_VERSION = "0.5.6";
		/** Render the Prompt-SkillArmory management page. */
		function SwitchbladeSection(props) {
			const { useSwitchblade, t, load, setDefaultPreset, addPrompt, updatePrompt, setPromptEnabled, setDefaultPrompt, deletePrompt, installSkill, updateSkill, setSkillEnabled, uninstallSkill, addMcpServer, updateMcpServer, toggleMcpServer, removeMcpServer } = props;
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
			const [presetQuery, setPresetQuery] = (0, react.useState)("");
			const [activeTab, setActiveTab] = (0, react.useState)("prompts");
			const [editingPromptId, setEditingPromptId] = (0, react.useState)();
			const [editingSkillName, setEditingSkillName] = (0, react.useState)();
			const [mcpName, setMcpName] = (0, react.useState)("");
			const [mcpTransport, setMcpTransport] = (0, react.useState)("stdio");
			const [mcpCommand, setMcpCommand] = (0, react.useState)("");
			const [mcpArgs, setMcpArgs] = (0, react.useState)("");
			const [mcpUrl, setMcpUrl] = (0, react.useState)("");
			const [editingMcpName, setEditingMcpName] = (0, react.useState)();
			(0, react.useEffect)(() => {
				load();
			}, [load]);
			const refresh = () => {
				load();
			};
			const setDefault = (id) => {
				setDefaultPreset(id);
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
					args: mcpArgs.trim() ? mcpArgs.trim().split(/\s+/) : []
				} : {
					...base,
					url: mcpUrl.trim()
				};
				(editingMcpName !== void 0 ? updateMcpServer(editingMcpName, config) : addMcpServer(config)).catch((error) => console.error("[switchblade] mcp save failed", error)).finally(() => {
					setBusy(false);
					setMcpName("");
					setMcpCommand("");
					setMcpArgs("");
					setMcpUrl("");
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
				setMcpUrl(server.url ?? "");
			};
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
			const presetRows = state.presets.map((p) => ({
				id: p.id,
				name: p.name ?? p.id,
				desc: p.description ?? p.trust,
				state: p.isDefault ? "enabled" : "installed",
				presetId: p.id,
				isDefault: p.isDefault
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
			const filteredPresets = presetRows.filter((r) => match(r, presetQuery));
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
									children: "Prompt•Skill"
								}),
								"-Armory",
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
									...activeTab === "presets" ? CSS.tabActive : {}
								},
								onClick: () => setActiveTab("presets"),
								children: [
									t("agentPresetsTitle"),
									" (",
									state.status === "loading" ? "…" : presetRows.length,
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
							activeTab === "presets" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									style: CSS.colHeader,
									children: [
										t("agentPresetsTitle"),
										" (",
										presetRows.length,
										")"
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									style: CSS.searchInput,
									placeholder: t("searchPlaceholder"),
									value: presetQuery,
									onChange: (e) => setPresetQuery(e.target.value)
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									style: CSS.scrollBox,
									children: filteredPresets.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										style: CSS.empty,
										children: t("empty")
									}) : filteredPresets.map((row) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
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
														...badge(row.state)
													},
													children: label(row.state)
												})]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
												style: CSS.desc,
												children: row.desc
											}),
											!row.isDefault && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												style: CSS.actionBtn,
												onClick: () => setDefault(row.presetId),
												children: t("setDefault")
											})
										]
									}, row.id))
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
									mcpTransport === "stdio" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										style: CSS.input,
										placeholder: "命令 (command, 如 npx)",
										value: mcpCommand,
										onChange: (e) => setMcpCommand(e.target.value)
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										style: CSS.input,
										placeholder: "参数 (args, 空格分隔)",
										value: mcpArgs,
										onChange: (e) => setMcpArgs(e.target.value)
									})] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										style: CSS.input,
										placeholder: "URL (如 http://localhost:3000/mcp)",
										value: mcpUrl,
										onChange: (e) => setMcpUrl(e.target.value)
									}),
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
												setMcpUrl("");
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
											children: [server.transport, server.transport === "stdio" ? ` · ${server.command ?? ""}` : ` · ${server.url ?? ""}`]
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
			presets: [],
			commands: [],
			prompts: [],
			installedSkills: [],
			mcpServers: []
		};
		/** Normalize a thrown wire error to a message. */
		function messageOf(error) {
			return error instanceof Error ? error.message : String(error);
		}
		/**
		* Data controller bound to one session's connection.
		* @param api - the connection's API client.
		* @param sessionId - session the skill catalog resolves against.
		*/
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
			* Load skills, presets, prompts, and installed skills. Prompts and installed
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
					const calls = [this.api.agentPresets.list({}), this.api.settings.describe({})];
					if (sessionId !== void 0) calls.push(this.api.skills.list({ sessionId }));
					const [presetRes, settingsRes, skillRes] = await Promise.all(calls);
					if (!presetRes.result.ok) throw new Error(`agentPreset.list: ${presetRes.result.error.message}`);
					if (!settingsRes.result.ok) throw new Error(`settings.describe: ${settingsRes.result.error.message}`);
					const skills = skillRes !== void 0 && skillRes.result.ok ? skillRes.result.value.skills.map((skill) => ({
						name: skill.name,
						description: skill.description,
						modelInvocable: skill.modelInvocable
					})) : [];
					const presets = presetRes.result.value.presets.map((preset) => ({
						id: preset.id,
						isDefault: preset.isDefault,
						trust: preset.trust,
						...preset.name === void 0 ? {} : { name: preset.name },
						...preset.description === void 0 ? {} : { description: preset.description },
						...preset.broken === void 0 ? {} : { broken: preset.broken }
					}));
					const switchbladeSection = this.sectionFromSettings(settingsRes.result.value, "switchblade");
					const prompts = Array.isArray(switchbladeSection?.prompts) ? switchbladeSection.prompts : [];
					const installedSkills = Array.isArray(switchbladeSection?.installedSkills) ? switchbladeSection.installedSkills.map((s) => ({
						name: s.name ?? "",
						description: s.description ?? "",
						content: s.content ?? "",
						enabled: s.enabled ?? true
					})) : [];
					const mcpServers = Array.isArray(switchbladeSection?.mcpServers) ? switchbladeSection.mcpServers.map((s) => ({
						serverName: s.serverName,
						transport: s.transport,
						...s.command === void 0 ? {} : { command: s.command },
						...s.args === void 0 ? {} : { args: s.args },
						...s.env === void 0 ? {} : { env: s.env },
						...s.url === void 0 ? {} : { url: s.url },
						...s.headers === void 0 ? {} : { headers: s.headers },
						enabled: s.enabled ?? true
					})) : [];
					this.store.set({
						status: "ready",
						skills,
						presets,
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
			/** Set the default prompt preset. */
			async setDefaultPreset(id) {
				const res = await this.api.settings.update({
					ns: "agent-presets",
					patch: { default: id }
				});
				if (!res.result.ok) throw new Error(res.result.error.message);
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
					setDefaultPreset: (id) => controller.setDefaultPreset(id),
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
					removeMcpServer: (name) => controller.removeMcpServer(name)
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