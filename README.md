# claude-mods

Mods for [Claude Code](https://code.claude.com/docs/en/plugins/mods/overview): small plugins that change how its interface looks and behaves. They work in the Claude Code CLI and in the Code tab of the Claude Desktop app (Claude Code 2.1.287 or later).

This repository is a plugin marketplace. Each mod lives in its own folder under `mods/`.

| Mod | What it does |
| --- | --- |
| [chat-timestamps](mods/chat-timestamps) | Timestamps on your messages and Claude's replies, how far into the turn each one came, and the turn's total on the last reply |

## Install

At a Claude Code prompt in a terminal:

```
/plugin install chat-timestamps --marketplace CaptainPalapa/claude-mods
```

Or from your shell:

```bash
claude plugin marketplace add CaptainPalapa/claude-mods
claude plugin install chat-timestamps@claude-mods
```

A mod installed at the user scope also loads in the Desktop app's Code tab.

## Before you install

A mod is code that runs inside Claude Code with your permissions. Read it first, or list what it hooks and calls without running it:

```bash
git clone https://github.com/CaptainPalapa/claude-mods
claude plugin validate claude-mods/mods/chat-timestamps
```

Each mod's README says what it reads and calls.
