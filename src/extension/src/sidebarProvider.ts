import * as vscode from "vscode";
import { BackendClient, CreateWorkItemRequest, UpdateWorkItemRequest } from "./backendClient";
import { AuthProvider } from "./auth";
import { getWebviewHtml } from "./webviewHtml";
import { resolveCopilotAssignee, COPILOT_IDENTITY } from "./constants";

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewId = "sprintbridge.sidebarView";
  private view?: vscode.WebviewView;
  private chatHistory: Array<{ role: "user" | "ai"; text: string }> = [];

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
    const iconUri = webviewView.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "media", "sprintbridge.png")
    ).toString();
    webviewView.webview.html = getWebviewHtml(nonce, cspSource, iconUri);

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
        userEmail: config.get<string>("userEmail") || "",
        team: config.get<string>("team") || "",
        defaultIterationPath: config.get<string>("defaultIterationPath") || "",
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
      if (msg.userEmail !== undefined) {
        await config.update("userEmail", msg.userEmail, vscode.ConfigurationTarget.Global);
      }
      if (msg.team !== undefined) {
        await config.update("team", msg.team, vscode.ConfigurationTarget.Global);
      }
      if (msg.defaultIterationPath !== undefined) {
        await config.update("defaultIterationPath", msg.defaultIterationPath, vscode.ConfigurationTarget.Global);
      }
      this.postMessage({
        command: "configSaved",
        organization: msg.organization,
        project: msg.project,
        areaPath: msg.areaPath || "",
        userEmail: msg.userEmail || "",
        team: msg.team || "",
        defaultIterationPath: msg.defaultIterationPath || "",
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
        case "getTeams":
          const teams = await this.backendClient.getTeams(org, project, token);
          this.postMessage({ command: "teamsLoaded", teams });
          break;
        case "getIterations":
          const iterations = await this.backendClient.getIterations(org, project, msg.team, token);
          this.postMessage({ command: "iterationsLoaded", iterations });
          break;
        case "getBoardItems":
          await this.handleBoardQuery(org, project, token, msg);
          break;
        case "moveWorkItem":
          await this.backendClient.updateWorkItem(org, project, msg.id, { state: msg.newState }, token);
          this.postMessage({ command: "workItemMoved", id: msg.id, newState: msg.newState });
          break;
      }
    } catch (error: any) {
      this.postMessage({
        command: "error",
        message: error.message || "An unexpected error occurred.",
        context: msg.command === "createWorkItem" ? "create" :
                 msg.command === "updateWorkItem" ? "edit" :
                 msg.command === "chatMessage" ? "chat" :
                 msg.command === "getBoardItems" ? "board" : undefined,
      });
    }
  }

  private async handleQuery(org: string, project: string, token: string, filters: any): Promise<void> {
    const areaPath = filters.areaPath || "";

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
    const config = vscode.workspace.getConfiguration("sprintbridge");
    const request: CreateWorkItemRequest = {
      type: msg.type || "Task",
      title: msg.title,
      description: msg.description,
      assignedTo: msg.assignedTo ? resolveCopilotAssignee(msg.assignedTo) : undefined,
      priority: msg.priority,
      areaPath: msg.areaPath || config.get<string>("areaPath") || undefined,
      iterationPath: msg.iterationPath || config.get<string>("defaultIterationPath") || undefined,
    };
    const item = await this.backendClient.createWorkItem(org, project, request, token);
    if (msg.parentId) {
      await this.backendClient.addParentLink(org, project, item.id, msg.parentId, token);
    }
    this.postMessage({ command: "workItemCreated", item });
  }

  private async handleUpdate(org: string, project: string, token: string, id: number, updates: any): Promise<void> {
    if (!id) {
      this.postMessage({ command: "error", message: `Update failed: Invalid work item ID (${id})`, context: "edit" });
      return;
    }
    const request: UpdateWorkItemRequest = {};
    if (updates.title) { request.title = updates.title; }
    if (updates.state) { request.state = updates.state; }
    if (updates.assignedTo) { request.assignedTo = resolveCopilotAssignee(updates.assignedTo); }
    if (updates.priority) { request.priority = updates.priority; }
    if (updates.description) { request.description = updates.description; }
    if (updates.remainingWork !== undefined) { request.remainingWork = updates.remainingWork; }
    if (updates.completedWork !== undefined) { request.completedWork = updates.completedWork; }
    if (updates.originalEstimate !== undefined) { request.originalEstimate = updates.originalEstimate; }

    try {
      const item = await this.backendClient.updateWorkItem(org, project, id, request, token);
      this.postMessage({ command: "workItemUpdated", item });
      vscode.window.showInformationMessage(`Work item #${id} updated.`);
    } catch (error: any) {
      this.postMessage({ command: "error", message: `Update failed: ${error.message}`, context: "edit" });
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

  private sendChatResponse(text: string): void {
    this.chatHistory.push({ role: "ai", text });
    this.postMessage({ command: "chatResponse", text });
  }

  private async handleBoardQuery(org: string, project: string, token: string, msg: any): Promise<void> {
    const conditions: string[] = [];
    if (msg.iterationPath) {
      conditions.push(`[System.IterationPath] = '${msg.iterationPath}'`);
    }
    // Auto-scope to team's area paths
    if (msg.team) {
      try {
        const teamFields = await this.backendClient.getTeamFieldValues(org, project, msg.team, token);
        if (teamFields.values.length > 0) {
          const areaClauses = teamFields.values.map(v =>
            v.includeChildren
              ? `[System.AreaPath] UNDER '${v.value}'`
              : `[System.AreaPath] = '${v.value}'`
          );
          if (areaClauses.length === 1) {
            conditions.push(areaClauses[0]);
          } else {
            conditions.push(`(${areaClauses.join(" OR ")})`);
          }
        }
      } catch {
        // If team field values fail, fall back to project scope
      }
    }
    if (msg.assignedToMe) {
      conditions.push(`[System.AssignedTo] = @Me`);
    }
    if (conditions.length === 0) {
      conditions.push(`[System.TeamProject] = @project`);
    }
    const wiql = `SELECT [System.Id] FROM WorkItems WHERE ${conditions.join(" AND ")} ORDER BY [System.ChangedDate] DESC`;
    const items = await this.backendClient.queryWorkItems(org, project, wiql, token, 500);
    this.postMessage({ command: "boardItemsLoaded", items });
  }

  private async handleChat(org: string, project: string, token: string, text: string): Promise<void> {
    this.chatHistory.push({ role: "user", text });

    try {
      const models = await vscode.lm.selectChatModels({ family: "gpt-4o" });
      if (models.length === 0) {
        this.sendChatResponse("AI model not available. Make sure GitHub Copilot is installed and signed in.");
        return;
      }

      const config = vscode.workspace.getConfiguration("sprintbridge");
      const userEmail = config.get<string>("userEmail") || await this.authProvider.getAccountName() || "unknown";
      const areaPath = config.get<string>("areaPath") || "";
      const team = config.get<string>("team") || "";
      const defaultIteration = config.get<string>("defaultIterationPath") || "";

      const systemPrompt = `You are SprintBridge AI — a helpful assistant for managing Azure DevOps work items.

USER: ${userEmail} | Org: ${org} | Project: ${project} | Area: ${areaPath || "not set"} | Team: ${team || "not set"} | Default Sprint: ${defaultIteration || "not set"}

You have TOOLS to interact with Azure DevOps. To use a tool, include a JSON block in your response like:
\`\`\`tool
{ "tool": "tool_name", ...params }
\`\`\`

AVAILABLE TOOLS:

1. **query** — Search work items with WIQL WHERE clause.
   \`\`\`tool
   { "tool": "query", "where": "[System.AssignedTo] = @Me AND [System.State] NOT IN ('Closed', 'Done', 'Removed')" }
   \`\`\`
   WIQL field references: [System.AssignedTo], [System.State], [System.WorkItemType], [System.Title], [System.AreaPath], [System.IterationPath], [Microsoft.VSTS.Common.Priority], [Microsoft.VSTS.Scheduling.RemainingWork], [Microsoft.VSTS.Scheduling.CompletedWork], [Microsoft.VSTS.Scheduling.OriginalEstimate]
   Use @Me for current user. "Active" items means NOT IN ('Closed', 'Done', 'Removed'). WIQL has no SUM/COUNT/AVG.

2. **get** — Get a specific work item by ID.
   \`\`\`tool
   { "tool": "get", "id": 12345 }
   \`\`\`

3. **create** — Create a work item. Area path and iteration path are auto-filled from user defaults if not specified.
   \`\`\`tool
   { "tool": "create", "type": "Bug", "title": "Login crash", "assignedTo": "${userEmail}", "priority": 2 }
   \`\`\`
   Supported types: Bug, Task, User Story, Product Backlog Item, Feature, Epic.
   You can also pass "areaPath" and "iterationPath" to override defaults.

4. **update** — Update a work item.
   \`\`\`tool
   { "tool": "update", "id": 12345, "state": "In Progress", "priority": 1 }
   \`\`\`

5. **delete** — Delete a work item.
   \`\`\`tool
   { "tool": "delete", "id": 12345 }
   \`\`\`

SPECIAL ASSIGNEES:
- When the user says "me"/"my"/"myself" → use @Me in queries and "${userEmail}" for create/update.
- When the user says "copilot"/"github copilot"/"assign to copilot" → use exactly "${COPILOT_IDENTITY}" as the assignedTo value. This assigns the work item to the GitHub Copilot agent so it can start implementing.

GUIDELINES:
- Be conversational and helpful. Respond naturally, not just with raw data.
- When a tool action succeeds (create, update, delete, assign), always start with ✅ and make the confirmation bold, e.g. "✅ **Created Bug #12345: Login crash**". Keep it concise and celebratory.
- When showing query results, summarize them clearly.
- If a query returns no results, suggest broadening it.
- For aggregations (sum, average, etc.), use the "query" tool to get items, then you'll receive the data and can compute the answer yourself.
- You can call multiple tools if needed.
- For follow-ups ("not just bugs", "what about tasks?"), adjust the previous query appropriately.
- For greetings or general questions, just respond naturally without tools.`;

      const messages: vscode.LanguageModelChatMessage[] = [
        vscode.LanguageModelChatMessage.User(systemPrompt),
      ];

      // Add conversation history
      const recentHistory = this.chatHistory.slice(-20);
      for (const msg of recentHistory) {
        if (msg.role === "user") {
          messages.push(vscode.LanguageModelChatMessage.User(msg.text));
        } else {
          messages.push(vscode.LanguageModelChatMessage.Assistant(msg.text));
        }
      }

      const model = models[0];

      // First LLM call — may contain tool calls
      let response = await model.sendRequest(messages, {}, new vscode.CancellationTokenSource().token);
      let llmText = "";
      for await (const chunk of response.text) { llmText += chunk; }

      // Extract and execute tool calls
      const toolRegex = /```tool\s*\n?([\s\S]*?)\n?```/g;
      let match;
      const toolResults: string[] = [];

      while ((match = toolRegex.exec(llmText)) !== null) {
        try {
          const toolCall = JSON.parse(match[1].trim());
          const result = await this.executeTool(org, project, token, toolCall);
          toolResults.push(result);
        } catch (e: any) {
          toolResults.push(`Tool error: ${e.message}`);
        }
      }

      if (toolResults.length > 0) {
        // Remove tool blocks from the visible text
        const cleanText = llmText.replace(toolRegex, "").trim();

        // Second LLM call — give it tool results and let it compose a final response
        messages.push(vscode.LanguageModelChatMessage.Assistant(llmText));
        messages.push(vscode.LanguageModelChatMessage.User(
          `Tool results:\n${toolResults.join("\n\n")}\n\nNow respond to the user naturally based on these results. Do NOT include any tool blocks. Just give a clear, helpful answer.`
        ));

        response = await model.sendRequest(messages, {}, new vscode.CancellationTokenSource().token);
        let finalText = "";
        for await (const chunk of response.text) { finalText += chunk; }

        this.sendChatResponse(finalText.trim());
      } else {
        // No tool calls — pure conversational response
        this.sendChatResponse(llmText.replace(toolRegex, "").trim());
      }
    } catch (error: any) {
      this.sendChatResponse(this.friendlyError(error));
    }
  }

  private async executeTool(org: string, project: string, token: string, tool: any): Promise<string> {
    switch (tool.tool) {
      case "query": {
        const where = tool.where || "[System.AssignedTo] = @Me";
        const wiql = `SELECT [System.Id] FROM WorkItems WHERE ${where} ORDER BY [System.ChangedDate] DESC`;
        const items = await this.backendClient.queryWorkItems(org, project, wiql, token);
        if (items.length === 0) { return "Query returned 0 items."; }
        const lines = items.slice(0, 20).map(i =>
          `#${i.id} | ${i.type} | ${i.title} | State: ${i.state || "N/A"} | Assigned: ${i.assignedTo || "Unassigned"} | Priority: ${i.priority || "N/A"}${i.remainingWork != null ? ` | Remaining: ${i.remainingWork}h` : ""}${i.originalEstimate != null ? ` | Estimate: ${i.originalEstimate}h` : ""}`
        );
        const more = items.length > 20 ? `\n(${items.length - 20} more items not shown)` : "";
        return `Query returned ${items.length} items:\n${lines.join("\n")}${more}`;
      }
      case "get": {
        const item = await this.backendClient.getWorkItem(org, project, tool.id, token);
        if (!item) { return `Work item #${tool.id} not found.`; }
        return `Work item #${item.id}:\nType: ${item.type}\nTitle: ${item.title}\nState: ${item.state || "N/A"}\nAssigned: ${item.assignedTo || "Unassigned"}\nPriority: ${item.priority || "N/A"}\nArea: ${item.areaPath || "N/A"}\nIteration: ${item.iterationPath || "N/A"}${item.remainingWork != null ? `\nRemaining: ${item.remainingWork}h` : ""}${item.completedWork != null ? `\nCompleted: ${item.completedWork}h` : ""}${item.originalEstimate != null ? `\nEstimate: ${item.originalEstimate}h` : ""}${item.description ? `\nDescription: ${item.description.replace(/<[^>]*>/g, "").substring(0, 200)}` : ""}`;
      }
      case "create": {
        const cfg = vscode.workspace.getConfiguration("sprintbridge");
        let assignTo = tool.assignedTo;
        if (assignTo && /^(@?me|myself)$/i.test(assignTo.trim())) {
          assignTo = await this.authProvider.getAccountName() || undefined;
        } else if (assignTo) {
          assignTo = resolveCopilotAssignee(assignTo);
        }
        const item = await this.backendClient.createWorkItem(org, project, {
          type: tool.type || "Task",
          title: tool.title || "New Work Item",
          description: tool.description,
          assignedTo: assignTo,
          priority: tool.priority,
          areaPath: tool.areaPath || cfg.get<string>("areaPath") || undefined,
          iterationPath: tool.iterationPath || cfg.get<string>("defaultIterationPath") || undefined,
          remainingWork: tool.remainingWork,
          completedWork: tool.completedWork,
          originalEstimate: tool.originalEstimate,
        }, token);
        if (tool.parentId) {
          await this.backendClient.addParentLink(org, project, item.id, tool.parentId, token);
        }
        return `Created ${item.type} #${item.id}: "${item.title}"`;
      }
      case "update": {
        if (!tool.id) { return "Error: No work item ID provided for update."; }
        const req: UpdateWorkItemRequest = {};
        if (tool.title) { req.title = tool.title; }
        if (tool.state) { req.state = tool.state; }
        if (tool.assignedTo) {
          if (/^(@?me|myself)$/i.test(tool.assignedTo.trim())) {
            req.assignedTo = await this.authProvider.getAccountName() || tool.assignedTo;
          } else {
            req.assignedTo = resolveCopilotAssignee(tool.assignedTo);
          }
        }
        if (tool.priority) { req.priority = tool.priority; }
        if (tool.areaPath) { req.areaPath = tool.areaPath; }
        if (tool.iterationPath) { req.iterationPath = tool.iterationPath; }
        if (tool.remainingWork !== undefined) { req.remainingWork = tool.remainingWork; }
        if (tool.completedWork !== undefined) { req.completedWork = tool.completedWork; }
        if (tool.originalEstimate !== undefined) { req.originalEstimate = tool.originalEstimate; }
        const updated = await this.backendClient.updateWorkItem(org, project, tool.id, req, token);
        return `Updated #${updated.id}: ${updated.title} → ${updated.state}`;
      }
      case "delete": {
        if (!tool.id) { return "Error: No work item ID provided for delete."; }
        const ok = await this.backendClient.deleteWorkItem(org, project, tool.id, token);
        return ok ? `Deleted #${tool.id}.` : `Failed to delete #${tool.id}. Check permissions.`;
      }
      default:
        return `Unknown tool: ${tool.tool}`;
    }
  }


  private friendlyError(error: any): string {
    const msg = error?.message || "Something went wrong.";
    if (msg.includes("session has expired") || msg.includes("sign out")) {
      return "Your session has expired. Please go to Settings and sign in again.";
    }
    if (msg.includes("Access denied") || msg.includes("permission")) {
      return "You don't have permission for that operation.";
    }
    if (msg.includes("not found") || msg.includes("Resource not found")) {
      return "That resource wasn't found. Check the ID or settings and try again.";
    }
    return "Something went wrong. Try rephrasing your request, or check Settings to make sure you're signed in.";
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
