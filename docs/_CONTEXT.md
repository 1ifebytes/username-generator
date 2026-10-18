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
1. ~~“生成即复制”开关（默认关闭），复制后按钮短暂变为 ✓。~~ ✅
2. ~~弹窗内显示快捷键提示（Enter 生成 / Ctrl+C 复制）。~~ ✅
3. ~~空状态引导（历史/收藏各带行动按钮）。~~ ✅（历史空状态带 “Generate one”）
4. ~~a11y：历史行可 Tab 聚焦、info 图标可聚焦、`aria-live` 避免整表重渲染。~~ ✅
5. ~~窄屏响应式打磨（全页面 < 480px）。~~ ✅

阶段 2 剩余项：
- ✅ 场景预设、✅ 批量生成、✅ JSON 导入/导出、✅ `chrome.storage.sync` 同步

阶段 3 进度：
- ✅ GitHub Pages 已开启（`master` + `/docs`），隐私政策 URL 已上线：
  `https://1ifebytes.github.io/username-generator/privacy.html`
- ✅ `docs/_config.yml` 已排除内部文档，只有 `privacy.html` 对外（其余返回 404）
- ⬜ 用 `dist/username-generator-1.2.0.zip` 上传到 Chrome Web Store 开发者后台
- ⬜ 按 `store/checklist.html` 填写商店信息与隐私声明
- ⬜ 审核通过后把商店链接写回 `README.md`

若审核后需要改动，版本升为 `1.2.1`（manifest + package.json 同步）并新打 tag，不要移动 `v1.2.0`。

仓库待清理：`feature/full-page-history`、`feature/ux-optimization` 已完全并入 `master`，可删除。最后是阶段 3：Chrome Web Store 上架材料与隐私政策。

