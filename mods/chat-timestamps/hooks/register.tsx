// ABOUTME: Records when each prompt, mid-turn message and reply row lands
// ABOUTME: and draws its clock time, gap since the previous row and turn totals

import { atom, memberOf, read, update } from 'claude-code'
import type { Register, StateDollar } from 'claude-code'

import type { ChatTimestampsStamp } from '../types'

const stampsRef = { plugin: 'chat-timestamps', key: 'stamps' } as const
const stamps = atom(stampsRef, null)
const turnStartAt = atom({ plugin: 'chat-timestamps', key: 'turnStartAt' } as const, null)
const lastAt = atom({ plugin: 'chat-timestamps', key: 'lastAt' } as const, null)
const lastReplyKeys = atom({ plugin: 'chat-timestamps', key: 'lastReplyKeys' } as const, [])

// The hooks environment may not know the machine's time zone, so the offset
// is read from the host once per load and applied by hand.
let offsetMinutes: number | null = null

const pad = (n: number) => String(n).padStart(2, '0')

export const formatClock = (at: number, offset: number | null) => {
  const d = new Date(offset === null ? at : at + offset * 60_000)
  const hours = offset === null ? d.getHours() : d.getUTCHours()
  const minutes = offset === null ? d.getMinutes() : d.getUTCMinutes()
  const seconds = offset === null ? d.getSeconds() : d.getUTCSeconds()
  const h12 = hours % 12 === 0 ? 12 : hours % 12
  return `${h12}:${pad(minutes)}:${pad(seconds)} ${hours < 12 ? 'AM' : 'PM'}`
}

