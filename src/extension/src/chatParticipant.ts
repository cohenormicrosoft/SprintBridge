import * as vscode from "vscode";
import { BackendClient, CreateWorkItemRequest, UpdateWorkItemRequest, WorkItem } from "./backendClient";
import { AuthProvider } from "./auth";

interface ParsedIntent {
  action: "create" | "get" | "update" | "delete" | "query" | "help" | "unknown";
  workItemId?: number;
  workItemType?: string;
  title?: string;
  description?: string;
  assignedTo?: string;
  state?: string;
  priority?: number;
  queryText?: string;
}

export function registerChatParticipant(
  context: vscode.ExtensionContext,
  backendClient: BackendClient,
  authProvider: AuthProvider
): vscode.Disposable {
  const handler: vscode.ChatRequestHandler = async (
    request: vscode.ChatRequest,
    chatContext: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    cancellationToken: vscode.CancellationToken
  ) => {
    const config = vscode.workspace.getConfiguration("sprintbridge");
    const organization = config.get<string>("organization");
    const project = config.get<string>("project");

    if (!organization || !project) {
      stream.markdown(
        "⚠️ **SprintBridge is not configured.** Please set your Azure DevOps organization and project in settings:\n\n" +
          "1. Open Settings (Ctrl+,)\n" +
          '2. Search for "SprintBridge"\n' +
          "3. Set your **Organization** and **Project**\n\n" +
          "Or run the command: `SprintBridge: Configure ADO Connection`"
      );
      return;
    }

    // Get auth token
    let token: string;
    try {
      token = await authProvider.getToken();
    } catch {
      stream.markdown(
        "🔐 **Authentication required.** Please sign in to Azure DevOps.\n\n" +
          "Run the command: `SprintBridge: Sign In to Azure DevOps`"
      );
      return;
    }

    // Use LM API to parse user intent
    const intent = await parseUserIntent(request.prompt, stream, cancellationToken);

    if (intent.action === "help") {
      stream.markdown(getHelpText());
      return;
    }

    if (intent.action === "unknown") {
      stream.markdown(
        "🤔 I couldn't understand what you'd like to do. Here are some examples:\n\n" +
          '- "Create a bug titled Login page crashes"\n' +
          '- "Show me work item 12345"\n' +
          '- "Update item 12345 state to Active"\n' +
          '- "Delete work item 12345"\n' +
          '- "Find all bugs assigned to me"\n'
      );
      return;
    }

    try {
      switch (intent.action) {
        case "create":
          await handleCreate(stream, backendClient, organization, project, token, intent);
          break;
        case "get":
          await handleGet(stream, backendClient, organization, project, token, intent);
          break;
        case "update":
          await handleUpdate(stream, backendClient, organization, project, token, intent);
          break;
        case "delete":
          await handleDelete(stream, backendClient, organization, project, token, intent);
          break;
        case "query":
          await handleQuery(stream, backendClient, organization, project, token, intent);
          break;
      }
    } catch (error: any) {
      stream.markdown(`❌ **Error:** ${error.message || "An unexpected error occurred."}`);
    }
  };

  const participant = vscode.chat.createChatParticipant("sprintbridge.chat", handler);
  participant.iconPath = new vscode.ThemeIcon("tasklist");

  return participant;
}

async function parseUserIntent(
  prompt: string,
  stream: vscode.ChatResponseStream,
  cancellationToken: vscode.CancellationToken
): Promise<ParsedIntent> {
  try {
    const models = await vscode.lm.selectChatModels({ family: "gpt-4o" });
    if (models.length === 0) {
      // Fallback: basic keyword parsing
      return fallbackParseIntent(prompt);
    }

    const model = models[0];
    const systemPrompt = `You are a JSON parser for Azure DevOps work item operations. 
Given a user message, extract the intent as JSON with these fields:
- action: "create" | "get" | "update" | "delete" | "query" | "help"
- workItemId: number (if referencing an existing item)
- workItemType: string (Bug, Task, User Story, Feature, Epic)
- title: string (for create/update)
- description: string (for create/update)  
- assignedTo: string (for create/update)
- state: string (New, Active, Resolved, Closed)
- priority: number 1-4 (for create/update)
- queryText: string (WIQL WHERE clause for queries, e.g., "[System.AssignedTo] = @Me")

Respond with ONLY valid JSON, no markdown formatting.
If the user is asking for help or you can't determine the action, use action "help" or "unknown".`;

    const messages = [
      vscode.LanguageModelChatMessage.User(systemPrompt),
      vscode.LanguageModelChatMessage.User(`Parse this request: "${prompt}"`),
    ];

    const response = await model.sendRequest(messages, {}, cancellationToken);

    let responseText = "";
    for await (const chunk of response.text) {
      responseText += chunk;
    }

    // Clean up response - remove markdown code blocks if present
    responseText = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    return JSON.parse(responseText) as ParsedIntent;
  } catch {
    return fallbackParseIntent(prompt);
  }
}

