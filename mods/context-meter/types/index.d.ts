export type ContextPercent = number | null

declare module 'claude-code' {
  interface PluginState {
    'context-meter': { percent: ContextPercent }
  }
}
