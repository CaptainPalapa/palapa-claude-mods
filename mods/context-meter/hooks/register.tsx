// ABOUTME: Shows how full the session's context window is as a label in the prompt footer
// ABOUTME: Refreshes the figure each time the engine re-measures session usage

import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

const percent = atom({ plugin: 'context-meter', key: 'percent' } as const, null)

// Green through half full, yellow to 65%, red past that
const fillColor = (value: number) => (value <= 50 ? 'success' : value <= 65 ? 'warning' : 'error')

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const usage = await $.session.usage()
    await update($, percent, () => usage.context.percent ?? null)

    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    await update($, percent, () => e.context.percent ?? null)

    return next(e)
  })

  // The desktop drops labels added to `modes`, so the footer draws its own text
  on('ui.render', { component: 'SessionMode' }, async ($, e, next) => {
    const value = await read($, percent)

    if (value === null) {
      return next(e)
    }

    const { Text } = $.ui.resolve(e)
    const label = [`${value}% context`, ...e.props.modes].join(' & ')

    return <Text color={fillColor(value)}>{label} ⬤</Text>
  })
}
