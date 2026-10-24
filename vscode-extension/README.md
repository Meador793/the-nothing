# The Nothing (Mr. Decoupler)

**An MCP server that does nothing, on purpose. Sometimes less is more.**

Most MCP servers race to do more: more databases, more datasets, more APIs. For a lot of simple scenarios you don't need any of that, and every extra connection is another credential, another failure point and another way an AI can touch data it shouldn't.

**The Nothing**, nicknamed **Mr. Decoupler**, takes the opposite approach. It connects to no database, reads no dataset, makes no network calls and stores nothing. What it gives you is a clean, stable seam between your AI and your data layer: a tool contract the AI can talk to today, which you can back with a real implementation later (or never) without changing anything the AI sees.

## Zero setup

Install the extension and The Nothing appears automatically in **GitHub Copilot agent mode** and anywhere else VS Code uses MCP servers. It runs on VS Code's own Node runtime, so there's nothing else to install. Open the Chat view, switch to Agent mode, and enable **The Nothing** in the tools picker.

## Tools

| Tool | Behavior |
|---|---|
| `nothing` | Accepts anything, returns `...`. |
| `pass_through` | Returns the payload exactly as received. The decoupling seam. |
| `search` | Always returns no results. |
| `fetch` | Returns an empty document for any id. |

Plus the `nothing://void` resource and the `less-is-more` prompt. Every tool is read-only, idempotent and non-destructive.

## When less is more

- **Prototype AI workflows before the database exists**, then swap in the real thing without touching prompts.
- **Keep agents away from production data** with a data-shaped tool that cannot read, write or delete.
- **Demo or teach MCP** with the smallest possible working server.
- **Test MCP clients** against a predictable, deterministic server.
- **Dry-run data operations**: the AI states the `operation` and `payload` it would run, and you review it first.
- **Reserve a slot** in multi-server setups for a data source that's coming later.

## Not using VS Code?

The same server works with Claude Desktop, Claude Code, Cursor, Windsurf, Gemini CLI, ChatGPT, Grok and more:

```bash
npx -y the-nothing-mcp          # stdio
npx -y the-nothing-mcp --http   # remote / Streamable HTTP
```

Setup for every client: https://github.com/Meador793/the-nothing

Requires VS Code 1.101 or newer.

...
