# golem-mod

Claude Code mod (a function-hooks plugin). `hooks/register.tsx` exports `register(on, options)`. It pulls `GET /events` from golem and draws the `AbovePrompt` line, toasts and `/golem`. Read [README.md](README.md) first.

## Rules

- The loader rejects a hooks module that breaks an engine rule, and the whole mod then fails to load. Pass `$` only to a top-level function.
- The token comes from the macOS keychain and stays in memory. Never write it to a file, a log or a toast.
- The first pull only learns the cursor. A new session must not replay old events.
- A monitor that fails must show it: 3 failed pulls in a row show `unreachable`.
- Repository documents and code comments are English. No em dashes.

## Verify

```sh
claude plugin validate .
claude plugin test .
```

To run from source, use `claude --plugin-dir .`. A running session does not reload hooks, so restart it.
