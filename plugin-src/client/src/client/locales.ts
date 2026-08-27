/**
 * Switchblade management page dictionaries.
 * @module @deepseek-ai/dsh-client-ui-switchblade
 */

/** Locale namespace owned by this plugin (settings.* prefix per the slot contract). */
export const NS = 'settings.switchblade'

/** Keys translated by this plugin. */
export type SwitchbladeKey =
  | 'nav' | 'skillsTitle' | 'presetsTitle' | 'promptsTitle' | 'commandsTitle'
  | 'empty' | 'enabled' | 'disabled' | 'installed'
  | 'refresh' | 'setDefault' | 'loadFailed'
  | 'globalHint' | 'promptNamePlaceholder' | 'promptDescPlaceholder' | 'promptContentPlaceholder'
  | 'addPrompt' | 'enable' | 'disable' | 'delete'
  | 'installSkill' | 'skillNamePlaceholder' | 'skillDescPlaceholder' | 'skillContentPlaceholder'
  | 'install' | 'uninstall' | 'pickSkillFile' | 'searchPlaceholder'
  | 'installedSkills' | 'installedSkillsGoRight' | 'manage'
  | 'localSkills' | 'agentPresetsTitle' | 'edit' | 'save' | 'cancel' | 'addSkill'
  | 'pickZipFile' | 'cliHint'

/** zh-CN copy. */
export const zh: Record<SwitchbladeKey, string> = {
  nav: 'Prompt•Skill-Armory',
  skillsTitle: '技能',
  presetsTitle: '提示词预设',
  promptsTitle: '提示词',
  commandsTitle: '命令',
  empty: '(空)',
  enabled: '启用',
  disabled: '停用',
  installed: '已装',
  refresh: '刷新',
  setDefault: '设为默认',
  loadFailed: '加载失败',
  globalHint: '· 全局生效',
  promptNamePlaceholder: '提示词名称',
  promptDescPlaceholder: '描述（可选）',
  promptContentPlaceholder: '提示词内容…',
  addPrompt: '添加提示词',
  enable: '启用',
  disable: '停用',
  delete: '删除',
  installSkill: '技能',
  skillNamePlaceholder: '技能名称（kebab-case）',
  skillDescPlaceholder: '描述（可选）',
  skillContentPlaceholder: '技能指令内容…',
  install: '安装',
  uninstall: '卸载',
  pickSkillFile: '选择本地 .md 技能文件导入',
  searchPlaceholder: '搜索…',
  installedSkills: '本地化技能',
  installedSkillsGoRight: '已安装的技能在右侧第四列管理',
  manage: '托管',
  localSkills: '本地扫描技能',
  agentPresetsTitle: 'Agent预设',
  edit: '编辑',
  save: '保存',
  cancel: '取消',
  addSkill: '添加技能',
  pickZipFile: '导入 .zip 技能包',
  cliHint: 'CLI 直接安装（在会话里输入）：',
}

/** en-US copy. */
export const en: Record<SwitchbladeKey, string> = {
  nav: 'Prompt•Skill-Armory',
  skillsTitle: 'Skills',
  presetsTitle: 'Prompt Presets',
  promptsTitle: 'Prompts',
  commandsTitle: 'Commands',
  empty: '(empty)',
  enabled: 'enabled',
  disabled: 'disabled',
  installed: 'installed',
  refresh: 'Refresh',
  setDefault: 'Set default',
  loadFailed: 'Failed to load',
  globalHint: '· global',
  promptNamePlaceholder: 'Prompt name',
  promptDescPlaceholder: 'Description (optional)',
  promptContentPlaceholder: 'Prompt content…',
  addPrompt: 'Add prompt',
  enable: 'Enable',
  disable: 'Disable',
  delete: 'Delete',
  installSkill: 'Skills',
  skillNamePlaceholder: 'Skill name (kebab-case)',
  skillDescPlaceholder: 'Description (optional)',
  skillContentPlaceholder: 'Skill instructions…',
  install: 'Install',
  uninstall: 'Uninstall',
  pickSkillFile: 'Pick a local .md skill file',
  searchPlaceholder: 'Search…',
  installedSkills: 'Local skills',
  installedSkillsGoRight: 'Installed skills are managed in the right column',
  manage: 'Manage',
  localSkills: 'Scanned skills',
  agentPresetsTitle: 'Agent Presets',
  edit: 'Edit',
  save: 'Save',
  cancel: 'Cancel',
  addSkill: 'Add skill',
  pickZipFile: 'Import .zip skill bundle',
  cliHint: 'Install via CLI (type in a session):',
}
