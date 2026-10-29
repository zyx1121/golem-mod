# golem-mod

**golem alerts in Claude Code: a line above the prompt while an incident is open, and a toast when one opens or resolves.**

```
GOLEM 1 open  roll.zyx.tw  smart.embed_down x43
```

[golem](https://golem.zyx.tw) watches services and keeps incidents. golem-mod pulls them, because a Claude Code session is not always online and cannot receive a webhook. Your sessions then see an alert while you work.

## Features

- **One line above the prompt**: the open count and the newest incident. It turns red when one is an error.
- **A toast on change**: an incident that opens or resolves while the session runs. A new session does not replay old events.
- **`/golem`**: lists the open incidents.
- **Silence is visible**: 3 failed pulls in a row show `unreachable`.

## Quick start

Function hooks are in early access. Turn them on in your shell profile, or in `settings.json` under `env`:

```sh
export CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1
```

Install the mod from a local clone:

```sh
claude plugin marketplace add /path/to/golem-mod
claude plugin install golem-mod@golem-mod
```

The mod reads the golem token from the macOS keychain item `kilo/golem-mcp` with `security find-generic-password`. The token stays in memory.

## Options

| Option | Default | What it does |
| --- | --- | --- |
| `url` | `https://golem.zyx.tw` | Where golem runs. |
| `keychainService` | `kilo/golem-mcp` | The keychain item that holds the token. |
| `pollSeconds` | `30` | Seconds between pulls. 10 at the least. |

## How it works

The mod calls `GET /events?after=<cursor>` with the token as a Bearer header. The first pull has no cursor and only learns where the feed is. Each later pull asks for what came after, and shows a toast for each event.

## Development

```sh
claude plugin validate .
claude plugin test .
```

## License

[MIT](LICENSE)
