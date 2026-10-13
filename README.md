# palapa-claude-mods

Mods for [Claude Code](https://code.claude.com/docs/en/plugins/mods/overview): small plugins that change how its interface looks and behaves. They work in the Claude Code CLI and in the Code tab of the Claude Desktop app (Claude Code 2.1.287 or later).

This repository is a plugin marketplace. Each mod lives in its own folder under `mods/`.

| Mod | What it does |
| --- | --- |
| [chat-timestamps](mods/chat-timestamps) | Timestamps on your messages and Claude's replies, how far into the turn each one came, and the turn's total on the last reply |

## Install

You need Claude Code **2.1.287 or later** in a terminal (check with `claude --version`), or a Desktop app whose Code tab reports **2.1.286 or later** (type `/status` in a local Code session and read the **Claude Code** row). Mods are on by default; there is nothing to switch on.

Installing for your user account makes a mod load everywhere you use Claude Code on that machine: the terminal and the Desktop app's Code tab alike.

### Try it for one session first

To see a mod without installing anything, clone the repository and start a terminal session with the mod loaded for that session only:

```bash
git clone https://github.com/CaptainPalapa/palapa-claude-mods
```

```bash
claude --plugin-dir palapa-claude-mods/mods/chat-timestamps
```

Send a message or two to see it work. Nothing in your configuration changes, and the next plain `claude` starts without it. This works in a terminal only; the Desktop app has no way to pass the flag.

### Option 1: ask Claude to install it

Paste this into a Claude Code session (terminal or the Desktop app's Code tab). It works whether you have never used mods or already have some installed:

```text
Install the chat-timestamps mod from the plugin marketplace at
https://github.com/CaptainPalapa/palapa-claude-mods for my user account.

1. Run `claude --version` and stop if it is older than 2.1.287.
2. Check ~/.claude/settings.json: if "disableAllHooks" is true, mods cannot
   load. Tell me and stop rather than changing it.
3. Run `claude plugin marketplace list`. If a marketplace named palapa-claude-mods
   already exists, check its source is CaptainPalapa/palapa-claude-mods and use it;
   otherwise add it with `claude plugin marketplace add CaptainPalapa/palapa-claude-mods`.
   If that clone fails over SSH, use
   https://github.com/CaptainPalapa/palapa-claude-mods.git instead.
4. Before installing, clone the repo to a temporary folder, run
   `claude plugin validate <folder>/mods/chat-timestamps`, and show me the
   hooks and calls it lists. Wait for my OK.
5. Run `claude plugin install chat-timestamps@palapa-claude-mods`, then
   `claude plugin list` to confirm it is installed and enabled.
6. Tell me how to load it in this session, then delete the temporary clone.
```

### Option 2: install it yourself

From your shell:

```bash
claude plugin marketplace add CaptainPalapa/palapa-claude-mods
```

```bash
claude plugin install chat-timestamps@palapa-claude-mods
```

If the first command fails while cloning (it uses SSH when it can), give it the HTTPS address instead:

```bash
claude plugin marketplace add https://github.com/CaptainPalapa/palapa-claude-mods.git
```

In a terminal session you can also type `/plugin marketplace add CaptainPalapa/palapa-claude-mods` and `/plugin install chat-timestamps@palapa-claude-mods` at the prompt. The Desktop app's Code tab doesn't take `/plugin` commands, so install from your shell (or with the prompt above) when you use the Desktop app.

### Load it and check it works

- A session you start after installing loads the mod by itself.
- In a session that was already open, type `/reload-plugins`.
- To confirm it loaded, type `/plugin` in a terminal session: a dim line under the tabs names the active mods, such as `1 mod active · chat-timestamps`. Or just send a message: it should come back with `[the time]` in front.

### Update, turn off, remove

```bash
claude plugin marketplace update palapa-claude-mods
```

```bash
claude plugin update chat-timestamps@palapa-claude-mods
```

```bash
claude plugin disable chat-timestamps@palapa-claude-mods
```

```bash
claude plugin uninstall chat-timestamps@palapa-claude-mods
```

Type `/reload-plugins` in any open session afterwards, or start a new one.

## Before you install

A mod is code that runs inside Claude Code with your permissions: it can read and write your files, start programs and see your session. Read it first, or list what it hooks and calls without running it:

```bash
git clone https://github.com/CaptainPalapa/palapa-claude-mods
```

```bash
claude plugin validate palapa-claude-mods/mods/chat-timestamps
```

Each mod's README says what it reads and calls.
