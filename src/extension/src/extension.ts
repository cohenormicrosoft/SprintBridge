import * as vscode from "vscode";
import { BackendClient } from "./backendClient";
import { AuthProvider } from "./auth";
import { registerChatParticipant } from "./chatParticipant";
import { SidebarProvider } from "./sidebarProvider";

export async function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel("SprintBridge");
  outputChannel.appendLine("SprintBridge extension activating...");

  // Initialize components (no backend needed — calls ADO directly)
  const authProvider = new AuthProvider();
  const backendClient = new BackendClient();

  // Register chat participant
  const chatParticipant = registerChatParticipant(
    context,
    backendClient,
    authProvider
  );
  context.subscriptions.push(chatParticipant);

  // Register sidebar webview
  const sidebarProvider = new SidebarProvider(
    context.extensionUri,
    backendClient,
    authProvider
  );
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SidebarProvider.viewId,
      sidebarProvider
    )
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand("sprintbridge.configure", async () => {
      const config = vscode.workspace.getConfiguration("sprintbridge");
      const org = await vscode.window.showInputBox({
        prompt: "Enter your Azure DevOps organization name",
        placeHolder: "e.g., msazure",
        value: config.get<string>("organization"),
      });
      if (org) {
        await config.update("organization", org, vscode.ConfigurationTarget.Global);
      }

      const project = await vscode.window.showInputBox({
        prompt: "Enter your Azure DevOps project name",
        placeHolder: "e.g., One",
        value: config.get<string>("project"),
      });
      if (project) {
        await config.update("project", project, vscode.ConfigurationTarget.Global);
      }

      vscode.window.showInformationMessage("SprintBridge configured successfully!");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("sprintbridge.signIn", async () => {
      try {
        await authProvider.signIn();
        vscode.window.showInformationMessage(
          "SprintBridge: Signed in to Azure DevOps successfully!"
        );
      } catch (error: any) {
        vscode.window.showErrorMessage(
          `SprintBridge: Sign in failed: ${error.message}`
        );
      }
    })
  );

  outputChannel.appendLine("SprintBridge extension activated.");
}

export function deactivate() {
  // No cleanup needed — no backend process to stop
}
