<p align="center">
  <img src="src/extension/media/sprintbridge-banner.png" alt="SprintBridge" width="600"/>
</p>

<h1 align="center">SprintBridge</h1>

<p align="center">
  <strong>Your Azure DevOps backlog, right inside VS Code.</strong>
</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=OrCohen.sprintbridge">
    <img src="https://img.shields.io/badge/VS%20Code-Marketplace-007ACC?logo=visual-studio-code" alt="VS Code Marketplace"/>
  </a>
  <img src="https://img.shields.io/badge/VS%20Code-1.93+-blue.svg" alt="VS Code 1.93+"/>
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT License"/>
</p>

---

SprintBridge brings Azure DevOps work item management into your editor. Browse your backlog, run your sprint board, create and edit items, or just talk to the AI — all without switching to the browser.

## ✨ Features

### 📋 Work Items Explorer

Browse work items in a **hierarchical tree view** with parent-child relationships, just like Azure DevOps Boards.

| Capability | Description |
|------------|-------------|
| **Tree View** | Work items displayed with hierarchy — epics → features → stories → tasks |
| **Smart Filters** | Filter by area path, assignee, work item type, and state |
| **Detail View** | Click any item to see full details including description, priority, and scheduling fields |
| **Inline Edit** | Edit title, state, assigned to, priority, remaining work, and more — saves only changed fields |
| **Delete** | Remove work items with a confirmation prompt |

### 🗂️ Sprint Board

A full **Kanban-style sprint board** with drag-and-drop — pick your team, select a sprint, and manage your workflow visually.

| Capability | Description |
|------------|-------------|
| **Team & Sprint Picker** | Type your team name, sprints load automatically with the current one pre-selected |
| **Kanban Columns** | Cards grouped by state: New → Optional → Committed → In Progress → In Review → Done |
| **Drag & Drop** | Move cards between columns to update state instantly |
| **Area Path Scoping** | Filter the board to your team's area path |

### ➕ Create Work Items

Create any work item type directly from the sidebar — no browser needed.

| Field | Supported |
|-------|-----------|
| **Type** | Task, Bug, User Story, Product Backlog Item, Feature, Epic |
| **Title & Description** | Full text with HTML support |
| **Assigned To** | Email or display name |
| **Priority** | 1 (Critical) through 4 (Low) |
| **Parent Link** | Attach to a parent work item by ID |

### 🤖 AI Chat

Talk to your backlog in plain English. The AI understands context, remembers your conversation, and knows who you are.

> *"Create a task for updating the API docs assigned to me"*
> *"Show my active bugs"*
> *"Sum remaining work for my items"*
> *"Update item 54321 to In Review"*

| Capability | Description |
|------------|-------------|
| **Natural Language** | Create, query, update, and delete work items by just describing what you want |
| **Aggregations** | Ask for sums, averages, min/max of remaining work, completed work, or estimates |
| **Conversation Memory** | The AI remembers your recent messages for follow-up questions |
| **User Context** | Knows your email, org, project, and area path — "assigned to me" just works |
| **Friendly Errors** | No raw HTTP errors — if something fails, you get a helpful suggestion |

### ⚙️ Settings

Everything configurable from the sidebar — no need to touch JSON files.

| Setting | Description |
|---------|-------------|
| `Organization` | Your Azure DevOps organization |
| `Project` | Your Azure DevOps project |
| `Area Path` | Default area path for filtering |
| `User Email` | Your email for AI identity context |

## 🚀 Getting Started

1. **Install** — Search "SprintBridge" in the VS Code Extensions marketplace, or [install directly](https://marketplace.visualstudio.com/items?itemName=OrCohen.sprintbridge)
2. **Open** — Click the SprintBridge icon in the activity bar
3. **Configure** — Enter your Azure DevOps organization and project
4. **Sign In** — Authenticate with your Microsoft account
5. **Go** — Browse your backlog, open the sprint board, or start chatting with the AI

## 🏗️ Project Structure

```
SprintBridge/
├── src/
│   └── extension/              # VS Code Extension (TypeScript)
│       ├── src/
│       │   ├── extension.ts        # Entry point & lifecycle
│       │   ├── sidebarProvider.ts   # Webview provider & message handling
│       │   ├── webviewHtml.ts       # Full sidebar UI (HTML/CSS/JS)
│       │   ├── backendClient.ts     # Direct ADO REST API client
│       │   ├── auth.ts              # Microsoft OAuth provider
│       │   └── chatParticipant.ts   # @sprintbridge chat participant
│       ├── media/                   # Icons & logos
│       └── package.json             # Extension manifest
└── docs/                            # Documentation assets
```

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](src/extension/LICENSE) file for details.
