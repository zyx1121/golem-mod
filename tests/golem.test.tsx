import { expect, mock, test } from 'claude-code/testing'

const BAND = {
  plugin: 'golem-mod',
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: false, maxRows: 5, bodyColumns: 100 },
} as const

const open = [{ id: 'a', rule: 'log.warn', project: 'roll.zyx.tw', title: 'smart.embed_down', severity: 'warn', hits: 33 }]

function engine(on: Parameters<Parameters<typeof test>[1]>[1], feed: unknown, ok = true) {
  on('command.register', () => ({ value: { command: 'golem' } }))
  on('process.run', () => ({ value: { exitCode: 0, stdout: 'token\n', stderr: '' } }))
  on('http.fetch', (_, e) => {
    expect(e.url).toBe('https://golem.zyx.tw/events')
    expect(e.init?.headers?.authorization).toBe('Bearer token')
    return { value: { status: ok ? 200 : 503, ok, headers: {}, text: JSON.stringify(feed) } }
  })
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  return mock.clock(on)
}

test('an open incident shows above the prompt', async ($, on) => {
  const clock = engine(on, { cursor: 2, events: [], open })
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await clock.settle()

  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect((await ui.find({ type: 'Text', text: /1 open/ }))?.text).toBe('1 open  roll.zyx.tw  smart.embed_down x33')
  await ui.unmount()
})

test('nothing open leaves the band to the engine', async ($, on) => {
  const clock = engine(on, { cursor: 0, events: [], open: [] })
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await clock.settle()

  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect((await ui.find({ type: 'Text', text: /engine/ }))?.text).toBe('engine')
  expect(await ui.find({ type: 'Text', text: /GOLEM/ })).toBeUndefined()
  await ui.unmount()
})

test('a new event toasts once, and the first pull replays nothing', async ($, on) => {
  const feeds = [
    { cursor: 2, events: [{ id: 1, type: 'opened', incident: open[0] }], open },
    { cursor: 4, events: [{ id: 3, type: 'resolved', incident: open[0] }], open: [] },
  ]
  let pulls = 0
  const toasts: string[] = []
  on('command.register', () => ({ value: { command: 'golem' } }))
  on('process.run', () => ({ value: { exitCode: 0, stdout: 'token\n', stderr: '' } }))
  on('http.fetch', (_, e) => {
    // The first pull has no cursor; the next one asks after the cursor it got.
    expect(e.url).toBe(pulls === 0 ? 'https://golem.zyx.tw/events' : 'https://golem.zyx.tw/events?after=2')
    return { value: { status: 200, ok: true, headers: {}, text: JSON.stringify(feeds[pulls++]) } }
  })
  on('ui.toast', (_, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  const clock = mock.clock(on)

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await clock.settle()
  expect(toasts).toEqual([])

  await clock.advance(30_000)
  expect(toasts).toEqual(['golem resolved: roll.zyx.tw  smart.embed_down x33'])
})
