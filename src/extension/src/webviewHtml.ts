export function getWebviewHtml(nonce: string, cspSource: string, iconUri: string): string {
  return /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; img-src ${cspSource}; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SprintBridge</title>
  <style nonce="${nonce}">
    :root {
      --bg: var(--vscode-sideBar-background);
      --fg: var(--vscode-sideBar-foreground, var(--vscode-foreground));
      --input-bg: var(--vscode-input-background);
      --input-fg: var(--vscode-input-foreground);
      --input-border: var(--vscode-input-border, transparent);
      --btn-bg: var(--vscode-button-background);
      --btn-fg: var(--vscode-button-foreground);
      --btn-hover: var(--vscode-button-hoverBackground);
      --btn-secondary-bg: var(--vscode-button-secondaryBackground);
      --btn-secondary-fg: var(--vscode-button-secondaryForeground);
      --border: var(--vscode-panel-border, var(--vscode-widget-border, #444));
      --badge-bg: var(--vscode-badge-background);
      --badge-fg: var(--vscode-badge-foreground);
      --list-hover: var(--vscode-list-hoverBackground);
      --list-active: var(--vscode-list-activeSelectionBackground);
      --list-active-fg: var(--vscode-list-activeSelectionForeground);
      --error: var(--vscode-errorForeground, #f44);
      --link: var(--vscode-textLink-foreground);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { font-family: var(--vscode-font-family); font-size: var(--vscode-font-size); color: var(--fg); background: var(--bg); height: 100%; overflow: hidden; margin: 0; padding: 0; }
    body { display: flex; flex-direction: column; position: relative; }
    #setup-screen { position: absolute; inset: 0; z-index: 10; background: var(--bg); overflow-y: auto; }
    #main-app { flex-direction: column; flex: 1; overflow: hidden; min-height: 0; }

    /* Tabs */
    .tabs { display: flex; border-bottom: 1px solid var(--border); flex-shrink: 0; }
    .tab { flex: 1; padding: 8px 4px; text-align: center; cursor: pointer; font-size: 12px; border: none; background: transparent; color: var(--fg); opacity: 0.7; border-bottom: 2px solid transparent; }
    .tab:hover { opacity: 1; background: var(--list-hover); }
    .tab.active { opacity: 1; border-bottom-color: var(--btn-bg); }

    /* Panels */
    .panel { flex: 1; display: none; flex-direction: column; overflow: hidden; min-height: 0; }
    .panel.active { display: flex; }
    .panel-content { padding: 10px; overflow-y: auto; flex: 1; min-height: 0; }

    /* Filters */
    .filters { padding: 8px 10px; border-bottom: 1px solid var(--border); display: flex; gap: 6px; flex-wrap: wrap; flex-shrink: 0; align-items: center; }
    .filter-select { background: var(--input-bg); color: var(--input-fg); border: 1px solid var(--input-border); padding: 4px 6px; font-size: 11px; border-radius: 3px; }
    .filter-input { background: var(--input-bg); color: var(--input-fg); border: 1px solid var(--input-border); padding: 4px 6px; font-size: 11px; border-radius: 3px; flex: 1; min-width: 80px; }

    /* Work item list */
    .work-item { padding: 6px 10px; border-bottom: 1px solid var(--border); cursor: pointer; }
    .work-item:hover { background: var(--list-hover); }
    .work-item-header { display: flex; align-items: center; gap: 6px; margin-bottom: 2px; }
    .work-item-id { font-size: 11px; opacity: 0.7; }
    .work-item-title { font-size: 13px; font-weight: 500; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .work-item-meta { display: flex; gap: 8px; font-size: 11px; opacity: 0.7; }
    .type-badge { font-size: 10px; padding: 1px 5px; border-radius: 3px; font-weight: 600; }
    .type-bug { background: #cd3232; color: #fff; }
    .type-task { background: #f2cb1d; color: #000; }
    .type-userstory { background: #009ccc; color: #fff; }
    .type-feature { background: #773b93; color: #fff; }
    .type-epic { background: #ff7b00; color: #fff; }
    .state-badge { padding: 1px 5px; border-radius: 3px; font-size: 10px; background: var(--badge-bg); color: var(--badge-fg); }

    /* Hierarchy */
    .tree-children { border-left: 1px solid var(--border); margin-left: 12px; }
    .tree-toggle { background: none; border: none; color: var(--fg); cursor: pointer; font-size: 12px; padding: 0 4px 0 0; opacity: 0.7; flex-shrink: 0; }
    .tree-toggle:hover { opacity: 1; }

    /* Detail view */
    .detail-view { padding: 10px; }
    .detail-back { background: none; border: none; color: var(--link); cursor: pointer; font-size: 12px; margin-bottom: 8px; padding: 0; }
    .detail-back:hover { text-decoration: underline; }
    .detail-title { font-size: 15px; font-weight: 600; margin-bottom: 10px; }
    .detail-field { margin-bottom: 8px; }
    .detail-field label { display: block; font-size: 11px; opacity: 0.7; margin-bottom: 2px; }
    .detail-field .value { font-size: 13px; }
    .detail-actions { display: flex; gap: 6px; margin-top: 12px; }

    /* Forms */
    .form-group { margin-bottom: 12px; }
    .form-group label { display: block; font-size: 12px; margin-bottom: 4px; font-weight: 500; }
    .form-input, .form-select, .form-textarea { width: 100%; background: var(--input-bg); color: var(--input-fg); border: 1px solid var(--input-border); padding: 6px 8px; font-size: 13px; border-radius: 3px; font-family: inherit; }
    .form-textarea { min-height: 80px; resize: vertical; }
    .form-select { cursor: pointer; }

    /* Buttons */
    .btn { padding: 6px 14px; border: none; border-radius: 3px; cursor: pointer; font-size: 12px; font-family: inherit; }
    .btn-primary { background: var(--btn-bg); color: var(--btn-fg); }
    .btn-primary:hover { background: var(--btn-hover); }
    .btn-secondary { background: var(--btn-secondary-bg); color: var(--btn-secondary-fg); }
    .btn-danger { background: #cd3232; color: #fff; }
    .btn-danger:hover { background: #e04444; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Chat */
    .chat-messages { flex: 1; overflow-y: auto; padding: 10px; }
    .chat-msg { margin-bottom: 10px; }
    .chat-msg-user { text-align: right; }
    .chat-msg-user .chat-bubble { background: var(--btn-bg); color: var(--btn-fg); display: inline-block; padding: 6px 10px; border-radius: 10px 10px 2px 10px; max-width: 90%; text-align: left; font-size: 13px; }
    .chat-msg-ai .chat-bubble { background: var(--input-bg); display: inline-block; padding: 6px 10px; border-radius: 10px 10px 10px 2px; max-width: 90%; text-align: left; font-size: 13px; line-height: 1.5; }
    .chat-bubble p { margin: 0 0 6px 0; }
    .chat-bubble p:last-child { margin-bottom: 0; }
    .chat-bubble strong { font-weight: 600; }
    .chat-bubble em { font-style: italic; }
    .chat-bubble code { background: rgba(128,128,128,0.2); padding: 1px 4px; border-radius: 3px; font-family: var(--vscode-editor-font-family, monospace); font-size: 12px; }
    .chat-bubble pre { background: rgba(128,128,128,0.15); padding: 8px; border-radius: 4px; overflow-x: auto; margin: 6px 0; }
    .chat-bubble pre code { background: none; padding: 0; }
    .chat-bubble ul, .chat-bubble ol { margin: 4px 0; padding-left: 18px; }
    .chat-bubble li { margin-bottom: 2px; }
    .chat-bubble a { color: var(--btn-bg); text-decoration: underline; }
    .chat-bubble .wi-tag { display: inline-block; background: var(--btn-bg); color: var(--btn-fg); padding: 1px 6px; border-radius: 3px; font-size: 11px; font-weight: 600; cursor: pointer; text-decoration: none; }
    .chat-bubble .wi-tag:hover { opacity: 0.85; text-decoration: underline; }
    .wi-link { color: var(--link); cursor: pointer; text-decoration: underline; font-weight: 600; }
    .wi-link:hover { opacity: 0.8; }
    .chat-input-row { display: flex; gap: 6px; padding: 8px 10px; border-top: 1px solid var(--border); flex-shrink: 0; }
    .chat-input { flex: 1; background: var(--input-bg); color: var(--input-fg); border: 1px solid var(--input-border); padding: 6px 8px; font-size: 13px; border-radius: 3px; font-family: inherit; }

    /* Status messages */
    .empty-state { text-align: center; padding: 30px 15px; opacity: 0.6; font-size: 13px; }
    .loading { text-align: center; padding: 20px; opacity: 0.6; }
    .error-msg { color: var(--error); padding: 8px 10px; font-size: 12px; }
    .success-msg { color: #4ec94e; font-weight: 700; padding: 10px 12px; font-size: 13px; border-left: 3px solid #4ec94e; background: rgba(78, 201, 78, 0.08); border-radius: 3px; margin: 4px 0; }
    .copilot-assign-label { display: inline-flex; align-items: center; gap: 6px; margin-top: 6px; padding: 5px 12px; font-size: 12px; cursor: pointer; border: 1px solid var(--border); border-radius: 20px; transition: all 0.15s; background: transparent; user-select: none; }
    .copilot-assign-label:hover { border-color: var(--btn-bg); background: rgba(128,128,128,0.06); }
    .copilot-assign-label input[type="checkbox"] { display: none; }
    .copilot-assign-label.active { border-color: var(--btn-bg); background: var(--btn-bg); color: var(--btn-fg); }
    .copilot-icon { font-size: 14px; line-height: 1; }

    /* Sprint Board */
    .board-toolbar { padding: 10px 12px; border-bottom: 1px solid var(--border); display: flex; gap: 8px; flex-wrap: wrap; align-items: center; flex-shrink: 0; background: var(--input-bg); }
    .board-toolbar .board-field { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 100px; }
    .board-toolbar .board-field label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.6; font-weight: 600; }
    .board-toolbar .board-field input,
    .board-toolbar .board-field select { background: var(--bg); color: var(--input-fg); border: 1px solid var(--border); padding: 5px 8px; font-size: 12px; border-radius: 4px; }
    .board-toolbar .board-field input:focus,
    .board-toolbar .board-field select:focus { border-color: var(--btn-bg); outline: none; }
    .board-load-btn { padding: 6px 16px; border-radius: 4px; font-size: 12px; font-weight: 600; letter-spacing: 0.3px; border: none; background: var(--btn-bg); color: var(--btn-fg); cursor: pointer; align-self: flex-end; transition: opacity 0.15s; }
    .board-load-btn:hover { opacity: 0.85; }
    .board-columns { display: flex; gap: 8px; padding: 10px; height: 100%; overflow-x: auto; min-height: 0; }
    .board-column { flex: 1; min-width: 150px; background: var(--input-bg); border-radius: 6px; display: flex; flex-direction: column; max-height: 100%; border: 1px solid var(--border); }
    .board-column-header { padding: 8px 10px; font-weight: 600; font-size: 12px; text-align: center; border-bottom: 1px solid var(--border); flex-shrink: 0; background: rgba(128,128,128,0.06); border-radius: 6px 6px 0 0; }
    .board-column-header .col-count { font-weight: normal; opacity: 0.5; margin-left: 4px; }
    .board-column-body { flex: 1; overflow-y: auto; padding: 6px; min-height: 60px; }
    .board-card { background: var(--bg); border: 1px solid var(--border); border-left: 3px solid var(--btn-bg); border-radius: 5px; padding: 8px 10px; margin-bottom: 6px; cursor: grab; font-size: 12px; transition: box-shadow 0.15s, transform 0.1s; }
    .board-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.15); transform: translateY(-1px); }
    .board-card:active { cursor: grabbing; opacity: 0.7; transform: none; box-shadow: none; }
    .board-card.drag-over { border-top: 2px solid var(--btn-bg); }
    .board-card-id { opacity: 0.7; font-size: 10px; cursor: pointer; font-family: var(--vscode-editor-font-family, monospace); color: var(--link); }
    .board-card-id:hover { opacity: 1; text-decoration: underline; }
    .board-card-title { margin-top: 4px; font-weight: 500; line-height: 1.3; }
    .board-card-meta { margin-top: 4px; opacity: 0.55; font-size: 11px; display: flex; align-items: center; gap: 4px; }
    .board-card-meta::before { content: '\\1F464'; font-size: 10px; }
    .board-card .type-badge { font-size: 9px; padding: 1px 5px; border-radius: 3px; }
    .copy-toast { position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%); background: var(--btn-bg); color: var(--btn-fg); padding: 6px 16px; border-radius: 6px; font-size: 12px; z-index: 999; opacity: 0; transition: opacity 0.2s; pointer-events: none; font-weight: 500; }
    .board-column-body.drag-target { background: rgba(255,255,255,0.05); outline: 2px dashed var(--btn-bg); outline-offset: -2px; border-radius: 4px; }
    /* Toggle switch */
    .toggle-wrap { display: flex; align-items: center; gap: 5px; font-size: 12px; white-space: nowrap; cursor: pointer; }
    .toggle-switch { position: relative; width: 32px; height: 18px; background: var(--border); border-radius: 9px; transition: background 0.2s; flex-shrink: 0; }
    .toggle-switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; background: var(--fg); border-radius: 50%; transition: transform 0.2s; }
    .toggle-wrap input { display: none; }
    .toggle-wrap input:checked + .toggle-switch { background: var(--btn-bg); }
    .toggle-wrap input:checked + .toggle-switch::after { transform: translateX(14px); background: var(--btn-fg); }

    /* Edit mode */
    .edit-form { padding: 10px; }
    .edit-form .form-group { margin-bottom: 10px; }
    .desc-html { font-size: 12px; line-height: 1.5; }
    .desc-html img { max-width: 100%; }
    .desc-html ul, .desc-html ol { padding-left: 20px; }

    /* Setup overlay */
    .setup-overlay { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 20px; }
    .setup-overlay h2 { font-size: 16px; margin-bottom: 6px; }
    .setup-overlay p { font-size: 12px; opacity: 0.7; margin-bottom: 16px; }
    .setup-overlay .form-group { margin-bottom: 12px; }
    .setup-overlay .setup-icon { text-align: center; font-size: 32px; margin-bottom: 10px; }
  </style>
</head>
<body>
  <!-- Setup screen (shown when not configured) -->
  <div id="setup-screen" style="display:none;">
    <div class="setup-overlay">
      <div class="setup-icon"><img src="${iconUri}" alt="SprintBridge" style="width:64px;height:64px;border-radius:8px;" /></div>
      <h2>Welcome to SprintBridge</h2>
      <p>Connect to your Azure DevOps organization to get started.</p>
      <div class="form-group">
        <label>Organization *</label>
        <input class="form-input" id="setup-org" placeholder="e.g. myorg" />
      </div>
      <div class="form-group">
        <label>Project *</label>
        <input class="form-input" id="setup-project" placeholder="e.g. One" />
      </div>
      <div class="form-group">
        <label>Area Path</label>
        <input class="form-input" id="setup-areapath" placeholder="e.g. MyProject\\MyArea\\MyTeam" />
      </div>
      <div class="form-group">
        <label>Your Email</label>
        <input class="form-input" id="setup-email" placeholder="e.g. you@microsoft.com" />
      </div>
      <div id="setup-status"></div>
      <button class="btn btn-primary" id="setup-connect" style="width:100%;margin-top:4px;">Connect</button>
    </div>
  </div>

  <!-- Main app (hidden until configured) -->
  <div id="main-app" style="display:none;">
  <div class="tabs">
    <button class="tab active" data-tab="workitems">Work Items</button>
    <button class="tab" data-tab="board">Board</button>
    <button class="tab" data-tab="create">Create</button>
    <button class="tab" data-tab="chat">AI Chat</button>
    <button class="tab" data-tab="settings">⚙</button>
  </div>

  <!-- Work Items Panel -->
  <div class="panel active" id="panel-workitems">
    <div class="filters">
      <input class="filter-input" id="filter-areapath" placeholder="Area path (e.g. One\\Rome\\MyTeam)" />
      <select class="filter-select" id="filter-assignee">
        <option value="">Anyone</option>
        <option value="me">Assigned to me</option>
      </select>
      <select class="filter-select" id="filter-type">
        <option value="">All types</option>
        <option value="Bug">Bug</option>
        <option value="Task">Task</option>
        <option value="User Story">User Story</option>
        <option value="Product Backlog Item">Product Backlog Item</option>
        <option value="Feature">Feature</option>
        <option value="Epic">Epic</option>
      </select>
      <select class="filter-select" id="filter-state">
        <option value="">All states</option>
        <option value="New">New</option>
        <option value="Active">Active</option>
        <option value="Resolved">Resolved</option>
        <option value="Closed">Closed</option>
      </select>
    </div>
    <div class="panel-content" id="workitems-list">
      <div class="empty-state">Click a filter or sign in to load work items.</div>
    </div>
    <!-- Detail / Edit view (hidden by default) -->
    <div class="panel-content" id="workitem-detail" style="display:none;"></div>
  </div>

  <!-- Board Panel -->
  <div class="panel" id="panel-board">
    <div class="board-toolbar">
      <div class="board-field">
        <label>Team</label>
        <input id="board-team" placeholder="e.g. MyTeam" />
      </div>
      <div class="board-field">
        <label>Sprint</label>
        <select id="board-iteration">
          <option value="">Enter team → load sprints</option>
        </select>
      </div>
      <label class="toggle-wrap" style="align-self:flex-end;"><input type="checkbox" id="board-me-filter" /><span class="toggle-switch"></span>My items</label>
      <button class="board-load-btn" id="board-load">Load Board</button>
    </div>
    <div class="panel-content" id="board-container" style="padding:0;">
      <div class="empty-state">Select a team and sprint, then click <strong>Load Board</strong>.</div>
    </div>
  </div>

  <!-- Create Panel -->
  <div class="panel" id="panel-create">
    <div class="panel-content">
      <div id="create-status"></div>
      <div class="form-group">
        <label>Type</label>
        <select class="form-select" id="create-type">
          <option value="Task">Task</option>
          <option value="Bug">Bug</option>
          <option value="User Story">User Story</option>
          <option value="Product Backlog Item">Product Backlog Item</option>
          <option value="Feature">Feature</option>
          <option value="Epic">Epic</option>
        </select>
      </div>
      <div class="form-group">
        <label>Title *</label>
        <input class="form-input" id="create-title" placeholder="Enter work item title" />
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea class="form-textarea" id="create-desc" placeholder="Describe the work item..."></textarea>
      </div>
      <div class="form-group">
        <label>Assigned To</label>
        <input class="form-input" id="create-assigned" placeholder="e.g. user@example.com" />
        <label class="copilot-assign-label"><input type="checkbox" id="create-assign-copilot" /> <span class="copilot-icon">🤖</span> Assign to GitHub Copilot</label>
      </div>
      <div class="form-group">
        <label>Priority</label>
        <select class="form-select" id="create-priority">
          <option value="">Not set</option>
          <option value="1">1 - Critical</option>
          <option value="2">2 - High</option>
          <option value="3">3 - Medium</option>
          <option value="4">4 - Low</option>
        </select>
      </div>
      <div class="form-group">
        <label>Parent Work Item ID</label>
        <input class="form-input" id="create-parent" type="number" placeholder="e.g. 12345 (optional)" />
      </div>
      <button class="btn btn-primary" id="create-submit">Create Work Item</button>
    </div>
  </div>

  <!-- AI Chat Panel -->
  <div class="panel" id="panel-chat">
    <div class="chat-messages" id="chat-messages">
      <div class="chat-msg chat-msg-ai">
        <div class="chat-bubble">Hi! I can help you manage your Azure DevOps work items. Try things like:\n\n• "Show my active bugs"\n• "Create a task for updating docs"\n• "Update item 12345 state to Resolved"</div>
      </div>
    </div>
    <div class="chat-input-row">
      <input class="chat-input" id="chat-input" placeholder="Ask me anything about your work items..." />
      <button class="btn btn-primary" id="chat-send">Send</button>
    </div>
  </div>

  <!-- Settings Panel -->
  <div class="panel" id="panel-settings">
    <div class="panel-content">
      <h3 style="margin-bottom:12px;font-size:14px;">Settings</h3>
      <div class="form-group">
        <label>Organization</label>
        <input class="form-input" id="settings-org" placeholder="e.g. myorg" />
      </div>
      <div class="form-group">
        <label>Project</label>
        <input class="form-input" id="settings-project" placeholder="e.g. One" />
      </div>
      <div class="form-group">
        <label>Area Path</label>
        <input class="form-input" id="settings-areapath" placeholder="e.g. MyProject\\MyArea\\MyTeam" />
      </div>
      <div class="form-group">
        <label>Your Email</label>
        <input class="form-input" id="settings-email" placeholder="e.g. you@microsoft.com" />
      </div>
      <div id="settings-status"></div>
      <button class="btn btn-primary" id="settings-save" style="margin-top:4px;">Save</button>
      <hr style="margin:16px 0;border:none;border-top:1px solid var(--border);">
      <button class="btn btn-secondary" id="settings-signin" style="width:100%;">Sign In to Azure DevOps</button>
    </div>
  </div>

  </div><!-- /main-app -->
  <div class="copy-toast" id="copy-toast">Copied!</div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const state = vscode.getState() || { tab: 'workitems', chatHistory: [] };

    // Build an ADO work item URL from current settings
    function adoUrl(id) {
      const org = (document.getElementById('settings-org') || {}).value || '';
      const proj = (document.getElementById('settings-project') || {}).value || '';
      if (!org || !proj) return '';
      return 'https://dev.azure.com/' + encodeURIComponent(org) + '/' + encodeURIComponent(proj) + '/_workitems/edit/' + id;
    }

    // --- Setup / Config ---
    const setupScreen = document.getElementById('setup-screen');
    const mainApp = document.getElementById('main-app');

    // Ask extension for current config on load
    vscode.postMessage({ command: 'getConfig' });

    function showSetup() {
      setupScreen.style.display = 'flex';
      mainApp.style.display = 'none';
    }
    function showMain(org, project, areaPath, userEmail) {
      setupScreen.style.display = 'none';
      mainApp.style.display = 'flex';
      if (org) document.getElementById('settings-org').value = org;
      if (project) document.getElementById('settings-project').value = project;
      if (areaPath) {
        document.getElementById('settings-areapath').value = areaPath;
        document.getElementById('filter-areapath').value = areaPath;
      }
      if (userEmail) document.getElementById('settings-email').value = userEmail;
      loadWorkItems();
    }

    document.getElementById('setup-connect').addEventListener('click', () => {
      const org = document.getElementById('setup-org').value.trim();
      const project = document.getElementById('setup-project').value.trim();
      const areaPath = document.getElementById('setup-areapath').value.trim();
      const userEmail = document.getElementById('setup-email').value.trim();
      if (!org || !project) {
        document.getElementById('setup-status').innerHTML = '<div class="error-msg">Organization and Project are required.</div>';
        return;
      }
      vscode.postMessage({ command: 'saveConfig', organization: org, project: project, areaPath: areaPath, userEmail: userEmail });
    });

    document.getElementById('settings-save').addEventListener('click', () => {
      const org = document.getElementById('settings-org').value.trim();
      const project = document.getElementById('settings-project').value.trim();
      const areaPath = document.getElementById('settings-areapath').value.trim();
      const userEmail = document.getElementById('settings-email').value.trim();
      if (!org || !project) {
        document.getElementById('settings-status').innerHTML = '<div class="error-msg">Organization and Project are required.</div>';
        return;
      }
      vscode.postMessage({ command: 'saveConfig', organization: org, project: project, areaPath: areaPath, userEmail: userEmail });
    });

    document.getElementById('settings-signin').addEventListener('click', () => {
      vscode.postMessage({ command: 'signIn' });
    });

    // Tab switching
    const COPILOT_IDENTITY = 'GitHub Copilot <66dda6c5-07d0-4484-9979-116241219397@72f988bf-86f1-41af-91ab-2d7cd011db47>';
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const panelId = 'panel-' + tab.dataset.tab;
        document.getElementById(panelId).classList.add('active');
        state.tab = tab.dataset.tab;
        vscode.setState(state);

        if (tab.dataset.tab === 'workitems') {
          loadWorkItems();
        }
      });
    });

    // --- Work Items ---
    let areaPathDebounce;
    function loadWorkItems() {
      const areaPath = document.getElementById('filter-areapath').value.trim();
      const assignee = document.getElementById('filter-assignee').value;
      const type = document.getElementById('filter-type').value;
      const stateFilter = document.getElementById('filter-state').value;
      document.getElementById('workitems-list').innerHTML = '<div class="loading">Loading work items...</div>';
      document.getElementById('workitems-list').style.display = '';
      document.getElementById('workitem-detail').style.display = 'none';
      vscode.postMessage({ command: 'queryWorkItems', areaPath, assignee, type, state: stateFilter });
    }

    document.getElementById('filter-areapath').addEventListener('input', () => {
      clearTimeout(areaPathDebounce);
      areaPathDebounce = setTimeout(loadWorkItems, 600);
    });
    document.getElementById('filter-assignee').addEventListener('change', loadWorkItems);
    document.getElementById('filter-type').addEventListener('change', loadWorkItems);
    document.getElementById('filter-state').addEventListener('change', loadWorkItems);

    function buildTree(items) {
      const map = {};
      items.forEach(item => { map[item.id] = { ...item, children: [] }; });
      const roots = [];
      items.forEach(item => {
        if (item.parentId && map[item.parentId]) {
          map[item.parentId].children.push(map[item.id]);
        } else {
          roots.push(map[item.id]);
        }
      });
      return roots;
    }

    function renderTreeNode(node) {
      const typeClass = 'type-' + (node.type || '').toLowerCase().replace(/\\s+/g, '');
      const hasChildren = node.children && node.children.length > 0;
      let html = '<div class="work-item" data-id="' + node.id + '">' +
        '<div class="work-item-header">' +
          (hasChildren ? '<button class="tree-toggle" data-target="children-' + node.id + '">▼</button>' : '<span style="width:16px;display:inline-block;"></span>') +
          '<span class="type-badge ' + typeClass + '">' + esc(node.type) + '</span>' +
          '<span class="work-item-id">#' + node.id + '</span>' +
          '<span class="work-item-title">' + esc(node.title) + '</span>' +
        '</div>' +
        '<div class="work-item-meta" style="margin-left:16px;">' +
          '<span class="state-badge">' + esc(node.state || 'N/A') + '</span>' +
          '<span>' + esc(node.assignedTo || 'Unassigned') + '</span>' +
        '</div>' +
      '</div>';
      if (hasChildren) {
        html += '<div class="tree-children" id="children-' + node.id + '">';
        node.children.forEach(child => { html += renderTreeNode(child); });
        html += '</div>';
      }
      return html;
    }

    function renderWorkItems(items) {
      const container = document.getElementById('workitems-list');
      if (!items || items.length === 0) {
        container.innerHTML = '<div class="empty-state">No work items found.</div>';
        return;
      }

      const roots = buildTree(items);
      container.innerHTML = roots.map(renderTreeNode).join('');

      // Click to view detail
      container.querySelectorAll('.work-item').forEach(el => {
        el.addEventListener('click', (e) => {
          if (e.target.classList.contains('tree-toggle')) return;
          vscode.postMessage({ command: 'getWorkItem', id: parseInt(el.dataset.id) });
        });
      });

      // Toggle children
      container.querySelectorAll('.tree-toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const target = document.getElementById(btn.dataset.target);
          if (target) {
            const hidden = target.style.display === 'none';
            target.style.display = hidden ? '' : 'none';
            btn.textContent = hidden ? '▼' : '▶';
          }
        });
      });
    }

    function showDetail(item) {
      document.getElementById('workitems-list').style.display = 'none';
      const detail = document.getElementById('workitem-detail');
      detail.style.display = '';
      const typeClass = 'type-' + (item.type || '').toLowerCase().replace(/\\s+/g, '');
      detail.innerHTML =
        '<button class="detail-back">&larr; Back to list</button>' +
        '<div class="detail-title"><span class="type-badge ' + typeClass + '">' + esc(item.type) + '</span> #' + item.id + ': ' + esc(item.title) + '</div>' +
        '<div class="detail-field"><label>State</label><div class="value">' + esc(item.state || 'N/A') + '</div></div>' +
        '<div class="detail-field"><label>Assigned To</label><div class="value">' + esc(item.assignedTo || 'Unassigned') + '</div></div>' +
        '<div class="detail-field"><label>Priority</label><div class="value">' + (item.priority || 'N/A') + '</div></div>' +
        '<div class="detail-field"><label>Area Path</label><div class="value">' + esc(item.areaPath || 'N/A') + '</div></div>' +
        '<div class="detail-field"><label>Iteration</label><div class="value">' + esc(item.iterationPath || 'N/A') + '</div></div>' +
        '<div class="detail-field"><label>Remaining Work</label><div class="value">' + (item.remainingWork != null ? item.remainingWork + 'h' : 'N/A') + '</div></div>' +
        '<div class="detail-field"><label>Completed Work</label><div class="value">' + (item.completedWork != null ? item.completedWork + 'h' : 'N/A') + '</div></div>' +
        '<div class="detail-field"><label>Original Estimate</label><div class="value">' + (item.originalEstimate != null ? item.originalEstimate + 'h' : 'N/A') + '</div></div>' +
        (item.description ? '<div class="detail-field"><label>Description</label><div class="value desc-html">' + sanitizeHtml(item.description) + '</div></div>' : '') +
        '<div class="detail-actions">' +
          '<button class="btn btn-primary" id="detail-edit">Edit</button>' +
          '<button class="btn btn-danger" id="detail-delete">Delete</button>' +
        '</div>';

      detail.querySelector('.detail-back').addEventListener('click', () => {
        detail.style.display = 'none';
        document.getElementById('workitems-list').style.display = '';
      });

      detail.querySelector('#detail-edit').addEventListener('click', () => showEditForm(item));
      detail.querySelector('#detail-delete').addEventListener('click', () => {
        vscode.postMessage({ command: 'deleteWorkItem', id: item.id });
      });
    }

    function showEditForm(item) {
      const detail = document.getElementById('workitem-detail');
      detail.innerHTML =
        '<button class="detail-back">&larr; Back</button>' +
        '<div class="edit-form">' +
          '<div id="edit-status"></div>' +
          '<div class="form-group"><label>Title</label><input class="form-input" id="edit-title" value="' + escAttr(item.title) + '" /></div>' +
          '<div class="form-group"><label>State</label><input class="form-input" id="edit-state" value="' + escAttr(item.state || '') + '" /></div>' +
          '<div class="form-group"><label>Assigned To</label><input class="form-input" id="edit-assigned" value="' + escAttr(item.assignedTo || '') + '" />' +
            '<label class="copilot-assign-label"><input type="checkbox" id="edit-assign-copilot"' + (item.assignedTo && item.assignedTo.includes('GitHub Copilot') ? ' checked' : '') + ' /> <span class="copilot-icon">🤖</span> Assign to GitHub Copilot</label></div>' +
          '<div class="form-group"><label>Priority</label><select class="form-select" id="edit-priority">' +
            '<option value="">Not set</option>' +
            [1,2,3,4].map(p => '<option value="' + p + '"' + (p === item.priority ? ' selected' : '') + '>' + p + '</option>').join('') +
          '</select></div>' +
          '<div class="form-group"><label>Description</label><textarea class="form-textarea" id="edit-desc">' + esc(item.description || '') + '</textarea></div>' +
          '<div class="form-group"><label>Remaining Work (hours)</label><input class="form-input" id="edit-remaining" type="number" step="0.5" value="' + (item.remainingWork != null ? item.remainingWork : '') + '" /></div>' +
          '<div class="form-group"><label>Completed Work (hours)</label><input class="form-input" id="edit-completed" type="number" step="0.5" value="' + (item.completedWork != null ? item.completedWork : '') + '" /></div>' +
          '<div class="form-group"><label>Original Estimate (hours)</label><input class="form-input" id="edit-estimate" type="number" step="0.5" value="' + (item.originalEstimate != null ? item.originalEstimate : '') + '" /></div>' +
          '<button class="btn btn-primary" id="edit-save">Save Changes</button>' +
        '</div>';

      detail.querySelector('.detail-back').addEventListener('click', () => showDetail(item));

      const editCopilotCb = document.getElementById('edit-assign-copilot');
      const editAssignedInput = document.getElementById('edit-assigned');
      const editCopilotLabel = editCopilotCb.closest('.copilot-assign-label');
      if (editCopilotCb.checked) { editAssignedInput.disabled = true; if (editCopilotLabel) editCopilotLabel.classList.add('active'); }
      editCopilotCb.addEventListener('change', () => {
        if (editCopilotCb.checked) {
          editAssignedInput.value = COPILOT_IDENTITY;
          editAssignedInput.disabled = true;
          if (editCopilotLabel) editCopilotLabel.classList.add('active');
        } else {
          editAssignedInput.value = item.assignedTo || '';
          editAssignedInput.disabled = false;
          if (editCopilotLabel) editCopilotLabel.classList.remove('active');
        }
      });

      detail.querySelector('#edit-save').addEventListener('click', () => {
        const updates = {};
        const newTitle = document.getElementById('edit-title').value;
        const newState = document.getElementById('edit-state').value;
        const newAssigned = document.getElementById('edit-assigned').value;
        const newPriority = document.getElementById('edit-priority').value;
        const newDesc = document.getElementById('edit-desc').value;
        const newRemaining = document.getElementById('edit-remaining').value;
        const newCompleted = document.getElementById('edit-completed').value;
        const newEstimate = document.getElementById('edit-estimate').value;

        if (newTitle !== item.title) updates.title = newTitle;
        if (newState !== (item.state || '')) updates.state = newState;
        if (newAssigned !== (item.assignedTo || '')) updates.assignedTo = newAssigned || undefined;
        if (newPriority !== String(item.priority || '')) updates.priority = newPriority ? parseInt(newPriority) : undefined;
        if (newDesc !== (item.description || '')) updates.description = newDesc || undefined;
        if (newRemaining !== String(item.remainingWork != null ? item.remainingWork : '')) updates.remainingWork = newRemaining !== '' ? parseFloat(newRemaining) : undefined;
        if (newCompleted !== String(item.completedWork != null ? item.completedWork : '')) updates.completedWork = newCompleted !== '' ? parseFloat(newCompleted) : undefined;
        if (newEstimate !== String(item.originalEstimate != null ? item.originalEstimate : '')) updates.originalEstimate = newEstimate !== '' ? parseFloat(newEstimate) : undefined;

        if (Object.keys(updates).length === 0) {
          document.getElementById('edit-status').innerHTML = '<div class="error-msg">No changes detected.</div>';
          return;
        }
        vscode.postMessage({ command: 'updateWorkItem', id: item.id, updates });
      });
    }

    // --- Create ---
    const copilotCheckbox = document.getElementById('create-assign-copilot');
    const assignedInput = document.getElementById('create-assigned');

    copilotCheckbox.addEventListener('change', () => {
      const label = copilotCheckbox.closest('.copilot-assign-label');
      if (copilotCheckbox.checked) {
        assignedInput.value = COPILOT_IDENTITY;
        assignedInput.disabled = true;
        if (label) label.classList.add('active');
      } else {
        assignedInput.value = '';
        assignedInput.disabled = false;
        if (label) label.classList.remove('active');
      }
    });

    document.getElementById('create-submit').addEventListener('click', () => {
      const title = document.getElementById('create-title').value.trim();
      if (!title) {
        document.getElementById('create-status').innerHTML = '<div class="error-msg">Title is required.</div>';
        return;
      }
      document.getElementById('create-submit').disabled = true;
      document.getElementById('create-status').innerHTML = '<div class="loading">Creating...</div>';
      const assignedTo = copilotCheckbox.checked ? COPILOT_IDENTITY : (assignedInput.value || undefined);
      vscode.postMessage({
        command: 'createWorkItem',
        type: document.getElementById('create-type').value,
        title,
        description: document.getElementById('create-desc').value || undefined,
        assignedTo,
        priority: document.getElementById('create-priority').value ? parseInt(document.getElementById('create-priority').value) : undefined,
        parentId: document.getElementById('create-parent').value ? parseInt(document.getElementById('create-parent').value) : undefined
      });
    });

    // --- Sprint Board ---
    const boardTeamInput = document.getElementById('board-team');
    const boardIterSel = document.getElementById('board-iteration');
    let boardTeamTimer = null;

    boardTeamInput.addEventListener('input', () => {
      clearTimeout(boardTeamTimer);
      boardTeamTimer = setTimeout(() => {
        const team = boardTeamInput.value.trim();
        if (team) {
          boardIterSel.innerHTML = '<option value="">Loading sprints...</option>';
          vscode.postMessage({ command: 'getIterations', team });
        }
      }, 600);
    });

    document.getElementById('board-load').addEventListener('click', () => {
      const team = boardTeamInput.value.trim();
      if (!team) {
        document.getElementById('board-container').innerHTML = '<div class="error-msg">Please enter a team name.</div>';
        return;
      }
      const iteration = boardIterSel.value;
      if (!iteration) {
        document.getElementById('board-container').innerHTML = '<div class="error-msg">Please select a sprint.</div>';
        return;
      }
      document.getElementById('board-container').innerHTML = '<div class="loading">Loading board...</div>';
      vscode.postMessage({
        command: 'getBoardItems',
        team: team,
        iterationPath: iteration,
        assignedToMe: document.getElementById('board-me-filter').checked
      });
    });

    const boardStates = ['New', 'Optional', 'Committed', 'In Progress', 'In Review', 'Done'];

    function renderBoard(items) {
      const container = document.getElementById('board-container');
      const grouped = {};
      boardStates.forEach(s => { grouped[s] = []; });
      const otherStates = [];

      items.forEach(item => {
        const st = item.state || 'New';
        if (grouped[st]) {
          grouped[st].push(item);
        } else {
          if (!grouped[st]) { grouped[st] = []; otherStates.push(st); }
          grouped[st].push(item);
        }
      });

      const allStates = [...boardStates, ...otherStates];
      let html = '<div class="board-columns">';
      allStates.forEach(state => {
        const cards = grouped[state] || [];
        html += '<div class="board-column">' +
          '<div class="board-column-header">' + esc(state) + ' <span class="col-count">(' + cards.length + ')</span></div>' +
          '<div class="board-column-body" data-state="' + escAttr(state) + '">';
        cards.forEach(item => {
          const typeClass = 'type-' + (item.type || '').toLowerCase().replace(/\\s+/g, '');
          html += '<div class="board-card" draggable="true" data-id="' + item.id + '">' +
            '<div><span class="type-badge ' + typeClass + '">' + esc(item.type) + '</span> <span class="board-card-id" data-copy-id="' + item.id + '" title="Click to copy ID">#' + item.id + '</span></div>' +
            '<div class="board-card-title">' + esc(item.title) + '</div>' +
            '<div class="board-card-meta">' + esc(item.assignedTo || 'Unassigned') + '</div>' +
          '</div>';
        });
        html += '</div></div>';
      });
      html += '</div>';
      container.innerHTML = html;

      // Drag and drop
      container.querySelectorAll('.board-card').forEach(card => {
        card.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', card.dataset.id);
          e.dataTransfer.effectAllowed = 'move';
        });
      });

      container.querySelectorAll('.board-column-body').forEach(col => {
        col.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          col.classList.add('drag-target');
        });
        col.addEventListener('dragleave', () => {
          col.classList.remove('drag-target');
        });
        col.addEventListener('drop', (e) => {
          e.preventDefault();
          col.classList.remove('drag-target');
          const itemId = parseInt(e.dataTransfer.getData('text/plain'));
          const newState = col.dataset.state;
          if (itemId && newState) {
            vscode.postMessage({ command: 'moveWorkItem', id: itemId, newState });
          }
        });
      });

      // Click work item ID to open in ADO
      container.querySelectorAll('.board-card-id[data-copy-id]').forEach(el => {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = el.getAttribute('data-copy-id');
          const url = adoUrl(id);
          if (url) {
            vscode.postMessage({ command: 'openExternal', url });
          }
        });
      });
    }

    // --- Chat ---
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');

    function addChatMessage(role, text) {
      const div = document.createElement('div');
      div.className = 'chat-msg chat-msg-' + role;
      const bubble = document.createElement('div');
      bubble.className = 'chat-bubble';
      if (role === 'ai') {
        bubble.innerHTML = renderMarkdown(text);
      } else {
        bubble.textContent = text;
      }
      div.appendChild(bubble);
      chatMessages.appendChild(div);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function renderMarkdown(text) {
      if (!text) return '';
      // Escape HTML first
      let s = esc(text);
      // Code blocks (triple backtick)
      s = s.replace(/\`\`\`([\\s\\S]*?)\`\`\`/g, function(m, code) {
        return '<pre><code>' + code.trim() + '</code></pre>';
      });
      // Inline code
      s = s.replace(/\`([^\`]+)\`/g, '<code>$1</code>');
      // Bold
      s = s.replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>');
      // Italic
      s = s.replace(/\\*(.+?)\\*/g, '<em>$1</em>');
      // Work item IDs — make them clickable tags
      s = s.replace(/#(\\d{4,})/g, '<span class="wi-tag" data-id="$1">#$1</span>');
      // Unordered lists
      s = s.replace(/(^|\\n)[•\\-\\*]\\s+(.+)/g, function(m, pre, item) {
        return (pre || '') + '<li>' + item + '</li>';
      });
      s = s.replace(/((?:<li>.*<\\/li>\\s*)+)/g, '<ul>$1</ul>');
      // Paragraphs — split on double newlines
      s = s.split(/\\n{2,}/).map(function(p) {
        p = p.trim();
        if (!p || p.startsWith('<pre') || p.startsWith('<ul') || p.startsWith('<ol')) return p;
        return '<p>' + p.replace(/\\n/g, '<br>') + '</p>';
      }).join('');
      return s;
    }

    function sendChat() {
      const text = chatInput.value.trim();
      if (!text) return;
      addChatMessage('user', text);
      chatInput.value = '';
      vscode.postMessage({ command: 'chatMessage', text });
    }

    document.getElementById('chat-send').addEventListener('click', sendChat);
    chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendChat(); });
    chatMessages.addEventListener('click', function(e) {
      const tag = e.target.closest('.wi-tag');
      if (tag) {
        const id = tag.getAttribute('data-id');
        const url = adoUrl(id);
        if (url) {
          vscode.postMessage({ command: 'openExternal', url });
        }
      }
    });

    // Global handler: clickable work item links anywhere in the page
    document.addEventListener('click', function(e) {
      const link = e.target.closest('.wi-link[data-url]');
      if (link) {
        e.preventDefault();
        vscode.postMessage({ command: 'openExternal', url: link.getAttribute('data-url') });
      }
    });

    // --- Message handler ---
    window.addEventListener('message', event => {
      const msg = event.data;
      switch (msg.command) {
        case 'configLoaded':
          if (msg.organization && msg.project) {
            showMain(msg.organization, msg.project, msg.areaPath, msg.userEmail);
          } else {
            showSetup();
          }
          break;
        case 'configSaved':
          document.getElementById('settings-status').innerHTML = '<div class="success-msg">Settings saved!</div>';
          showMain(msg.organization, msg.project, msg.areaPath, msg.userEmail);
          break;
        case 'workItemsLoaded':
          renderWorkItems(msg.items);
          break;
        case 'workItemLoaded':
          showDetail(msg.item);
          break;
        case 'workItemCreated':
          document.getElementById('create-submit').disabled = false;
          var createUrl = adoUrl(msg.item.id);
          document.getElementById('create-status').innerHTML = '<div class="success-msg">\\u2705 Created ' + (createUrl ? '<a class="wi-link" data-url="' + escAttr(createUrl) + '">#' + msg.item.id + '</a>' : '#' + msg.item.id) + ': ' + esc(msg.item.title) + '</div>';
          document.getElementById('create-title').value = '';
          document.getElementById('create-desc').value = '';
          document.getElementById('create-assigned').value = '';
          document.getElementById('create-assigned').disabled = false;
          document.getElementById('create-assign-copilot').checked = false;
          var createCopilotLabel = document.getElementById('create-assign-copilot').closest('.copilot-assign-label');
          if (createCopilotLabel) createCopilotLabel.classList.remove('active');
          document.getElementById('create-priority').value = '';
          document.getElementById('create-parent').value = '';
          break;
        case 'workItemUpdated':
          showDetail(msg.item);
          // Show success toast at top of detail view
          const detailEl = document.querySelector('.detail-view');
          if (detailEl) {
            const toast = document.createElement('div');
            toast.className = 'success-msg';
            var updateUrl = adoUrl(msg.item.id);
            toast.innerHTML = '\\u2705 Work item ' + (updateUrl ? '<a class="wi-link" data-url="' + escAttr(updateUrl) + '">#' + msg.item.id + '</a>' : '#' + msg.item.id) + ' updated successfully!';
            detailEl.insertBefore(toast, detailEl.firstChild);
            setTimeout(() => toast.remove(), 4000);
          }
          break;
        case 'workItemDeleted':
          loadWorkItems();
          // Brief flash message before list reloads
          const listEl = document.getElementById('work-items-list');
          if (listEl) {
            const toast = document.createElement('div');
            toast.className = 'success-msg';
            toast.textContent = '\\u2705 Work item #' + msg.id + ' deleted.';
            listEl.insertBefore(toast, listEl.firstChild);
            setTimeout(() => toast.remove(), 3000);
          }
          break;
        case 'iterationsLoaded':
          boardIterSel.innerHTML = '<option value="">Select sprint...</option>';
          (msg.iterations || []).forEach(it => {
            const label = it.name + (it.timeFrame === 'current' ? ' (current)' : '');
            boardIterSel.innerHTML += '<option value="' + escAttr(it.path) + '"' + (it.timeFrame === 'current' ? ' selected' : '') + '>' + esc(label) + '</option>';
          });
          break;
        case 'boardItemsLoaded':
          renderBoard(msg.items || []);
          break;
        case 'workItemMoved':
          // Reload the board after a move
          document.getElementById('board-load').click();
          break;
        case 'chatResponse':
          addChatMessage('ai', msg.text);
          break;
        case 'error':
          // Show error in appropriate place
          if (msg.context === 'create') {
            document.getElementById('create-submit').disabled = false;
            document.getElementById('create-status').innerHTML = '<div class="error-msg">' + esc(msg.message) + '</div>';
          } else if (msg.context === 'edit') {
            const es = document.getElementById('edit-status');
            if (es) es.innerHTML = '<div class="error-msg">' + esc(msg.message) + '</div>';
          } else if (msg.context === 'chat') {
            addChatMessage('ai', '\\u274c ' + msg.message);
          } else if (msg.context === 'board') {
            document.getElementById('board-container').innerHTML = '<div class="error-msg">' + esc(msg.message) + '</div>';
          } else {
            document.getElementById('workitems-list').innerHTML = '<div class="error-msg">' + esc(msg.message) + '</div>';
          }
          break;
      }
    });

    function esc(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
    function escAttr(s) { return (s || '').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
    function sanitizeHtml(html) {
      if (!html) return '';
      const div = document.createElement('div');
      div.innerHTML = html;
      // Remove script/style tags
      div.querySelectorAll('script,style,iframe,object,embed').forEach(el => el.remove());
      return div.innerHTML;
    }
  </script>
</body>
</html>`;
}
