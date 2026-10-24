// Bundles the MCP server into a single file inside the VS Code extension,
// and copies shared files (license, icon) so the extension is self-contained.
import { build } from "esbuild";
import { copyFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const ext = `${root}vscode-extension/`;

mkdirSync(`${ext}dist`, { recursive: true });

await build({
  entryPoints: [`${root}src/index.js`],
  outfile: `${ext}dist/server.mjs`,
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node18",
  minify: true,
  legalComments: "eof",
  banner: {
    js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);",
  },
});

copyFileSync(`${root}LICENSE`, `${ext}LICENSE`);
copyFileSync(`${root}assets/icon-128.png`, `${ext}icon.png`);

console.log("✓ Bundled server into vscode-extension/dist/server.mjs");
