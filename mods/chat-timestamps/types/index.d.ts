export type ChatTimestampsStamp = {
  /** Epoch ms when the row was appended to the conversation. */
  at: number
  /** `prompt` starts a turn; `interjection` is the person typing mid-turn. */
  kind: 'prompt' | 'interjection' | 'reply'
  /** Ms since the previous visible row (prompt, interjection or text reply). */
  sincePrevMs?: number
  /** Ms since the prompt that started the running turn. */
  intoTurnMs?: number
  /** Set on the turn's last text reply once the turn ends: its wall-clock length. */
  turnTotalMs?: number
}

declare module 'claude-code' {
  interface PluginState {
    'chat-timestamps': {
      stamps: StateFamily<ChatTimestampsStamp | null>
      /** Epoch ms of the prompt that started the running turn; null when idle. */
      turnStartAt: number | null
      /** Epoch ms of the last visible row. */
      lastAt: number | null
      /** Stamp ids of the running turn's latest text reply, finalized at turn.complete. */
      lastReplyKeys: string[]
    }
  }
}