## Technical Decisions
- **Pages 源固定为 `master` + `/docs`**：`docs/_config.yml` 用 `exclude` 屏蔽 `_CONTEXT.md`/`PRD.md`/`iOS-App-Analysis.md`；新增文档时记得同步排除，否则会被公开。
- **提审清单是 HTML 而非 Markdown**：`store/checklist.html` 自带样式、可勾选清单（localStorage 持久化）与代码复制按钮，直接双击即可在浏览器查看；`store/CHECKLIST.md` 已删除。
- **打包只包含运行时文件**：`scripts/package.sh` 显式列文件，排除 `test.html` 与 docs；打包前用 Node 校验 manifest 引用的所有资源都存在。
- **截图可复现**：截图通过 `python3 -m http.server` + 无头浏览器注入 `chrome.storage` mock 生成，seed 数据由 URL query 驱动，不依赖真实扩展环境。
- **同步用适配器而不用改模块**：`modules/sync-store.js` 提供与 `chrome.storage.local` 同形的 `get/set/remove`，`popup.js` 与 `popup-quick.js` 只把 `storage` 换成 `SyncStore.createStorage()`，I18n/Theme/Favorites/quickSettings 无需改动。
- **只同步白名单**：`usernameFavorites`、`themePreference`、`languagePreference`、`quickSettings`；`usernameHistory` 永不出本机，隐私叙事不破。
- **收藏在读取时取并集**：两台设备各自的收藏取并集（同 username 取最新 timestamp，上限 100）。因为写入是整数组覆盖，删除也能正确同步。
- **同步失败不影响本地**：quota/网络错误只 `console.error`，`set` 仍先写 local 再写 sync。
- **迁移不再清空收藏**：`migrateStorage` 改为读取现有值后再写，避免覆盖另一台设备同步来的收藏。
- **堆叠 PR 必须用 merge commit 合并**：squash/rebase 会让子分支重新出现父分支的提交。合并顺序必须是栈底→栈顶，且每次合并后先把下一个 PR 的 base 手动改成 `master`，否则删掉 base 分支会让子 PR 被 GitHub 自动关闭。
- **导入采用“并集 + 最新时间戳”**：按 username 去重，timestamp 新者胜，然后降序排序并截断到 50（`DataPortability.merge`）。不会覆盖本地数据。
- **导出格式带 `app` 标识**：`{ app: 'username-generator', version: 2, exportedAt, history, favorites }`，解析时校验 app，防止误导入无关 JSON。
- **缺失 timestamp 回退为 now()**：导入旧格式或手写 JSON 时仍能工作（代价是该条会排到最前）。
- **预设是“应用”而非“模式”**：`modules/presets.js` 只声明一组目标值（mode + length + 四个勾选），点击时先 `applyModeDefaults(mode)`，再用预设覆盖勾选，这样“社交账号=仅小写”这种组合不会被 mode 默认值冲掉。
- **预设状态用 `aria-pressed`**：手动改动任一选项会把所有 chip 置为 `false`（`updatePresetChipState(null)`）。
- **批量生成不自动入历史**：先生成 10 个候选，点击某个才写历史 + 复制，避免一次污染 10 条记录。
- **全局 `box-sizing: border-box`**：`popup.css` 之前缺少该规则，导致 `input[type=number]` 的 `width:100%` 加上 padding/border 后溢出 26px。
- **自动复制默认关闭**：用户在弹窗勾选后存入 `quickSettings.autoCopy`；只在 `Generate` 路径触发复制，预览不会。
- **复制的无障碍入口**：历史行本身不加 `role=button`（内部有星标/删除按钮），而是把 `.history-text` 设为 `tabindex=0` + `role=button` + `aria-label`，回车/空格复制。
- **aria-live 只在两处**：`.username-display`（新用户名）与 toast。历史/收藏列表不再整表播报。
- **空状态抽成 `.empty-state` 容器**：文字 + 行动按钮，`renderHistory` 用 `display:flex/none` 切换。
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
- **`#empty-history` 现在是 `.empty-state` div**，`renderHistory` 用 `display='flex'` 而不是 `'block'`；`#empty-favorites` 仍是 `<p>`（`block`）。改样式时不要混。
- **模块是 `const` 全局词法绑定，不是 `window` 属性**：浏览器里 `FavoritesManager` 可用但 `window.FavoritesManager` 是 `undefined`。调试/自动化时直接写裸名。
- **`SyncStore` 必须在 `popup.js` / `popup-quick.js` 之前加载**，否则会回退成直接用 `chrome.storage.local`（不报错，但不同步）。
- **改 UI 后需重生成截图**：`store/screenshots/*.png` 是静态文件，不会自动更新；重新生成后检查是否仍为 1280×800 且无 alpha。
- **`npm run package` 依赖 macOS 自带的 `zip`/`unzip`**；CI 上用 Ubuntu 也能跑（已安装 zip）。
- **测同步时**：`tests/generator.test.js` 的 mock 只有 `storage.local`，没有 `sync`；同步专项用例自己用 `createAreaMock` 构造两个 area。
- **`applyModeDefaults` 会覆盖四个勾选**：`applyNamedPreset` 必须在它之后再覆盖勾选，顺序不能反。
- **`batch-grid:empty { display: none }`** 让批量区域在未生成时消失，不要在 JS 里再手动 toggle display。
- **复制按钮闪烁用 `textContent = '✓'`**，恢复时用 `I18nManager.t('button.copy')`，所以不要在恢复逻辑里写死英文。
- **复制按钮闪烁用 `textContent = '✓'`**，恢复时用 `I18nManager.t('button.copy')`，所以不要在恢复逻辑里写死英文。
- **不要把语言 option 的 `textContent` 交给 `data-i18n`**：语言名必须是母语原生写法，由 `getLanguageName` 填充。
- 本地未跟踪的 `.idea/`、`test-v11.html` 是作者个人文件，不要提交或删除。
- **v1.2 已全部合入 `master`**（`7f4c5cf`），PR #1~#4 均为 merge commit，功能分支已删除。`develop` 已 fast-forward 到 `master`。
- **v1.2.0 已发布**：tag `v1.2.0` + GitHub Release。`master` = `develop` = `a0aa998`。
- 已删除过期分支：`feature/full-page-history`、`feature/ux-optimization`；远端仅剩 `master` / `develop`。
- **阶段 1 全部完成**：自动复制开关、复制按钮 ✓ 反馈、快捷键提示、空状态引导、a11y（历史行可键盘聚焦、info 图标可聚焦、去掉列表 aria-live）、窄屏响应式（≤480px）。
- **工作流**：功能开发先 `git switch -c feature/<name> origin/master`，完成后 PR 合入 `master`/`develop`；不要直接提交到 `master`。注意 `origin/develop` 目前落后 `master` 7 个提交，合入前先同步。
