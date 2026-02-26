// Well-known identity for GitHub Copilot in Azure DevOps
export const COPILOT_IDENTITY = "GitHub Copilot <66dda6c5-07d0-4484-9979-116241219397@72f988bf-86f1-41af-91ab-2d7cd011db47>";

// Patterns that mean "assign to GitHub Copilot"
const COPILOT_PATTERNS = /^(copilot|github\s*copilot|gh\s*copilot)$/i;

/**
 * Resolves an assignee string — if it refers to Copilot, returns the ADO identity.
 * Returns the original string otherwise.
 */
export function resolveCopilotAssignee(assignee: string): string {
  return COPILOT_PATTERNS.test(assignee.trim()) ? COPILOT_IDENTITY : assignee;
}
