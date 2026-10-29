export type Open = { id: string; project: string; title: string; severity: 'warn' | 'error'; hits: number }
export type Feed = { open: Open[]; failures: number }

declare module 'claude-code' {
  interface PluginState {
    'golem-mod': { feed: Shaped<Feed> }
  }
}
