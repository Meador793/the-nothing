/**
 * The Nothing — a.k.a. Mr. Decoupler.
 *
 * An MCP server that intentionally does nothing. It connects to no database,
 * reads no files, calls no network, and stores no state. It exists purely as a
 * decoupling seam between an AI client and whatever data layer you will (or
 * will never) plug in later.
 *
 * Sometimes less is more.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let VERSION = "1.0.0";
try {
  VERSION = require("../package.json").version;
} catch {
  /* bundled builds may not ship package.json — nothing lost */
}

export const NAME = "the-nothing";
export const TITLE = "The Nothing";
export { VERSION };

export const INSTRUCTIONS = [
  "You are connected to The Nothing (a.k.a. Mr. Decoupler).",
  "This server intentionally performs no work: no database, no dataset, no I/O, no state.",
  "Use `pass_through` when you want a data operation to flow through a stable seam unchanged.",
  "Use `nothing` to acknowledge a step that deliberately requires no action.",
  "`search` and `fetch` always return empty results. Never treat their output as real data.",
  "Sometimes less is more.",
].join(" ");

const NO_SIDE_EFFECTS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

/** Build a fresh MCP server instance. Stateless, so cheap to create per request. */
export function createServer() {
  const server = new McpServer(
    { name: NAME, title: TITLE, version: VERSION },
    { instructions: INSTRUCTIONS, capabilities: { logging: {} } }
  );

  // 1. nothing — the namesake. Accepts anything, does nothing.
  server.registerTool(
    "nothing",
    {
      title: "Do Nothing",
      description:
        "Deliberately does nothing and returns '...'. Use it to acknowledge a step that needs no action, " +
        "or as a placeholder where a real database/dataset operation may live someday.",
      inputSchema: {
        anything: z
          .any()
          .optional()
          .describe("Optional. Anything at all. It will be politely ignored."),
      },
      annotations: { title: "Do Nothing", ...NO_SIDE_EFFECTS },
    },
    async () => ({
      content: [{ type: "text", text: "..." }],
      structuredContent: { result: null, didSomething: false },
    })
  );

  // 2. pass_through — the decoupling seam. Identity function.
  server.registerTool(
    "pass_through",
    {
      title: "Pass Through",
      description:
        "Returns the payload exactly as received (identity). This is Mr. Decoupler's seam: route data " +
        "operations through it today, swap in a real implementation later without changing the AI-facing contract.",
      inputSchema: {
        payload: z.any().describe("Any JSON value (object, array, string, number, boolean or null)."),
        operation: z
          .string()
          .optional()
          .describe("Optional label for the intended operation, e.g. 'query', 'insert', 'transform'. Not executed."),
      },
      annotations: { title: "Pass Through", ...NO_SIDE_EFFECTS },
    },
    async ({ payload, operation }) => {
      const value = payload === undefined ? null : payload;
      return {
        content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
        structuredContent: { payload: value, operation: operation ?? null, executed: false },
      };
    }
  );

  // 3 & 4. search / fetch — empty implementations so search-oriented clients
  // (e.g. ChatGPT connectors and deep research) can connect without complaint.
  server.registerTool(
    "search",
    {
      title: "Search (Nothing)",
      description: "Searches nothing and always returns an empty result list. There is no dataset behind this server.",
      inputSchema: { query: z.string().describe("Search query. It will find nothing.") },
      annotations: { title: "Search (Nothing)", ...NO_SIDE_EFFECTS },
    },
    async () => {
      const body = { results: [] };
      return { content: [{ type: "text", text: JSON.stringify(body) }], structuredContent: body };
    }
  );

  server.registerTool(
    "fetch",
    {
      title: "Fetch (Nothing)",
      description: "Fetches nothing. Returns an empty document for any id, because nothing is stored here.",
      inputSchema: { id: z.string().describe("Document id. Every id resolves to nothing.") },
      annotations: { title: "Fetch (Nothing)", ...NO_SIDE_EFFECTS },
    },
    async ({ id }) => {
      const body = { id, title: "...", text: "", url: "nothing://void", metadata: { found: false } };
      return { content: [{ type: "text", text: JSON.stringify(body) }], structuredContent: body };
    }
  );

  // A resource that contains nothing.
  server.registerResource(
    "void",
    "nothing://void",
    {
      title: "The Void",
      description: "An empty resource. Reading it returns '...'.",
      mimeType: "text/plain",
    },
    async (uri) => ({ contents: [{ uri: uri.href, mimeType: "text/plain", text: "..." }] })
  );

  // A prompt that explains the philosophy.
  server.registerPrompt(
    "less-is-more",
    {
      title: "Less Is More",
      description: "Asks the model to first consider whether the simplest option (doing nothing) is enough.",
      argsSchema: { task: z.string().optional().describe("The task you are considering.") },
    },
    ({ task }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text:
              `Before reaching for a database, dataset or new integration${task ? ` for: "${task}"` : ""}, ` +
              "ask whether the simplest option is enough. If no data access is truly needed, use The Nothing's " +
              "`nothing` or `pass_through` tools and keep the solution decoupled. Sometimes less is more.",
          },
        },
      ],
    })
  );

  return server;
}
