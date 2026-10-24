<p align="center">
  <img src="https://raw.githubusercontent.com/Meador793/the-nothing/main/assets/icon.png" width="160" alt="The Nothing: three dots on black">
</p>

<h1 align="center">The Nothing</h1>
<p align="center"><em>a.k.a. <strong>Mr. Decoupler</strong> — the MCP server that does nothing, on purpose.</em></p>
<p align="center">Sometimes less is more.</p>

---

## The idea: sometimes less is more

Most MCP servers race to do *more*: connect to more databases, read more files, call more APIs. That's great when you need it. But for a lot of simple scenarios, you don't — and every extra connection is one more credential to manage, one more thing that can break, and one more way an AI can touch data it shouldn't.

**The Nothing** takes the opposite approach. It connects to no database, reads no dataset, makes no network calls, writes nothing to disk and remembers nothing between calls. What it *does* provide is a clean, stable **seam** — a tool contract your AI can talk to — so the AI is never wired directly to your data layer.

That's why we call it **Mr. Decoupler**. He stands politely between your AI and your data, hands back exactly what he was given, and lets you decide later (or never) what should actually sit behind him.

## Why use a server that does nothing?

| Use case | How Mr. Decoupler helps |
|---|---|
| **Prototyping AI workflows before the database exists** | Design prompts and agent flows against `pass_through` now; swap in a real data server later without changing what the AI sees. |
| **Keeping AI away from production data** | Give the agent a data-shaped tool that physically cannot read, write or delete anything. |
| **Demos, workshops and teaching MCP** | The smallest possible working MCP server: tools, a resource and a prompt, with zero setup. |
| **Testing MCP clients and hosts** | A predictable, deterministic server for checking that a client connects, lists tools and handles results. |
| **Dry runs of data operations** | Let the AI describe the `operation` and `payload` it *would* run; review it before anything is real. |
| **Placeholders in multi-server configs** | Reserve a slot for a future data source so configs, docs and prompts don't have to change later. |
| **A deliberate "no action needed" path** | Sometimes the right answer to "should I query the database?" is no. `nothing` makes that explicit. |

## What's inside

| Kind | Name | Behavior |
|---|---|---|
| Tool | `nothing` | Accepts anything, returns `...`. No side effects. |
| Tool | `pass_through` | Returns `payload` exactly as received (identity). Optional `operation` label is recorded but never executed. |
| Tool | `search` | Always returns `{"results": []}`. |
| Tool | `fetch` | Returns an empty document for any id. |
| Resource | `nothing://void` | Contains `...`. |
| Prompt | `less-is-more` | Nudges the model to check whether doing nothing is enough. |

Every tool is annotated read-only, idempotent, non-destructive and closed-world, so clients that respect MCP tool annotations can run them without confirmation prompts. `search` and `fetch` exist so search-oriented clients such as ChatGPT connectors accept the server; they find nothing, by design.

## Install

Node.js 18+ is the only requirement.

```bash
npx -y the-nothing-mcp           # stdio (local clients)
npx -y the-nothing-mcp --http    # Streamable HTTP at http://0.0.0.0:3000/mcp (remote clients)
```

Options: `--port 3000`, `--host 0.0.0.0`, or env `THE_NOTHING_TRANSPORT=http`, `PORT`, `HOST`.

## Connect it to your AI

### Local clients (stdio)

Most local clients use the same `mcpServers` block:

```json
{
  "mcpServers": {
    "the-nothing": {
      "command": "npx",
      "args": ["-y", "the-nothing-mcp"]
    }
  }
}
```

| Client | Where it goes |
|---|---|
| **Claude Desktop** | Settings → Developer → Edit Config (`claude_desktop_config.json`) |
| **Claude Code** | `claude mcp add the-nothing -- npx -y the-nothing-mcp` |
| **Cursor** | `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` (project) |
| **Windsurf** | `~/.codeium/windsurf/mcp_config.json` |
| **Gemini CLI** | `~/.gemini/settings.json`, or `gemini mcp add the-nothing npx -y the-nothing-mcp` |
| **Cline / Roo Code / Kilo Code** | MCP Servers → Configure → `cline_mcp_settings.json` |
| **Zed** | `settings.json` under `context_servers` |
| **JetBrains AI Assistant / Junie** | Settings → Tools → AI Assistant → MCP → Add → paste the JSON |
| **Continue, LM Studio, Goose, and others** | Their MCP settings; same command and args |

**VS Code + GitHub Copilot** — install the **The Nothing** extension from the Marketplace (zero config), or add `.vscode/mcp.json`:

```json
{
  "servers": {
    "the-nothing": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "the-nothing-mcp"]
    }
  }
}
```

**OpenAI Codex CLI** — `~/.codex/config.toml`:

```toml
[mcp_servers.the-nothing]
command = "npx"
args = ["-y", "the-nothing-mcp"]
```

### Remote clients (Streamable HTTP)

ChatGPT, Grok, claude.ai custom connectors and hosted agent APIs reach MCP servers over HTTPS, so run The Nothing in HTTP mode somewhere public:

```bash
npx -y the-nothing-mcp --http --port 3000
# or
docker build -t the-nothing . && docker run -p 3000:3000 the-nothing
```

Put it behind HTTPS (any host, or a tunnel such as Cloudflare Tunnel or ngrok for testing), then use `https://your-host/mcp`:

| Client | How |
|---|---|
| **ChatGPT** | Settings → Apps & Connectors → enable Developer mode → Create → MCP server URL |
| **Claude (claude.ai / Desktop / mobile)** | Settings → Connectors → Add custom connector → URL |
| **Grok (xAI API)** | Add a remote MCP tool with `server_url` pointing at your `/mcp` endpoint |
| **Gemini API / Google ADK** | Use the SDK's MCP client with a Streamable HTTP transport |
| **OpenAI Responses / Agents SDK** | Add an `mcp` tool with `server_url` |

The HTTP server is stateless (no sessions, no auth, nothing stored), answers `GET /health`, and sends permissive CORS headers. It needs no secrets, because there is nothing to protect.

## Use it as a library

```js
import { createServer } from "the-nothing-mcp";
const server = createServer(); // a fresh McpServer that does nothing
```

## Development

```bash
npm install
npm test               # exercises every tool over stdio and HTTP
npm run build:vscode   # bundles the server into the VS Code extension
```

See [PUBLISHING.md](PUBLISHING.md) for releasing to npm, the official MCP Registry and the VS Code Marketplace.

## FAQ

**Does it really do nothing?** Yes. Read `src/server.js`; it's short. There is no I/O apart from the MCP transport itself.

**Then why not just have no server?** Because a stable contract is worth something. The Nothing lets your AI, prompts and configs depend on an interface instead of an implementation. When you're ready for real data, replace Mr. Decoupler with a server that exposes the same tools, and nothing else has to change.

**Is it safe to give to an autonomous agent?** It's about as safe as software gets: it cannot reach anything.

## License

MIT

<!-- Required by the official MCP Registry for ownership verification -->
mcp-name: io.github.Meador793/the-nothing

<p align="center">...</p>