export const formatElapsed = (ms: number) => {
  const total = Math.max(0, Math.round(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}h ${pad(m)}m ${pad(s)}s`
  if (m > 0) return `${m}m ${pad(s)}s`
  return `${s}s`
}

export const parseOffset = (text: string) => {
  const match = /^([+-])(\d{2})(\d{2})$/.exec(text.trim())
  if (!match) return null
  const sign = match[1] === '-' ? -1 : 1
  return sign * (Number(match[2]) * 60 + Number(match[3]))
}

export const describeStamp = (stamp: ChatTimestampsStamp, offset: number | null) => {
  const parts = [formatClock(stamp.at, offset)]
  if (stamp.kind === 'interjection' && stamp.intoTurnMs !== undefined) {
    parts.push(`${formatElapsed(stamp.intoTurnMs)} into turn`)
  }
  if (stamp.kind === 'reply') {
    // The turn's last block carries the one number that matters: the whole turn.
    if (stamp.turnTotalMs !== undefined) {
      parts.push(`turn done in ${formatElapsed(stamp.turnTotalMs)}`)
    } else {
      if (stamp.sincePrevMs !== undefined) parts.push(`+${formatElapsed(stamp.sincePrevMs)}`)
      if (stamp.intoTurnMs !== undefined) parts.push(`${formatElapsed(stamp.intoTurnMs)} into turn`)
    }
  }
  return parts.join(' · ')
}

const textsOf = (content: readonly { type: string; text?: unknown }[]) =>
  content.flatMap(b => (b.type === 'text' && typeof b.text === 'string' && b.text.trim() !== '' ? [b.text] : []))

// The desktop draws a reply block under the API message id, which the append
// never sees, so reply stamps are also filed under a fingerprint of the text.
export const textKey = (text: string) => {
  let hash = 0x811c9dc5
  const normalized = text.trim()
  for (let i = 0; i < normalized.length; i++) {
    hash ^= normalized.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return `text:${(hash >>> 0).toString(16)}:${normalized.length}`
}

// macOS and Linux answer `date +%z`; Windows answers through PowerShell.
const readOffset = async ($: { process: { run: (argv: readonly string[]) => Promise<{ exitCode: number; stdout: string }> } }) => {
  try {
    const ran = await $.process.run(['date', '+%z'])
    const offset = ran.exitCode === 0 ? parseOffset(ran.stdout) : null
    if (offset !== null) return offset
  } catch {
    // no `date` here; try PowerShell
  }
  try {
    const ran = await $.process.run([
      'powershell',
      '-NoProfile',
      '-Command',
      '[int][TimeZoneInfo]::Local.GetUtcOffset([DateTime]::Now).TotalMinutes',
    ])
    const minutes = Number(ran.stdout.trim())
    if (ran.exitCode === 0 && ran.stdout.trim() !== '' && Number.isInteger(minutes)) return minutes
  } catch {
    // neither answered: fall back to the environment's own clock
  }
  return null
}

const stampTextsIfAbsent = async (
  $: StateDollar,
  texts: readonly string[],
  stamp: ChatTimestampsStamp,
) => {
  for (const text of texts) {
    const ref = { ...stampsRef, id: textKey(text) }
    if ((await $.state.get(ref)).value == null) await $.state.set(ref, stamp)
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    offsetMinutes = await readOffset($)
    return next(e)
  })

  // The desktop draws queued and mid-turn messages under ids the engine never
  // appends, so a message's typed time is also filed under its text.
  on('prompt.submit', async ($, e, next) => {
    try {
      const at = await $.clock.now()
      const started = await read($, turnStartAt)
      const stamp: ChatTimestampsStamp =
        started === null ? { at, kind: 'prompt' } : { at, kind: 'interjection', intoTurnMs: at - started }
      await $.state.set({ ...stampsRef, id: textKey(e.text) }, stamp)
      // Messages the desktop queued arrive joined by blank lines; each one is
      // drawn on its own, so each piece gets the time too, unless it already has one.
      const pieces = e.text.split(/\n\s*\n/)
      if (pieces.length > 1) await stampTextsIfAbsent($, pieces, stamp)
    } catch {
      // a missed stamp must never hold up a prompt
    }
    return next(e)
  })

  on('session.append', async ($, e, next) => {
    const stored = await next(e)
    if (stored.deny !== undefined || e.agentId !== undefined) return stored

    const { type, isMeta, content } = e.message

    if (type === 'attachment') {
      // A message typed mid-turn is folded into the turn as an attachment row,
      // drawn as a UserMessage under this row's id. Other attachments are never
      // drawn there, so stamping them all is harmless.
      const at = await $.clock.now()
      const started = await read($, turnStartAt)
      const stamp: ChatTimestampsStamp =
        started === null ? { at, kind: 'prompt' } : { at, kind: 'interjection', intoTurnMs: at - started }
      await $.state.set({ ...stampsRef, id: stored.uuid }, stamp)
      await stampTextsIfAbsent($, textsOf(content), stamp)
      return stored
    }
    const isUser =
      type === 'user' && isMeta !== true && (e.door === 'prompt' || e.door === 'delivery')
    const texts = textsOf(content)
    const isReply = type === 'assistant' && e.door === 'response' && texts.length > 0
    if (!isUser && !isReply) return stored

    const at = await $.clock.now()
    const prev = await read($, lastAt)
    const started = await read($, turnStartAt)
    const sincePrevMs = prev === null ? undefined : at - prev
    const intoTurnMs = started === null ? undefined : at - started

    let stamp: ChatTimestampsStamp
    if (isUser && started === null) {
      // A prompt arriving while idle starts the turn's clock.
      stamp = { at, kind: 'prompt' }
      await update($, turnStartAt, () => at)
    } else if (isUser) {
      stamp = { at, kind: 'interjection', sincePrevMs, intoTurnMs }
    } else {
      stamp = { at, kind: 'reply', sincePrevMs, intoTurnMs }
    }
    if (isUser) await stampTextsIfAbsent($, texts, stamp)
    const keys = isReply ? [stored.uuid, ...texts.map(textKey)] : [stored.uuid]
    for (const id of keys) await $.state.set({ ...stampsRef, id }, stamp)
    if (isReply) await update($, lastReplyKeys, () => keys)
    await update($, lastAt, () => at)
    return stored
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    if (e.agentId !== undefined) return result

    for (const id of await read($, lastReplyKeys)) {
      const { value } = await $.state.get({ ...stampsRef, id })
      if (value) await $.state.set({ ...stampsRef, id }, { ...value, turnTotalMs: e.durationMs })
    }
    await update($, turnStartAt, () => null)
    await update($, lastReplyKeys, () => [])
    return result
  })

  on('ui.render', { component: 'UserMessage' }, async ($, e, next) => {
    const byText = (await $.state.get({ ...stampsRef, id: textKey(e.props.text) })).value ?? null
    const stamp = byText ?? (await read($, memberOf(stamps, e)))
    if (stamp === null) return next(e)
    const text = `[${describeStamp(stamp, offsetMinutes)}]  ${e.props.text}`
    return next({ ...e, props: { ...e.props, text } })
  })

  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    const byId = await read($, memberOf(stamps, e))
    const stamp = byId ?? (await $.state.get({ ...stampsRef, id: textKey(e.props.text) })).value ?? null
    if (stamp === null) return next(e)
    const text = `${e.props.text}\n\n*${describeStamp(stamp, offsetMinutes)}*`
    return next({ ...e, props: { ...e.props, text } })
  })
}
