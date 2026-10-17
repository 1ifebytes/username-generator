# Username Generator — Session Context

## Current Status
- 本地仓库已同步到 `origin/master`（`1871d7d`）基础上继续开发。
- **阶段 0（地基）完成**：历史写入语义修复、toast 替代 alert、null 保护、state getter、图标 16/32/48、版本统一 `1.2.0`、CI、删除死代码。
- **阶段 1 第一项完成：双入口**
  - 工具栏走轻量弹窗 `popup-quick.html`（默认 popup），一键生成/复制 + “More options & history →”。
  - 全页面 `page.html` 保留历史、收藏、搜索、CSV、主题、语言。
  - 抽出共享模块：`generator-core.js`、`history-store.js`、`toast.js`。
  - 移除已失效的 `background.js` 与 manifest `background`。
- 测试 17/17 通过；已用真实浏览器（HTTP 预览）验证：生成、复制 toast、历史不因拖拽增长、深色模式、8 种语言切换与时间戳格式。

## 多语言
- 支持 8 种界面语言：`en`、`zh`（简体）、`zh-TW`（繁體）、`ja`、`ko`、`es`、`fr`、`de`。
- 语言下拉在弹窗与全页面都由 `I18nManager.getSupportedLanguages()` 动态生成；新增语言只需在 `modules/i18n-manager.js` 加字典 + 在 `LANGUAGE_NAMES` / `getLocaleCode` 补映射。
- 时间戳改为与语言无关的固定格式 `YYYY-MM-DD HH:mm:ss`（本地时区），避免德语/法语等产生 `17.10.2026, ...`。
- 测试会校验每种语言是否定义了全部 41 个 key（`I18nManager.hasTranslation`）。

## Next Steps
阶段 1 剩余项（按优先级）：
1. “生成即复制”开关（默认关闭），复制后按钮短暂变为 ✓。
2. 弹窗内显示快捷键提示（Enter 生成 / Ctrl+C 复制）。
3. 空状态引导（历史/收藏各带行动按钮）。
4. a11y：历史行可 Tab 聚焦、info 图标可聚焦、`aria-live` 避免整表重渲染。
5. 窄屏响应式打磨（全页面 < 480px）。

之后进入阶段 2：场景预设（Gaming / Social / Email）、批量生成、导出/导入 JSON、`chrome.storage.sync` 跨设备。最后是阶段 3：Chrome Web Store 上架材料与隐私政策。

## Technical Decisions
- **默认 popup + 全页面链接**：`manifest.action.default_popup` 指向 `popup-quick.html`；全页面通过 `chrome.tabs.create(chrome.runtime.getURL('page.html'))` 打开。`tabs.create` 不需要额外权限。
- **共享核心**：生成逻辑在 `modules/generator-core.js`（`UsernameGenerator`），历史读写在 `modules/history-store.js`（`HistoryStore`），提示在 `modules/toast.js`（`Toast`）。弹窗与全页面复用，避免复制粘贴。
- **预览 vs 提交**：`previewUsername()` 只改显示；`commitUsername()` 才写历史。滑条/输入/勾选/单选只预览；Generate、Ctrl+G、Copy 才落库。
- **弹窗预设映射**：quick popup 的 mode 映射到与全页面 preset 一致的角色开关（easyToSay=字母；easyToRead=字母+数字；allCharacters=全开）。
- **弹窗偏好持久化**：`quickSettings`（mode + length）存 `chrome.storage.local`，下次打开恢复。
- **移除 background**：设置 `default_popup` 后 `chrome.action.onClicked` 不再触发，保留 service worker 属死代码，故删除。
- **多语言数据驱动**：语言列表从 `LANGUAGE_NAMES` / `translations` 派生，HTML 不再硬编码 option；`getLocaleCode` 仅用于日期相关能力（当前时间戳已改为固定格式）。
- **时间戳固定格式**：`formatTimestamp` 手工补零拼接，不再依赖 `toLocaleString`，保证跨语言一致。

## Gotchas（不要动）
- **脚本加载顺序**：`page.html` 必须按 i18n → theme → generator-core → history-store → toast → favorites → keyboard → history-filter → csv → popup.js；`popup-quick.html` 必须按 i18n → theme → generator-core → history-store → toast → popup-quick.js。模块是 IIFE `const`，缺一个就会 `ReferenceError`。
- **测试如何加载模块**：`tests/generator.test.js` 用 `new Function(source + 'return X;')` 把 IIFE 挂到 `global`，再 `require` popup.js。不要把模块改成 ESM/CommonJS，否则测试会坏。
- **`popup.js` 全部逻辑在 DOMContentLoaded 内**，每次派发事件都会创建新闭包；测试依赖这一点。
- **`window.__usernameGeneratorState.history` 是 getter**，不要改回普通属性（会捕获旧数组）。
- **`HistoryStore.add` 是 read-modify-write**，快速连点理论上可能丢条目；当前接受，后续可串行化。
- **`easyToSay` 下 numbers/symbols 被 preset 禁用** 是刻意行为。
- **`chrome.storage` 回调必须检查 `chrome.runtime.lastError`**；`storage` 可能为 null（file:// 或普通网页）。
- **新增语言时**：必须同时补 `translations[code]` 的全部 key、`LANGUAGE_NAMES[code]`、`getLocaleCode[code]`，否则测试会红（`hasTranslation` 校验全部 key）。
- **不要把语言 option 的 `textContent` 交给 `data-i18n`**：语言名必须是母语原生写法，由 `getLanguageName` 填充。
- 本地未跟踪的 `.idea/`、`test-v11.html` 是作者个人文件，不要提交或删除。
- 当前工作在 `feature/v1.2-experience` 分支，基于 `origin/master`（`1871d7d`）；8 个提交尚未 push。本地 `master` 已复位到 `origin/master`。
- **工作流**：功能开发先 `git switch -c feature/<name> origin/master`，完成后 PR 合入 `master`/`develop`；不要直接提交到 `master`。注意 `origin/develop` 目前落后 `master` 7 个提交，合入前先同步。
