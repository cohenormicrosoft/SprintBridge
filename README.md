<p align="center">
  <img src="src/extension/media/sprintbridge-banner.png" alt="SprintBridge" width="450"/>
</p>

<h1 align="center">SprintBridge</h1>

<p align="center">
  <strong>AI-powered Azure DevOps sprint management — right inside VS Code.</strong>
</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=OrCohen.sprintbridge">
    <img src="https://img.shields.io/badge/VS%20Code-Marketplace-007ACC?logo=visual-studio-code" alt="VS Code Marketplace"/>
  </a>
  <img src="https://img.shields.io/badge/VS%20Code-1.93+-blue.svg" alt="VS Code 1.93+"/>
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT License"/>
</p>

---

SprintBridge is a VS Code extension that puts your Azure DevOps sprint workflow at your fingertips. Use the **AI assistant** to manage work items with natural language, view your **sprint board** with drag-and-drop, or browse and edit your **backlog** — all without leaving your editor.

## What You Can Do

### AI Sprint Assistant

An AI chat built into the sidebar that understands your Azure DevOps context. Just describe what you need in plain English — it knows your identity, your project, and your area path.

> *"Show my active bugs"*
> *"Create a task for API refactoring assigned to me"*
> *"What's the total remaining work on my sprint items?"*
> *"Move item 54321 to In Review"*

- Conversation memory — ask follow-up questions naturally
- Creates, queries, updates, and deletes work items on your behalf
- Computes aggregations (sum, average, min/max) across your items
- Friendly responses — no raw errors or cryptic codes

### Sprint Board

A visual Kanban board that mirrors your Azure DevOps sprint — search for your team, pick a sprint, and drag cards between columns to update state instantly.

### Backlog Explorer

Browse your work items in a hierarchical tree — epics, features, stories, and tasks — with filters for area path, type, assignee, and state. Click to view details, edit inline, or delete.

### Quick Create

Spin up any work item type (Task, Bug, User Story, PBI, Feature, Epic) directly from the sidebar, with support for parent linking, priority, and scheduling fields.

## Getting Started

1. **Install** — Search "SprintBridge" in the VS Code Extensions marketplace, or [install directly](https://marketplace.visualstudio.com/items?itemName=OrCohen.sprintbridge)
2. **Open** — Click the SprintBridge icon in the activity bar
3. **Configure** — Enter your Azure DevOps organization and project in the Settings tab
4. **Sign In** — Authenticate with your Microsoft account
5. **Go** — Open the AI chat and start managing your sprint

## Configuration

| Setting | Description |
|---------|-------------|
| `Organization` | Your Azure DevOps organization |
| `Project` | Your Azure DevOps project |
| `Area Path` | Default area path for scoping queries and the board |
| `User Email` | Your organization email |

## Contributing

Contributions are welcome! Fork the repo, create a feature branch, and open a Pull Request.

## License

MIT — see the [LICENSE](src/extension/LICENSE) file for details.
