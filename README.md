<div align="center">

<h1>golem-mod</h1>

<p><strong>golem incidents above the Claude Code prompt, with a toast when one opens or resolves.</strong></p>

[![CI](https://img.shields.io/github/actions/workflow/status/zyx1121/golem-mod/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/zyx1121/golem-mod/actions)
[![Release](https://img.shields.io/github/v/release/zyx1121/golem-mod?style=flat-square&sort=semver)](https://github.com/zyx1121/golem-mod/releases)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-mod-d97757?style=flat-square)](https://github.com/anthropics/claude-code/tree/main/mods)
[![License](https://img.shields.io/github/license/zyx1121/golem-mod?style=flat-square)](LICENSE)

**English** | [繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md)

</div>

```
╭─ GOLEM ────────────────────────────────╮
│ 1 open  roll.zyx.tw  smart.embed_down… │
╰────────────────────────────────────────╯
```

A monitor nobody sees is a monitor that failed silently. [golem](https://golem.zyx.tw) watches services and keeps incidents. golem-mod pulls them into your Claude Code session, so you see an alert while you work.

## Features

- **One panel above the prompt**: the open count and the newest incident, next to the other band panels. The count turns red when one is an error.
- **A toast on change**: an incident that opens or resolves while the session runs. A new session does not replay old events.
- **Silence is visible**: 3 failed pulls in a row show `unreachable` and turn the border red.
- **Pull, not push**: a session is not always online and cannot receive a webhook, so the mod calls golem's `GET /events`.

## Quick start

Function hooks are in early access. Turn them on in your shell profile, or in `settings.json` under `env`:

```sh
export CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1
```

Then install the mod in Claude Code:

```
/plugin marketplace add zyx1121/golem-mod
/plugin install golem-mod@golem-mod
```

Start a new session. The panel appears while an incident is open. The mod reads the golem token from the macOS keychain item `kilo/golem-mcp` with `security find-generic-password`, and keeps it in memory only.

## Usage

```
/golem          list the open incidents
```

## Configuration

| Setting | Default | Does |
|--------|---------|------|
| `url` | `https://golem.zyx.tw` | where golem runs |
| `keychainService` | `kilo/golem-mcp` | the keychain item that holds the token |
| `pollSeconds` | `30` | seconds between pulls, 10 at least |

## How it works

- `hooks/register.tsx` registers `/golem` on `session.start`, pulls on a timer and draws the panel on `AbovePrompt`.
- The first pull has no cursor and only learns where the feed is. Each later pull asks `GET /events?after=<cursor>` and toasts each event.
- `hooks/panel.tsx` draws the panel the same way as the other band mods, so they share one row.

## Limits

- macOS only, because the token comes from the keychain. Claude Code with function hooks turned on.
- Each open session pulls and toasts on its own. With 5 sessions, you see 5 toasts.
- golem needs the pull API (`GET /events`), so a golem older than that gives `unreachable`.

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

## Development

```sh
bunx -p typescript tsc -p tsconfig.json     # typecheck
claude plugin test .                        # the engine's test harness
```

`types/claude-code.d.ts` is the engine contract of Claude Code 2.1.312. Copy it, do not edit it. Release Please opens the release PR.

## License

[MIT](LICENSE)
