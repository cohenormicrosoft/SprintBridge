import * as vscode from "vscode";
import { BackendClient } from "./backendClient";
import { AuthProvider } from "./auth";
import { SidecarManager } from "./sidecar";
import { registerChatParticipant } from "./chatParticipant";
import { SidebarProvider } from "./sidebarProvider";

let sidecar: SidecarManager;

export async function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel("SprintBridge");
  outputChannel.appendLine("SprintBridge extension activating...");

  const config = vscode.workspace.getConfiguration("sprintbridge");
  const port = config.get<number>("backendPort") || 5059;

  // Initialize components
  const authProvider = new AuthProvider();
  const backendClient = new BackendClient(port);
  sidecar = new SidecarManager(outputChannel, port);

  // Start the C# backend sidecar
  try {
    await sidecar.start(context.extensionPath);
    outputChannel.appendLine("Backend started successfully.");
  } catch (error: any) {
    outputChannel.appendLine(`Failed to start backend: ${error.message}`);
    vscode.window.showWarningMessage(
      "SprintBridge: Backend failed to start. Make sure .NET 8 SDK is installed."
    );
  }

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
  if (sidecar) {
    sidecar.stop();
  }
}
