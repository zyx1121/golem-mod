<!-- 翻譯自 README.md @ docs/readme-template-v2。只翻 "For AI agents" 以上的章節，英文版更新時一起改。 -->

<div align="center">

<h1>golem-mod</h1>

<p><strong>golem 的告警直接显示在 Claude Code 输入框上方，告警开启或解除时弹出提示。</strong></p>

[![CI](https://img.shields.io/github/actions/workflow/status/zyx1121/golem-mod/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/zyx1121/golem-mod/actions)
[![Release](https://img.shields.io/github/v/release/zyx1121/golem-mod?style=flat-square&sort=semver)](https://github.com/zyx1121/golem-mod/releases)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-mod-d97757?style=flat-square)](https://github.com/anthropics/claude-code/tree/main/mods)
[![License](https://img.shields.io/github/license/zyx1121/golem-mod?style=flat-square)](LICENSE)

[English](README.md) | [繁體中文](README.zh-TW.md) | **简体中文**

</div>

```
╭─ GOLEM ────────────────────────────────╮
│ 1 open  roll.zyx.tw  smart.embed_down… │
╰────────────────────────────────────────╯
```

没人看到的监控，等于悄悄坏掉的监控。[golem](https://golem.zyx.tw) 监看服务并记录告警，golem-mod 把告警拉进你的 Claude Code session，让你工作时就看得到。

## 功能

- **输入框上方一个面板**：未解告警的数量与最新一条，跟其他 band 面板排在同一行。有错误级别时数字变红。
- **变化时弹提示**：session 运行期间告警开启或解除各弹一次，新 session 不会重播旧事件。
- **沉默也看得见**：连续 3 次拉取失败会显示 `unreachable`，边框变红。
- **拉取而不是推送**：session 不一定在线、收不到 webhook，所以 mod 调用 golem 的 `GET /events`。

## 快速开始

Function hooks 还在 early access。在 shell profile，或 `settings.json` 的 `env` 打开它：

```sh
export CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1
```

然后在 Claude Code 安装 mod：

```
/plugin marketplace add zyx1121/golem-mod
/plugin install golem-mod@golem-mod
```

开新 session，有告警未解时面板就会出现。mod 用 `security find-generic-password` 从 macOS 钥匙串的 `kilo/golem-mcp` 读取 golem token，只放在内存里。

## 使用

```
/golem          列出未解告警
```

## 设置

| 设置 | 默认 | 作用 |
|--------|---------|------|
| `url` | `https://golem.zyx.tw` | golem 的地址 |
| `keychainService` | `kilo/golem-mcp` | 存放 token 的钥匙串项目 |
| `pollSeconds` | `30` | 两次拉取的间隔秒数，最少 10 |

## 运作方式

- `hooks/register.tsx` 在 `session.start` 注册 `/golem`，定时拉取，并在 `AbovePrompt` 绘制面板。
- 第一次拉取没有 cursor，只了解 feed 当前的位置。之后每次调用 `GET /events?after=<cursor>`，每条事件弹一次提示。
- `hooks/panel.tsx` 的画法跟其他 band mod 相同，所以它们共用一行。

## 限制

- 只支持 macOS，因为 token 来自钥匙串。需要 Claude Code 并开启 function hooks。
- 每个打开的 session 各自拉取与提示，5 个 session 就会看到 5 次提示。
- golem 需要有拉取 API（`GET /events`），更旧的版本会显示 `unreachable`。

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

## 开发

```sh
bunx -p typescript tsc -p tsconfig.json     # typecheck
claude plugin test .                        # the engine's test harness
```

`types/claude-code.d.ts` 是 Claude Code 2.1.312 的引擎契约，复制使用，不要修改。Release Please 会开发版 PR。

## 许可证

[MIT](LICENSE)
