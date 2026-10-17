# Username Generator — Session Context

## Current Status
- 本地仓库已同步到 `origin/master`（`1871d7d`），历史干净，master == origin/master。
- 已完成 **阶段 0（地基）**，两个提交：
  - `3a69ea1` chore: remove dead popup.html, add icon sizes, and set up CI
  - `30c6d8c` fix: stop writing history on every option change and use toast feedback
- 9/9 Jest 测试通过；`node --check` 与 manifest JSON 校验通过。

## Next Steps
按优先级，下一步是 **阶段 1（体验升级）**：
1. 在 manifest 加 `default_popup`，做一个「一键生成 + 复制 + 打开全页面」的轻量弹窗（全页面保留历史/收藏）。
2. 生成即复制（可开关），复制成功按钮态变化。
3. 快捷键提示、空状态引导、窄屏响应式、a11y（历史行可 Tab 聚焦）。
4. 之后再进阶段 2：场景预设（Gaming / Social / Email）、批量生成、`chrome.storage.sync`。

## Technical Decisions
- **预览与提交分离**：`previewUsername()` 只改显示；`commitUsername()` 才写历史。滑条/勾选/单选只预览，Generate / 快捷键 / Copy 才落库。这是为了防止历史被拖拽刷屏。
- **Toast 替代 alert**：`showToast(message, type)` 动态创建 `#toast`，非阻塞、2s 自动消失、复用同一节点。样式在 `popup.css`，用 CSS 变量支持深色模式。
- **`window.__usernameGeneratorState.history` 改为 getter**：模块每次读到的都是当前数组，避免初始化时捕获空数组的陈旧引用。
- **删除 `popup.html`**：它已不在 manifest 中、不可达，且缺少历史/收藏容器。阶段 1 会用全新弹窗替代。
- **图标分层**：`icon.png`（128）保留给 `page.html`，`icons/icon{16,32,48}.png` 供 manifest 使用（`sips` 生成）。
- **版本统一为 `1.2.0`**（manifest 与 package.json）。

## Gotchas（不要动）
- `popup.js` 全部逻辑在 `DOMContentLoaded` 回调内，每次派发事件都会创建全新闭包；测试依赖这一点，不要把它提到顶层。
- `page.html` 与 `popup.js` 的 DOM id 必须保持一致；测试直接从 `page.html` 读 DOM。
- 测试通过 `window.__usernameGeneratorTestHelpers` 访问 `upsertHistory / formatTimestamp / generateUsername / getOptions`，改这些签名会破坏测试。
- `easyToSay` 模式下 numbers/symbols 会被 preset 禁用，这是刻意行为。
- 历史去重置顶逻辑在 `upsertHistory`：先按 username 过滤，再 unshift，再按 timestamp 排序，最后截断 50。
- `chrome.storage` 回调里必须检查 `chrome.runtime.lastError`；`storage` 可能为 null（非扩展环境）。
- 本地未跟踪文件 `.idea/` 与 `test-v11.html` 是作者个人的，不要提交或删除。
- 尚未 push；提交只在本地。
