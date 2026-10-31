import { expect, test } from 'claude-code/testing'

const FOOTER = {
  plugin: 'context-meter',
  component: 'SessionMode',
  surface: 'desktop',
  props: { modes: [] },
} as const

const cases = [
  [12, 'success'],
  [50, 'success'],
  [51, 'warning'],
  [65, 'warning'],
  [66, 'error'],
  [97, 'error'],
] as const

for (const [percent, color] of cases) {
  test(`${percent}% draws in ${color}`, async ($, on) => {
    on('state.get', () => ({ value: { value: percent, version: 1 } }))

    const ui = await $.ui.mount(FOOTER)

    const label = await ui.find({ type: 'Text', text: /context/ })

    expect(label?.text).toBe(`${percent}% context ⬤`)
    expect(label?.props.color).toBe(color)
    await ui.unmount()
  })
}
