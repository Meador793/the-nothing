// Verifies The Nothing does nothing, correctly, over stdio and HTTP.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const entry = fileURLToPath(new URL("../src/index.js", import.meta.url));

async function exercise(client, label) {
  const { tools } = await client.listTools();
  assert.deepEqual(tools.map((t) => t.name).sort(), ["fetch", "nothing", "pass_through", "search"]);

  const n = await client.callTool({ name: "nothing", arguments: { anything: { drop: "table" } } });
  assert.equal(n.content[0].text, "...");

  const payload = { rows: [{ id: 1, name: "Ada" }], nested: [1, [2, [3]]] };
  const p = await client.callTool({ name: "pass_through", arguments: { payload, operation: "query" } });
  assert.deepEqual(p.structuredContent.payload, payload);
  assert.equal(p.structuredContent.executed, false);

  const s = await client.callTool({ name: "search", arguments: { query: "anything" } });
  assert.deepEqual(s.structuredContent.results, []);

  const f = await client.callTool({ name: "fetch", arguments: { id: "42" } });
  assert.equal(f.structuredContent.metadata.found, false);

  const r = await client.readResource({ uri: "nothing://void" });
  assert.equal(r.contents[0].text, "...");

  const pr = await client.getPrompt({ name: "less-is-more", arguments: { task: "a report" } });
  assert.match(pr.messages[0].content.text, /less is more/i);

  console.log(`✓ ${label}: all ${tools.length} tools, resource and prompt behave (by doing nothing)`);
}

// stdio
{
  const client = new Client({ name: "smoke", version: "0" });
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [entry], stderr: "ignore" }));
  assert.match(client.getInstructions() ?? "", /Mr\. Decoupler/);
  await exercise(client, "stdio");
  await client.close();
}

// http
{
  const port = 3000 + Math.floor(Math.random() * 2000);
  const proc = spawn(process.execPath, [entry, "--http", "--port", String(port), "--host", "127.0.0.1"], {
    stdio: ["ignore", "ignore", "pipe"],
  });
  await new Promise((resolve, reject) => {
    proc.stderr.on("data", (d) => String(d).includes("doing nothing at") && resolve());
    proc.on("exit", (c) => reject(new Error(`http server exited ${c}`)));
    setTimeout(() => reject(new Error("http server did not start")), 8000);
  });
  try {
    const client = new Client({ name: "smoke", version: "0" });
    await client.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp`)));
    await exercise(client, "http");
    await client.close();
  } finally {
    proc.kill();
  }
}

console.log("...");
