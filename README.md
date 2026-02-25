# 🌉 SprintBridge

AI-powered Azure DevOps Boards integration for VS Code via GitHub Copilot Chat.

## What It Does

SprintBridge lets you manage Azure DevOps work items using natural language directly in Copilot Chat:

```
@sprintbridge Create a bug titled "Login page crashes on mobile"
@sprintbridge Show me work item 12345
@sprintbridge Update 12345 state to Active
@sprintbridge Find all bugs assigned to me
```

## Architecture

- **VS Code Extension (TypeScript)** — Chat participant `@sprintbridge`, AI intent parsing via Copilot LM API, Microsoft OAuth
- **C# Backend (.NET 8)** — Local sidecar API that calls Azure DevOps REST API

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [VS Code](https://code.visualstudio.com/) with [GitHub Copilot](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot)
- Azure DevOps account with access to a project

## Setup

1. Clone this repository
2. Open in VS Code
3. Set your ADO organization and project in settings:
   - `sprintbridge.organization` — Your ADO org (e.g., `msazure`)
   - `sprintbridge.project` — Your ADO project (e.g., `One`)
4. The extension will auto-start the C# backend and prompt you to sign in

## Development

### Backend (C#)
```bash
cd src/backend/SprintBridge.Api
dotnet restore
dotnet build
dotnet run --urls http://localhost:5059
```

### Extension (TypeScript)
```bash
cd src/extension
npm install
npm run compile
# Press F5 in VS Code to launch Extension Development Host
```

## Project Structure

```
SprintBridge/
├── src/
│   ├── backend/SprintBridge.Api/    # C# .NET 8 Minimal API
│   │   ├── Models/                  # DTOs for work items
│   │   ├── Services/                # ADO REST API client
│   │   └── Program.cs               # API endpoints
│   └── extension/                   # VS Code Extension
│       └── src/
│           ├── extension.ts         # Entry point, lifecycle
│           ├── chatParticipant.ts   # @sprintbridge chat handler
│           ├── backendClient.ts     # HTTP client for C# backend
│           ├── auth.ts              # Microsoft OAuth
│           └── sidecar.ts           # Backend process manager
└── README.md
```
