// ABOUTME: Checks the clock, elapsed-time and UTC-offset formatting the
// ABOUTME: time labels on prompt and reply rows are built from

import { expect, test } from 'claude-code/testing'

import { describeStamp, formatClock, formatElapsed, parseOffset, textKey } from '../hooks/register'

const PROMPT_AT = Date.UTC(2026, 9, 13, 14, 0, 0)

test('formats clock times with a fixed offset', async () => {
  expect(formatClock(PROMPT_AT, 0)).toBe('2:00:00 PM')
  expect(formatClock(PROMPT_AT, -300)).toBe('9:00:00 AM')
  expect(formatClock(Date.UTC(2026, 0, 1, 0, 5, 9), 0)).toBe('12:05:09 AM')
})

test('formats elapsed time', async () => {
  expect(formatElapsed(4_400)).toBe('4s')
  expect(formatElapsed(125_000)).toBe('2m 05s')
  expect(formatElapsed(3_725_000)).toBe('1h 02m 05s')
})

test('parses date +%z output', async () => {
  expect(parseOffset('-0500\n')).toBe(-300)
  expect(parseOffset('+0530')).toBe(330)
  expect(parseOffset('garbage')).toBe(null)
})

test('describes each kind of row', async () => {
  const at = PROMPT_AT + 125_000
  expect(describeStamp({ at: PROMPT_AT, kind: 'prompt' }, 0)).toBe('2:00:00 PM')
  expect(describeStamp({ at, kind: 'interjection', sincePrevMs: 5_000, intoTurnMs: 125_000 }, 0))
    .toBe('2:02:05 PM · 2m 05s into turn')
  expect(describeStamp({ at, kind: 'reply', sincePrevMs: 45_000, intoTurnMs: 125_000 }, 0))
    .toBe('2:02:05 PM · +45s · 2m 05s into turn')
  expect(
    describeStamp({ at, kind: 'reply', sincePrevMs: 12_000, intoTurnMs: 125_000, turnTotalMs: 130_000 }, 0),
  ).toBe('2:02:05 PM · turn done in 2m 10s')
})

test('text fingerprints ignore surrounding whitespace and tell texts apart', async () => {
  expect(textKey('  hello\n')).toBe(textKey('hello'))
  expect(textKey('hello')).not.toBe(textKey('hellp'))
})
