// The Nothing — VS Code extension.
// Registers the bundled MCP server with VS Code so GitHub Copilot (agent mode)
// and any other VS Code MCP consumer can use it with zero configuration.
const vscode = require("vscode");
const path = require("path");

const PROVIDER_ID = "theNothing.mcpServer";

function activate(context) {
  const version = context.extension.packageJSON.version;
  const serverScript = context.asAbsolutePath(path.join("dist", "server.mjs"));
  const changed = new vscode.EventEmitter();
  context.subscriptions.push(changed);

  if (!vscode.lm || typeof vscode.lm.registerMcpServerDefinitionProvider !== "function") {
    vscode.window.showWarningMessage(
      "The Nothing needs VS Code 1.101 or newer for MCP support. Doing nothing, as usual."
    );
    return;
  }

  context.subscriptions.push(
    vscode.lm.registerMcpServerDefinitionProvider(PROVIDER_ID, {
      onDidChangeMcpServerDefinitions: changed.event,
      provideMcpServerDefinitions: async () => [
        new vscode.McpStdioServerDefinition(
          "The Nothing",
          // Run the bundled server with VS Code's own Node runtime: no separate Node install needed.
          process.execPath,
          [serverScript],
          { ELECTRON_RUN_AS_NODE: "1" },
          version
        ),
      ],
      resolveMcpServerDefinition: async (server) => server,
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("theNothing.about", () =>
      vscode.window.showInformationMessage(
        "The Nothing (Mr. Decoupler): an MCP server that does nothing, on purpose. Sometimes less is more. ..."
      )
    )
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
