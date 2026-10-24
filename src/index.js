#!/usr/bin/env node
/**
 * The Nothing — CLI entry point.
 *
 *   the-nothing                 → stdio transport (Claude Desktop, Claude Code, Cursor, Windsurf,
 *                                 VS Code / GitHub Copilot, Gemini CLI, Zed, Cline, Continue, ...)
 *   the-nothing --http          → Streamable HTTP on http://0.0.0.0:3000/mcp
 *                                 (ChatGPT connectors, Grok / xAI remote MCP, Claude custom connectors,
 *                                 Gemini API, OpenAI Responses API, any remote MCP client)
 *   the-nothing --http --port 8080 --host 127.0.0.1
 *
 * Env: THE_NOTHING_TRANSPORT=stdio|http, PORT, HOST
 */
import http from "node:http";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer, NAME, TITLE, VERSION } from "./server.js";

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name, fallback) => {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};

if (flag("--version") || flag("-v")) {
  console.log(VERSION);
  process.exit(0);
}

if (flag("--help") || flag("-h")) {
  console.log(`${TITLE} (Mr. Decoupler) v${VERSION}
An MCP server that does nothing — on purpose. Sometimes less is more.

Usage:
  npx -y the-nothing-mcp                       stdio (default)
  npx -y the-nothing-mcp --http [--port 3000] [--host 0.0.0.0]

Environment:
  THE_NOTHING_TRANSPORT  stdio | http
  PORT, HOST             used with --http`);
  process.exit(0);
}

const transportMode = flag("--http") ? "http" : (process.env.THE_NOTHING_TRANSPORT || "stdio").toLowerCase();

if (transportMode === "http") {
  const port = Number(option("--port", process.env.PORT || 3000));
  const host = option("--host", process.env.HOST || "0.0.0.0");
  startHttp(port, host);
} else {
  startStdio();
}

async function startStdio() {
  const server = createServer();
  await server.connect(new StdioServerTransport());
  // stdout belongs to the protocol; status goes to stderr.
  console.error(`${TITLE} v${VERSION} is running on stdio, doing nothing.`);
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Accept, Authorization, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID"
  );
  res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id, Mcp-Protocol-Version");
}

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) reject(new Error("Payload too large (even nothing has limits)"));
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function startHttp(port, host) {
  const httpServer = http.createServer(async (req, res) => {
    setCors(res);
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      return res.end();
    }

    if (url.pathname === "/" || url.pathname === "/health") {
      return sendJson(res, 200, { name: NAME, title: TITLE, version: VERSION, status: "doing nothing", mcp: "/mcp" });
    }

    if (url.pathname !== "/mcp") {
      return sendJson(res, 404, { error: "Nothing here. Try /mcp." });
    }

    if (req.method !== "POST") {
      // Stateless server: no SSE stream, no sessions to delete.
      return sendJson(res, 405, {
        jsonrpc: "2.0",
        error: { code: -32000, message: "Method not allowed. This stateless server only accepts POST." },
        id: null,
      });
    }

    try {
      const raw = await readBody(req);
      const body = raw ? JSON.parse(raw) : undefined;
      // Stateless: a fresh server + transport per request. Nothing to remember.
      const server = createServer();
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
      res.on("close", () => {
        transport.close();
        server.close();
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, body);
    } catch (err) {
      if (!res.headersSent) {
        sendJson(res, 400, { jsonrpc: "2.0", error: { code: -32700, message: String(err.message || err) }, id: null });
      }
    }
  });

  httpServer.listen(port, host, () => {
    console.error(`${TITLE} v${VERSION} is doing nothing at http://${host}:${port}/mcp`);
  });

  const shutdown = () => httpServer.close(() => process.exit(0));
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
