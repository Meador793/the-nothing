// Replaces the placeholders with your real identity in every manifest.
//
//   npm run set-username -- <github-username> [vscode-publisher-id] ["Your Name"]
//
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const [github, publisher = github, author = github] = process.argv.slice(2);
if (!github) {
  console.error('Usage: npm run set-username -- <github-username> [vscode-publisher-id] ["Your Name"]');
  process.exit(1);
}

const root = fileURLToPath(new URL("..", import.meta.url));
const files = [
  "package.json",
  "server.json",
  "README.md",
  "PUBLISHING.md",
  "vscode-extension/package.json",
  "vscode-extension/README.md",
  "LICENSE",
];

for (const f of files) {
  const p = root + f;
  const before = readFileSync(p, "utf8");
  const after = before
    .replaceAll("YOUR_GITHUB_USERNAME", github)
    .replaceAll("YOUR_PUBLISHER_ID", publisher)
    .replaceAll("YOUR_NAME", author);
  if (after !== before) {
    writeFileSync(p, after);
    console.log(`✓ ${f}`);
  }
}
console.log(`Registry name is now io.github.${github}/the-nothing`);
