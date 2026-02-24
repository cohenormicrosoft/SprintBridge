import * as vscode from "vscode";
import { BackendClient, CreateWorkItemRequest, UpdateWorkItemRequest } from "./backendClient";
import { AuthProvider } from "./auth";
import { getWebviewHtml } from "./webviewHtml";

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewId = "sprintbridge.sidebarView";
  private view?: vscode.WebviewView;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly backendClient: BackendClient,
    private readonly authProvider: AuthProvider
  ) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    const nonce = getNonce();
    const cspSource = webviewView.webview.cspSource;
    webviewView.webview.html = getWebviewHtml(nonce, cspSource);

    webviewView.webview.onDidReceiveMessage((msg) => this.handleMessage(msg));
  }

  private async handleMessage(msg: any): Promise<void> {
    // Handle config/auth messages before checking config
    if (msg.command === "getConfig") {
      const config = vscode.workspace.getConfiguration("sprintbridge");
      this.postMessage({
        command: "configLoaded",
        organization: config.get<string>("organization") || "",
        project: config.get<string>("project") || "",
        areaPath: config.get<string>("areaPath") || "",
      });
      return;
    }

    if (msg.command === "saveConfig") {
      const config = vscode.workspace.getConfiguration("sprintbridge");
      await config.update("organization", msg.organization, vscode.ConfigurationTarget.Global);
      await config.update("project", msg.project, vscode.ConfigurationTarget.Global);
      if (msg.areaPath !== undefined) {
        await config.update("areaPath", msg.areaPath, vscode.ConfigurationTarget.Global);
      }
      this.postMessage({
        command: "configSaved",
        organization: msg.organization,
        project: msg.project,
        areaPath: msg.areaPath || "",
      });
      return;
    }

    if (msg.command === "signIn") {
      try {
        await this.authProvider.signIn();
        vscode.window.showInformationMessage("SprintBridge: Signed in successfully!");
      } catch (error: any) {
        vscode.window.showErrorMessage(`SprintBridge: Sign in failed: ${error.message}`);
      }
      return;
    }

    const config = vscode.workspace.getConfiguration("sprintbridge");
    const org = config.get<string>("organization");
    const project = config.get<string>("project");

    if (!org || !project) {
      this.postMessage({
        command: "error",
        message: "Please configure your organization and project in Settings.",
        context: msg.command === "chatMessage" ? "chat" : undefined,
      });
      return;
    }

    let token: string;
    try {
      token = await this.authProvider.getToken();
    } catch {
      this.postMessage({
        command: "error",
        message: "Not signed in. Go to Settings tab and click 'Sign In'.",
        context: msg.command === "chatMessage" ? "chat" : undefined,
      });
      return;
    }

    try {
      switch (msg.command) {
        case "queryWorkItems":
          await this.handleQuery(org, project, token, msg);
          break;
        case "getWorkItem":
          await this.handleGet(org, project, token, msg.id);
          break;
        case "createWorkItem":
          await this.handleCreate(org, project, token, msg);
          break;
        case "updateWorkItem":
          await this.handleUpdate(org, project, token, msg.id, msg.updates);
          break;
        case "deleteWorkItem":
          await this.handleDelete(org, project, token, msg.id);
          break;
        case "chatMessage":
          await this.handleChat(org, project, token, msg.text);
          break;
      }
    } catch (error: any) {
      this.postMessage({
        command: "error",
        message: error.message || "An unexpected error occurred.",
        context: msg.command === "createWorkItem" ? "create" :
                 msg.command === "updateWorkItem" ? "edit" :
                 msg.command === "chatMessage" ? "chat" : undefined,
      });
    }
  }

  private async handleQuery(org: string, project: string, token: string, filters: any): Promise<void> {
    const config = vscode.workspace.getConfiguration("sprintbridge");
    const areaPath = config.get<string>("areaPath") || "";

    const conditions: string[] = [];

    if (areaPath) {
      conditions.push(`[System.AreaPath] UNDER '${areaPath}'`);
    } else {
      conditions.push("[System.TeamProject] = @project");
    }

    if (filters.assignee === "me") {
      conditions.push("[System.AssignedTo] = @Me");
    }
    if (filters.type) {
      conditions.push(`[System.WorkItemType] = '${filters.type}'`);
    }
    if (filters.state) {
      conditions.push(`[System.State] = '${filters.state}'`);
    }

    const where = conditions.join(" AND ");
    const wiql = `SELECT [System.Id], [System.Title], [System.State], [System.WorkItemType] FROM WorkItems WHERE ${where} ORDER BY [System.ChangedDate] DESC`;

    const items = await this.backendClient.queryWorkItems(org, project, wiql, token);
    this.postMessage({ command: "workItemsLoaded", items });
  }

  private async handleGet(org: string, project: string, token: string, id: number): Promise<void> {
    const item = await this.backendClient.getWorkItem(org, project, id, token);
    if (item) {
      this.postMessage({ command: "workItemLoaded", item });
    } else {
      this.postMessage({ command: "error", message: `Work item #${id} not found.` });
    }
  }

  private async handleCreate(org: string, project: string, token: string, msg: any): Promise<void> {
    const request: CreateWorkItemRequest = {
      type: msg.type || "Task",
      title: msg.title,
      description: msg.description,
      assignedTo: msg.assignedTo,
      priority: msg.priority,
    };
    const item = await this.backendClient.createWorkItem(org, project, request, token);
    this.postMessage({ command: "workItemCreated", item });
  }

  private async handleUpdate(org: string, project: string, token: string, id: number, updates: any): Promise<void> {
    const request: UpdateWorkItemRequest = {};
    if (updates.title) { request.title = updates.title; }
    if (updates.state) { request.state = updates.state; }
    if (updates.assignedTo) { request.assignedTo = updates.assignedTo; }
    if (updates.priority) { request.priority = updates.priority; }
    if (updates.description) { request.description = updates.description; }

    const item = await this.backendClient.updateWorkItem(org, project, id, request, token);
    if (item) {
      this.postMessage({ command: "workItemUpdated", item });
      vscode.window.showInformationMessage(`Work item #${id} updated.`);
    } else {
      this.postMessage({ command: "error", message: `Failed to update #${id}.`, context: "edit" });
    }
  }

  private async handleDelete(org: string, project: string, token: string, id: number): Promise<void> {
    const confirm = await vscode.window.showWarningMessage(
      `Delete work item #${id}?`, { modal: true }, "Delete"
    );
    if (confirm !== "Delete") { return; }

    const ok = await this.backendClient.deleteWorkItem(org, project, id, token);
    if (ok) {
      this.postMessage({ command: "workItemDeleted", id });
      vscode.window.showInformationMessage(`Work item #${id} deleted.`);
    } else {
      this.postMessage({ command: "error", message: `Failed to delete #${id}.` });
    }
  }

  private async handleChat(org: string, project: string, token: string, text: string): Promise<void> {
    const intent = await this.parseIntent(text);

    if (!intent) {
      this.postMessage({ command: "chatResponse", text: "I couldn't understand that. Try things like:\n• \"Show my active bugs\"\n• \"Create a task for updating docs\"\n• \"Update item 12345 state to Resolved\"" });
      return;
    }

    try {
      switch (intent.action) {
        case "create": {
          const item = await this.backendClient.createWorkItem(org, project, {
            type: intent.workItemType || "Task",
            title: intent.title || "New Work Item",
            description: intent.description,
            assignedTo: intent.assignedTo,
            priority: intent.priority,
          }, token);
          this.postMessage({ command: "chatResponse", text: `✅ Created ${item.type} #${item.id}: "${item.title}"` });
          break;
        }
        case "get": {
          if (!intent.workItemId) {
            this.postMessage({ command: "chatResponse", text: "Which work item? Give me an ID, e.g. \"Show 12345\"" });
            return;
          }
          const item = await this.backendClient.getWorkItem(org, project, intent.workItemId, token);
          if (item) {
            this.postMessage({ command: "chatResponse", text: `${item.type} #${item.id}: ${item.title}\nState: ${item.state || "N/A"}\nAssigned: ${item.assignedTo || "Unassigned"}\nPriority: ${item.priority || "N/A"}` });
          } else {
            this.postMessage({ command: "chatResponse", text: `Work item #${intent.workItemId} not found.` });
          }
          break;
        }
        case "update": {
          if (!intent.workItemId) {
            this.postMessage({ command: "chatResponse", text: "Which work item? e.g. \"Update 12345 state to Active\"" });
            return;
          }
          const req: UpdateWorkItemRequest = {};
          if (intent.title) { req.title = intent.title; }
          if (intent.state) { req.state = intent.state; }
          if (intent.assignedTo) { req.assignedTo = intent.assignedTo; }
          if (intent.priority) { req.priority = intent.priority; }
          const updated = await this.backendClient.updateWorkItem(org, project, intent.workItemId, req, token);
          if (updated) {
            this.postMessage({ command: "chatResponse", text: `✅ Updated #${updated.id}: ${updated.title} (${updated.state})` });
          }
          break;
        }
        case "delete": {
          if (!intent.workItemId) {
            this.postMessage({ command: "chatResponse", text: "Which work item? e.g. \"Delete 12345\"" });
            return;
          }
          const ok = await this.backendClient.deleteWorkItem(org, project, intent.workItemId, token);
          this.postMessage({ command: "chatResponse", text: ok ? `✅ Deleted #${intent.workItemId}.` : `❌ Failed to delete #${intent.workItemId}.` });
          break;
        }
        case "query": {
          const conditions: string[] = [];
          if (intent.queryText) {
            conditions.push(intent.queryText);
          } else {
            conditions.push("[System.AssignedTo] = @Me");
          }
          const wiql = `SELECT [System.Id], [System.Title], [System.State], [System.WorkItemType] FROM WorkItems WHERE ${conditions.join(" AND ")} ORDER BY [System.ChangedDate] DESC`;
          const items = await this.backendClient.queryWorkItems(org, project, wiql, token);
          if (items.length === 0) {
            this.postMessage({ command: "chatResponse", text: "No work items found." });
          } else {
            const lines = items.slice(0, 15).map(i => `• #${i.id} [${i.type}] ${i.title} (${i.state || "N/A"})`);
            this.postMessage({ command: "chatResponse", text: `Found ${items.length} item(s):\n${lines.join("\n")}` });
          }
          break;
        }
        default:
          this.postMessage({ command: "chatResponse", text: "I'm not sure what to do. Try \"Create a bug titled ...\" or \"Show my tasks\"." });
      }
    } catch (error: any) {
      this.postMessage({ command: "chatResponse", text: `❌ ${error.message}` });
    }
  }

  private async parseIntent(prompt: string): Promise<any | null> {
    try {
      const models = await vscode.lm.selectChatModels({ family: "gpt-4o" });
      if (models.length === 0) {
        return this.fallbackParse(prompt);
      }

      const model = models[0];
      const systemPrompt = `You are a JSON parser for Azure DevOps work item operations.
Given a user message, extract the intent as JSON with these fields:
- action: "create" | "get" | "update" | "delete" | "query"
- workItemId: number (if referencing an existing item)
- workItemType: string (Bug, Task, User Story, Feature, Epic)
- title: string (for create/update)
- description: string (for create/update)
- assignedTo: string (for create/update)
- state: string (New, Active, Resolved, Closed)
- priority: number 1-4
- queryText: string (WIQL WHERE clause)
Respond with ONLY valid JSON.`;

      const messages = [
        vscode.LanguageModelChatMessage.User(systemPrompt),
        vscode.LanguageModelChatMessage.User(`Parse this: "${prompt}"`),
      ];

      const response = await model.sendRequest(messages, {}, new vscode.CancellationTokenSource().token);
      let text = "";
      for await (const chunk of response.text) {
        text += chunk;
      }
      text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      return JSON.parse(text);
    } catch {
      return this.fallbackParse(prompt);
    }
  }

  private fallbackParse(prompt: string): any {
    const lower = prompt.toLowerCase();

    const getMatch = lower.match(/(?:get|show|view|display)\s+(?:work\s*item\s+)?#?(\d+)/);
    if (getMatch) { return { action: "get", workItemId: parseInt(getMatch[1]) }; }

    const deleteMatch = lower.match(/(?:delete|remove)\s+(?:work\s*item\s+)?#?(\d+)/);
    if (deleteMatch) { return { action: "delete", workItemId: parseInt(deleteMatch[1]) }; }

    const updateMatch = lower.match(/(?:update|change|modify|set)\s+(?:work\s*item\s+)?#?(\d+)/);
    if (updateMatch) { return { action: "update", workItemId: parseInt(updateMatch[1]) }; }

    if (lower.match(/(?:create|add|new|make)\s/)) {
      const typeMatch = lower.match(/(?:bug|task|user\s*story|feature|epic)/i);
      const titleMatch = prompt.match(/(?:titled?|called|named|for)\s+["']?(.+?)["']?\s*$/i);
      return {
        action: "create",
        workItemType: typeMatch ? typeMatch[0].trim() : "Task",
        title: titleMatch ? titleMatch[1] : prompt.replace(/^.*?(?:create|add|new|make)\s+(?:a\s+)?(?:bug|task|user\s*story|feature|epic)?\s*/i, "").trim(),
      };
    }

    if (lower.match(/(?:list|query|search|find|show\s+all|my\s)/)) {
      return { action: "query", queryText: "[System.AssignedTo] = @Me" };
    }

    return null;
  }

  private postMessage(msg: any): void {
    this.view?.webview.postMessage(msg);
  }
}

function getNonce(): string {
  let text = "";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
