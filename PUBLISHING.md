# Publishing The Nothing

Three destinations, in this order: **npm → MCP Registry → VS Code Marketplace** (plus Open VSX, which is where Cursor, Windsurf and VSCodium look for extensions). The MCP Registry only stores metadata pointing at the npm package, so npm has to go first.

## 0. One-time setup

1. Create a GitHub repo named `the-nothing` and push this folder to it.
2. Identity is already filled in:
   - GitHub: `meador793` (registry name `io.github.meador793/the-nothing`)
   - npm: publish while logged in as `beencold` (`npm whoami` should print `beencold`)
   - VS Code Marketplace publisher: `benmeador`
3. Push to `main` so the icon URLs in `server.json` and the README resolve.

## 1. npm

```bash
npm install
npm test
npm login
npm publish --access public
```

Check it at https://www.npmjs.com/package/the-nothing-mcp. The `mcpName` field in `package.json` is what proves to the MCP Registry that you own the package.

## 2. Official MCP Registry

```bash
# macOS / Linux
brew install mcp-publisher
# or download a binary: https://github.com/modelcontextprotocol/registry/releases

mcp-publisher login github
mcp-publisher publish
```

Verify:

```bash
curl "https://registry.modelcontextprotocol.io/v0.1/servers?search=the-nothing"
```

Rules worth remembering: `name` in `server.json` must equal `mcpName` in `package.json`; `description` is capped at 100 characters; icon URLs must be HTTPS. Bump both `version` fields in `server.json` whenever you publish a new npm version.

## 3. VS Code Marketplace

1. Your publisher `benmeador` already exists at https://marketplace.visualstudio.com/manage.
2. Create an Azure DevOps Personal Access Token with **Marketplace → Manage** scope.
3. Build and publish:

   ```bash
   npm run build:vscode
   cd vscode-extension
   npx -y @vscode/vsce login benmeador
   npx -y @vscode/vsce publish
   ```

   Or `npx -y @vscode/vsce package` to produce a `.vsix` you can upload by hand on the publisher page.

## 4. Open VSX (Cursor, Windsurf, VSCodium, Gitpod)

```bash
cd vscode-extension
npx -y ovsx create-namespace benmeador -p <open-vsx-token>
npx -y ovsx publish -p <open-vsx-token>
```

Get a token at https://open-vsx.org/user-settings/tokens.

## Automating releases

`.github/workflows/release.yml` does all of the above when you push a tag like `v1.0.1`. Add these repo secrets first: `NPM_TOKEN`, `VSCE_PAT`, and optionally `OVSX_PAT`. The MCP Registry step uses GitHub OIDC, so it needs no secret.

Before tagging, bump the version in `package.json`, `server.json` (both places) and `vscode-extension/package.json`.
