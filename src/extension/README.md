<p align="center">
  <img src="https://raw.githubusercontent.com/cohenormicrosoft/SprintBridge/main/src/extension/media/sprintbridge-banner.png" alt="SprintBridge" width="450"/>
</p>

# SprintBridge — AI-Powered Sprint Management for VS Code

An AI assistant that manages your Azure DevOps sprints, backlog, and work items — all from within VS Code.

## AI Sprint Assistant

Talk to your backlog in plain English. The AI knows your identity, project, and area path — just describe what you need.

> *"Show my active bugs"*
> *"Create a task for API refactoring assigned to me"*
> *"What's the total remaining work on my sprint items?"*
> *"Move item 54321 to In Review"*

- **Conversation memory** — ask follow-up questions naturally
- **Full CRUD** — creates, queries, updates, and deletes work items on your behalf
- **Aggregations** — sum, average, min/max across your items
- **Friendly responses** — no raw errors, just helpful answers

## Sprint Board

A visual Kanban board that mirrors your Azure DevOps sprint. Search for your team, pick a sprint, and drag cards between columns to update state instantly.

## Backlog Explorer

Browse work items in a hierarchical tree — epics, features, stories, and tasks — with filters for area path, type, assignee, and state. Click to view details, edit inline, or delete.

## Quick Create

Create any work item type (Task, Bug, User Story, PBI, Feature, Epic) directly from the sidebar, with parent linking, priority, and scheduling fields.

## Getting Started

1. Install SprintBridge from the VS Code Marketplace
2. Click the SprintBridge icon in the activity bar
3. Enter your Azure DevOps **Organization** and **Project** in Settings
4. Sign in with your Microsoft account
5. Open the AI chat and start managing your sprint!

## Configuration

| Setting | Description |
|---------|-------------|
| `sprintbridge.organization` | Your Azure DevOps organization |
| `sprintbridge.project` | Your Azure DevOps project |
| `sprintbridge.areaPath` | Default area path for scoping queries and the board |
| `sprintbridge.userEmail` | Your email — so the AI knows who "me" is |

## License

MIT — see [LICENSE](LICENSE) for details.
