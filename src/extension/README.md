# 🌉 SprintBridge

**AI-powered Azure DevOps Boards integration for VS Code**

Manage your Azure DevOps work items directly from VS Code — browse, create, edit, and query using a visual sidebar or natural language AI chat.

## Features

- **📋 Work Items Sidebar** — Browse work items in a hierarchical tree view with parent-child relationships
- **🔍 Smart Filters** — Filter by area path, assignee, type, and state
- **✏️ Create & Edit** — Create new work items and edit existing ones directly in VS Code
- **🤖 AI Chat** — Use natural language to manage work items:
  - *"Create a task for updating docs assigned to me"*
  - *"Show my active bugs"*
  - *"Update item 12345 remaining work to 4 hours"*
- **⚙️ Settings** — Configure organization, project, area path, and user email from the UI

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) or later
- [VS Code](https://code.visualstudio.com/) with [GitHub Copilot](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot)
- Azure DevOps account with access to a project

## Getting Started

1. Install the extension from the VS Code Marketplace
2. Click the SprintBridge icon in the activity bar
3. Enter your Azure DevOps **Organization** and **Project** in the setup screen
4. Click **Sign In** to authenticate with your Microsoft account
5. Start browsing and managing your work items!

## Configuration

| Setting | Description |
|---------|-------------|
| `sprintbridge.organization` | Your Azure DevOps organization (e.g., `myorg`) |
| `sprintbridge.project` | Your Azure DevOps project (e.g., `MyProject`) |
| `sprintbridge.areaPath` | Default area path for filtering work items |
| `sprintbridge.userEmail` | Your email for AI chat context (e.g., `you@example.com`) |

## Architecture

- **VS Code Extension (TypeScript)** — Sidebar webview with tabs, AI intent parsing via Copilot LM API, Microsoft OAuth
- **C# Backend Sidecar (.NET)** — Local API that communicates with Azure DevOps REST API (handles CORS, JSON Patch)

## Development

```bash
# Backend
cd src/backend/SprintBridge.Api
dotnet restore && dotnet run --urls http://localhost:5059

# Extension
cd src/extension
npm install && npm run compile
# Press F5 in VS Code to launch
```

## License

MIT
