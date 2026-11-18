import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Feed, Open } from '../types'
import { COLOR, lineOf, panelOf, rowOf } from './panel'
import type { Seg } from './panel'

// A pull that fails this many times in a row shows as "unreachable": a silent monitor is the failure golem exists to catch.
const FAILS_SHOWN = 3

const feed = atom({ plugin: 'golem-mod', key: 'feed' } as const, { open: [], failures: 0 } satisfies Feed, {
  shape: 'feed-1',
})

type Incident = Open & { rule: string }
type Event = { id: number; type: 'opened' | 'resolved'; incident: Incident }
type Pull = { cursor: number; events: Event[]; open: Incident[] }

const line = (i: Open) => `${i.project}  ${i.title}${i.hits > 1 ? ` x${i.hits}` : ''}`

async function readToken($: EngineInterface, service: string): Promise<string | null> {
  const run = await $.process.run(['security', 'find-generic-password', '-s', service, '-w'], { timeoutMs: 5000 })
  const token = run.stdout.trim()
  return run.exitCode === 0 && token ? token : null
}

async function pull($: EngineInterface, url: string, token: string, after: number | null): Promise<Pull | null> {
  const query = after === null ? '' : `?after=${after}`
  const res = await $.http.fetch(`${url.replace(/\/$/, '')}/events${query}`, {
    headers: { authorization: `Bearer ${token}` },
  })
  return res.ok ? (JSON.parse(res.text) as Pull) : null
}

type Conf = { url: string; service: string }
// The cursor and the token live for the session; a reload starts them over.
const link: { cursor: number | null; token: string | null } = { cursor: null, token: null }

async function tick($: EngineInterface, conf: Conf) {
  link.token ??= await readToken($, conf.service)
  let got: Pull | null = null
  if (link.token !== null) {
    try {
      got = await pull($, conf.url, link.token, link.cursor)
    } catch {
      got = null
    }
  }
  if (got === null) return void (await update($, feed, f => ({ ...f, failures: f.failures + 1 })))
  // The first pull only learns where the feed is, so a new session does not replay old alerts.
  if (link.cursor !== null) {
    for (const e of got.events) {
      $.ui.toast(`golem ${e.type === 'opened' ? e.incident.severity : 'resolved'}: ${line(e.incident)}`)
    }
  }
  link.cursor = got.cursor
  const open = got.open
  await update($, feed, () => ({ open, failures: 0 }))
}

export const register: Register = (on, options) => {
  const conf: Conf = { url: String(options.url || 'https://golem.zyx.tw'), service: String(options.keychainService || 'kilo/golem-mcp') }
  const seconds = Math.max(10, Number(options.pollSeconds) || 30)

  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'golem', description: 'List the open golem incidents' })
    void tick($, conf)
    $.clock.every(seconds * 1000, () => tick($, conf))
    return next(e)
  })

  on('command.run', { command: 'golem' }, async $ => {
    await tick($, conf)
    const { open, failures } = await read($, feed)
    if (failures >= FAILS_SHOWN) return { text: 'golem is unreachable.' }
    return { text: open.length === 0 ? 'No open incidents.' : open.map(i => `${i.severity.toUpperCase()}  ${line(i)}`).join('\n') }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const { open, failures } = await read($, feed)
    const down = failures >= FAILS_SHOWN
    if (e.props.hasSurvey || (open.length === 0 && !down)) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    const kit = { Box, Text }
    const hot = open.some(i => i.severity === 'error') ? COLOR.error : COLOR.warn
    const first = open[0]
    const segs: Seg[] = down || first === undefined
      ? [{ text: 'unreachable', color: COLOR.error }]
      : [
          { text: `${open.length} open`, color: hot, bold: true },
          { text: `  ${line(first)}`, color: COLOR.text },
          ...(open.length > 1 ? [{ text: `  +${open.length - 1}`, color: COLOR.label }] : []),
        ]
    // The whole band width: the panel sits on a row of its own, so the incident title shows in full.
    const width = e.props.bodyColumns
    const panel = panelOf(kit, { title: 'GOLEM', tone: down ? 'error' : 'normal', width }, lineOf(kit, segs))
    // This mod's panel, then what is beneath; at the whole band width the panel takes a row of its own.
    return rowOf(kit, [panel], await next(e))
  })
}
