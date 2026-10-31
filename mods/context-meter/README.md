# context-meter

Shows how full Claude's context window is, right in the prompt footer beside the model name, so you don't have to open the session panel to check it.

- The footer reads `12% context ⬤`, updated after every reply
- The text and dot are **green** at 50% or less, **yellow** from 51% to 65%, and **red** from 66% up
- Nothing shows until the first reply of a session comes back, or the first reply after a compaction: until then there is nothing measured to show

## Install

See [Install](../../README.md#install) in the repository's README, using `context-meter` wherever it says `chat-timestamps`.

## How it works

Claude Code measures the session's usage after each response; the mod keeps the latest context percentage and draws it as the footer's mode label (the spot where labels like `focus` appear). It changes only what you see.

The Desktop app ignores a mod that only adds a label to that footer's list, so the mod draws its own text there instead. Any other mode label the footer would show is drawn on the same line, in the same color.

## What it reads and calls

`claude plugin validate` lists it; in short:

- **Hooks**: `session.start`, `session.measure`, and `ui.render` for the `SessionMode` component
- **Calls**: `$.session.usage` (the context figures), `$.state.get` / `$.state.set` (the session's own memory)
- No network, no files, nothing stored past the session

## Tests

```bash
claude plugin test mods/context-meter
```
