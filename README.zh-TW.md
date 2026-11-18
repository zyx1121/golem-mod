<!-- 翻譯自 README.md @ docs/readme-template-v2。只翻 "For AI agents" 以上的章節，英文版更新時一起改。 -->

<div align="center">

<h1>golem-mod</h1>

<p><strong>golem 的告警直接顯示在 Claude Code 輸入框上方，告警開啟或解除時跳出提示。</strong></p>

[![CI](https://img.shields.io/github/actions/workflow/status/zyx1121/golem-mod/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/zyx1121/golem-mod/actions)
[![Release](https://img.shields.io/github/v/release/zyx1121/golem-mod?style=flat-square&sort=semver)](https://github.com/zyx1121/golem-mod/releases)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-mod-d97757?style=flat-square)](https://github.com/anthropics/claude-code/tree/main/mods)
[![License](https://img.shields.io/github/license/zyx1121/golem-mod?style=flat-square)](LICENSE)

[English](README.md) | **繁體中文** | [简体中文](README.zh-CN.md)

</div>

```
╭─ GOLEM ────────────────────────────────╮
│ 1 open  roll.zyx.tw  smart.embed_down… │
╰────────────────────────────────────────╯
```

沒人看到的監控，等於悄悄壞掉的監控。[golem](https://golem.zyx.tw) 監看服務並記錄告警，golem-mod 把告警拉進你的 Claude Code session，讓你工作時就看得到。

## 功能

- **輸入框上方一個面板**：未解告警的數量與最新一筆，自己佔一整列。有錯誤等級時數字變紅。
- **變化時跳提示**：session 執行期間告警開啟或解除各跳一次，新 session 不會重播舊事件。
- **沉默也看得見**：連續 3 次拉取失敗會顯示 `unreachable`，框線變紅。
- **拉取而不是推送**：session 不一定在線、收不到 webhook，所以 mod 呼叫 golem 的 `GET /events`。

## 快速開始

Function hooks 還在 early access。在 shell profile，或 `settings.json` 的 `env` 打開它：

```sh
export CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1
```

然後在 Claude Code 安裝 mod：

```
/plugin marketplace add zyx1121/golem-mod
/plugin install golem-mod@golem-mod
```

開新 session，有告警未解時面板就會出現。mod 用 `security find-generic-password` 從 macOS 鑰匙圈的 `kilo/golem-mcp` 讀 golem token，只放在記憶體裡。

## 使用

```
/golem          列出未解告警
```

## 設定

| 設定 | 預設 | 作用 |
|--------|---------|------|
| `url` | `https://golem.zyx.tw` | golem 的位置 |
| `keychainService` | `kilo/golem-mcp` | 存 token 的鑰匙圈項目 |
| `pollSeconds` | `30` | 兩次拉取的間隔秒數，最少 10 |

## 運作方式

- `hooks/register.tsx` 在 `session.start` 註冊 `/golem`，定時拉取，並在 `AbovePrompt` 畫面板。
- 第一次拉取沒有 cursor，只學習 feed 目前的位置。之後每次呼叫 `GET /events?after=<cursor>`，每筆事件跳一次提示。
- `hooks/panel.tsx` 的畫法跟其他 band mod 相同。引擎讓每個 mod 各佔一列。

## 限制

- 只支援 macOS，因為 token 來自鑰匙圈。需要 Claude Code 並開啟 function hooks。
- 每個開著的 session 各自拉取與提示，5 個 session 就會看到 5 次提示。
- golem 需要有拉取 API（`GET /events`），更舊的版本會顯示 `unreachable`。

## For AI agents

Facts for coding agents and LLM tools. The rules for changing the code are in [AGENTS.md](AGENTS.md).

- **Summary**: Claude Code function-hooks mod that shows golem incidents above the prompt and as toasts.
- **Type**: plugin
- **Interfaces**: slash command `/golem`, `AbovePrompt` UI panel, `ui.toast`
- **Install**: `/plugin marketplace add zyx1121/golem-mod`, then `/plugin install golem-mod@golem-mod`
- **Run**: `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1 claude --plugin-dir .`
- **Verify**: `bunx -p typescript tsc -p tsconfig.json && claude plugin test .`
- **Config**: plugin options `url`, `keychainService`, `pollSeconds`
- **Secrets**: the golem token, read from the macOS keychain and kept in memory. Never written to a file, a log or a toast.
- **Limits**: macOS. Needs golem with `GET /events`.

## 開發

```sh
bunx -p typescript tsc -p tsconfig.json     # typecheck
claude plugin test .                        # the engine's test harness
```

`types/claude-code.d.ts` 是 Claude Code 2.1.312 的引擎契約，複製使用，不要修改。Release Please 會開發版 PR。

## 授權

[MIT](LICENSE)