function fallbackParseIntent(prompt: string): ParsedIntent {
  const lower = prompt.toLowerCase();

  if (lower.includes("help")) {
    return { action: "help" };
  }

  // Check for get/show with ID
  const getMatch = lower.match(/(?:get|show|view|display|find)\s+(?:work\s*item\s+)?#?(\d+)/);
  if (getMatch) {
    return { action: "get", workItemId: parseInt(getMatch[1]) };
  }

  // Check for delete with ID
  const deleteMatch = lower.match(/(?:delete|remove)\s+(?:work\s*item\s+)?#?(\d+)/);
  if (deleteMatch) {
    return { action: "delete", workItemId: parseInt(deleteMatch[1]) };
  }

  // Check for update with ID
  const updateMatch = lower.match(/(?:update|change|modify|set)\s+(?:work\s*item\s+)?#?(\d+)/);
  if (updateMatch) {
    return { action: "update", workItemId: parseInt(updateMatch[1]) };
  }

  // Check for create
  if (lower.match(/(?:create|add|new|make)\s/)) {
    const typeMatch = lower.match(/(?:bug|task|user\s*story|feature|epic)/i);
    const titleMatch = prompt.match(/(?:titled?|called|named)\s+["']?(.+?)["']?\s*$/i);
    return {
      action: "create",
      workItemType: typeMatch ? typeMatch[0].trim() : "Task",
      title: titleMatch ? titleMatch[1] : prompt.replace(/^.*?(?:create|add|new|make)\s+(?:a\s+)?(?:bug|task|user\s*story|feature|epic)?\s*/i, "").trim(),
    };
  }

  // Check for query
  if (lower.match(/(?:list|query|search|find|show\s+all|my\s)/)) {
    return { action: "query", queryText: prompt };
  }

  return { action: "unknown" };
}

async function handleCreate(
  stream: vscode.ChatResponseStream,
  client: BackendClient,
  org: string,
  project: string,
  token: string,
  intent: ParsedIntent
): Promise<void> {
  const request: CreateWorkItemRequest = {
    type: intent.workItemType || "Task",
    title: intent.title || "New Work Item",
    description: intent.description,
    assignedTo: intent.assignedTo,
    state: intent.state,
    priority: intent.priority,
  };

  stream.markdown(`🔄 Creating **${request.type}**: "${request.title}"...\n\n`);
  const result = await client.createWorkItem(org, project, request, token);
  stream.markdown(formatWorkItem(result, "✅ Created successfully!"));
}

async function handleGet(
  stream: vscode.ChatResponseStream,
  client: BackendClient,
  org: string,
  project: string,
  token: string,
  intent: ParsedIntent
): Promise<void> {
  if (!intent.workItemId) {
    stream.markdown("⚠️ Please specify a work item ID. Example: `show 12345`");
    return;
  }

  stream.markdown(`🔄 Fetching work item #${intent.workItemId}...\n\n`);
  const result = await client.getWorkItem(org, project, intent.workItemId, token);
  if (result) {
    stream.markdown(formatWorkItem(result));
  } else {
    stream.markdown(`❌ Work item #${intent.workItemId} not found.`);
  }
}

async function handleUpdate(
  stream: vscode.ChatResponseStream,
  client: BackendClient,
  org: string,
  project: string,
  token: string,
  intent: ParsedIntent
): Promise<void> {
  if (!intent.workItemId) {
    stream.markdown("⚠️ Please specify a work item ID. Example: `update 12345 state to Active`");
    return;
  }

  const request: UpdateWorkItemRequest = {};
  if (intent.title) { request.title = intent.title; }
  if (intent.description) { request.description = intent.description; }
  if (intent.assignedTo) { request.assignedTo = intent.assignedTo; }
  if (intent.state) { request.state = intent.state; }
  if (intent.priority) { request.priority = intent.priority; }

  stream.markdown(`🔄 Updating work item #${intent.workItemId}...\n\n`);
  const result = await client.updateWorkItem(org, project, intent.workItemId, request, token);
  if (result) {
    stream.markdown(formatWorkItem(result, "✅ Updated successfully!"));
  } else {
    stream.markdown(`❌ Work item #${intent.workItemId} not found.`);
  }
}

async function handleDelete(
  stream: vscode.ChatResponseStream,
  client: BackendClient,
  org: string,
  project: string,
  token: string,
  intent: ParsedIntent
): Promise<void> {
  if (!intent.workItemId) {
    stream.markdown("⚠️ Please specify a work item ID. Example: `delete 12345`");
    return;
  }

  stream.markdown(`🔄 Deleting work item #${intent.workItemId}...\n\n`);
  const success = await client.deleteWorkItem(org, project, intent.workItemId, token);
  if (success) {
    stream.markdown(`✅ Work item #${intent.workItemId} has been deleted.`);
  } else {
    stream.markdown(`❌ Failed to delete work item #${intent.workItemId}. It may not exist.`);
  }
}

async function handleQuery(
  stream: vscode.ChatResponseStream,
  client: BackendClient,
  org: string,
  project: string,
  token: string,
  intent: ParsedIntent
): Promise<void> {
  // Build a basic WIQL query
  const whereClause = intent.queryText || "[System.AssignedTo] = @Me";
  const wiql = `SELECT [System.Id], [System.Title], [System.State], [System.WorkItemType] FROM WorkItems WHERE ${whereClause} ORDER BY [System.ChangedDate] DESC`;

  stream.markdown(`🔄 Querying work items...\n\n`);
  const results = await client.queryWorkItems(org, project, wiql, token);

  if (results.length === 0) {
    stream.markdown("📭 No work items found matching your query.");
    return;
  }

  stream.markdown(`📋 **Found ${results.length} work item(s):**\n\n`);
  for (const item of results) {
    stream.markdown(
      `| #${item.id} | **${item.type}** | ${item.title} | ${item.state || "N/A"} | ${item.assignedTo || "Unassigned"} |\n`
    );
  }
}

function formatWorkItem(item: WorkItem, header?: string): string {
  let md = header ? `${header}\n\n` : "";
  md += `### ${item.type} #${item.id}: ${item.title}\n\n`;
  md += `| Field | Value |\n|-------|-------|\n`;
  md += `| **State** | ${item.state || "N/A"} |\n`;
  md += `| **Assigned To** | ${item.assignedTo || "Unassigned"} |\n`;
  md += `| **Priority** | ${item.priority || "N/A"} |\n`;
  md += `| **Area Path** | ${item.areaPath || "N/A"} |\n`;
  md += `| **Iteration** | ${item.iterationPath || "N/A"} |\n`;
  if (item.description) {
    md += `\n**Description:**\n${item.description}\n`;
  }
  return md;
}

function getHelpText(): string {
  return `# 🌉 SprintBridge Help

**SprintBridge** lets you manage Azure DevOps work items using natural language.

## Examples

| What to say | What it does |
|-------------|-------------|
| \`Create a bug titled "Login page crashes"\` | Creates a new Bug work item |
| \`Create a task for updating the README\` | Creates a new Task |
| \`Show work item 12345\` | Displays details of item #12345 |
| \`Update 12345 state to Active\` | Changes state of item #12345 |
| \`Delete work item 12345\` | Deletes item #12345 |
| \`Find all bugs assigned to me\` | Queries your bugs |
| \`List active tasks\` | Queries active tasks |

## Setup
1. Set your ADO **Organization** and **Project** in VS Code settings
2. Sign in with your Microsoft account when prompted
`;
}
