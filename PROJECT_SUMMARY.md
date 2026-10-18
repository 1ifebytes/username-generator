# Project Summary / 项目概要

## English Overview
- **Purpose**: Chrome extension for customizable username generation with options for pronounceable, readable, or fully random strings.
- **Key Files**:
  - `chrome-extension/manifest.json`: Declares extension metadata, action, icons, and storage permission.
  - `chrome-extension/page.html`: Defines the full-page UI with generation mode radios, character-type checkboxes, length inputs, history, favorites, and action buttons.
  - `chrome-extension/popup.css`: Styles the page layout and components.
  - `chrome-extension/popup.js`: Handles option collection, username generation strategies, clipboard copying, history, and tooltip interactions.
- **Generation Logic** (in `popup.js`):
  - Gathers user selections (length, mode, character sets) to build options.
  - "Easy to say" mode builds syllables from vowel/consonant patterns and optional numeric/symbol suffixes.
  - "Easy to read" mode removes ambiguous characters and avoids consecutive duplicates.
  - "All characters" mode chooses random characters from the selected sets.
- **User Interactions**:
  - Number input and range slider stay synchronized and regenerate usernames on change.
  - Generate button refreshes the username; copy button writes it to the clipboard and shows a timed success banner.
  - Info icons reveal context text on hover to explain each generation mode.

## 中文概览
- **用途**：用于生成自定义用户名的 Chrome 扩展，可选择易读、易说或完全随机的字符串。
- **关键文件**：
  - `chrome-extension/manifest.json`：声明扩展元数据、action、图标及存储权限。
  - `chrome-extension/page.html`：定义全页面界面，包括模式单选、字符类型多选、长度输入、历史、收藏和操作按钮。
  - `chrome-extension/popup.css`：为界面布局和控件提供样式。
  - `chrome-extension/popup.js`：处理选项收集、用户名生成策略、剪贴板复制、历史记录和提示互动。
- **生成逻辑**（位于 `popup.js`）：
  - 汇总用户选择（长度、模式、字符集）形成参数。
  - “易于发音”模式基于元音/辅音模式构造音节，并可附加数字或符号后缀。
  - “易于阅读”模式移除易混淆字符并避免连续重复。
  - “所有字符”模式按选择的字符集随机生成。
- **用户交互**：
  - 数字输入与滑块同步，变更时会重新生成用户名。
  - 生成按钮刷新用户名，复制按钮写入剪贴板并展示三秒提示。
  - 信息图标悬停时展示模式说明。
