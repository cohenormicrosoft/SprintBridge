import * as https from "https";

export interface WorkItem {
  id: number;
  type: string;
  title: string;
  description?: string;
  assignedTo?: string;
  state?: string;
  areaPath?: string;
  iterationPath?: string;
  priority?: number;
  url?: string;
  createdDate?: string;
  changedDate?: string;
  parentId?: number;
  childIds?: number[];
  remainingWork?: number;
  completedWork?: number;
  originalEstimate?: number;
  tags?: string;
}

export interface CreateWorkItemRequest {
  type: string;
  title: string;
  description?: string;
  assignedTo?: string;
  state?: string;
  areaPath?: string;
  iterationPath?: string;
  priority?: number;
  remainingWork?: number;
  completedWork?: number;
  originalEstimate?: number;
  tags?: string;
}

export interface UpdateWorkItemRequest {
  title?: string;
  description?: string;
  assignedTo?: string;
  state?: string;
  areaPath?: string;
  iterationPath?: string;
  priority?: number;
  remainingWork?: number;
  completedWork?: number;
  originalEstimate?: number;
  tags?: string;
}

const ADO_API_VERSION = "7.1";

export class BackendClient {
  private baseUrl = "https://dev.azure.com";

  async getWorkItem(
    organization: string,
    project: string,
    id: number,
    token: string
  ): Promise<WorkItem | null> {
    try {
      const json = await this.adoRequest(
        "GET",
        `/${organization}/${project}/_apis/wit/workitems/${id}?$expand=all&api-version=${ADO_API_VERSION}`,
        token
      );
      return mapWorkItem(json);
    } catch {
      return null;
    }
  }

  async getWorkItemsByIds(
    organization: string,
    project: string,
    ids: number[],
    token: string
  ): Promise<WorkItem[]> {
    if (ids.length === 0) { return []; }
    const all: WorkItem[] = [];
    for (let i = 0; i < ids.length; i += 200) {
      const batch = ids.slice(i, i + 200);
      try {
        const json = await this.adoRequest(
          "GET",
          `/${organization}/${project}/_apis/wit/workitems?ids=${batch.join(",")}&$expand=all&api-version=${ADO_API_VERSION}`,
          token
        );
        const values = json?.value;
        if (values && Array.isArray(values)) { all.push(...values.map(mapWorkItem)); }
      } catch { /* skip batch on error */ }
    }
    return all;
  }

  async createWorkItem(
    organization: string,
    project: string,
    request: CreateWorkItemRequest,
    token: string
  ): Promise<WorkItem> {
    const patchDoc: any[] = [];
    patchDoc.push({ op: "add", path: "/fields/System.Title", value: request.title });
    if (request.description) { patchDoc.push({ op: "add", path: "/fields/System.Description", value: request.description }); }
    if (request.assignedTo) { patchDoc.push({ op: "add", path: "/fields/System.AssignedTo", value: request.assignedTo }); }
    if (request.state) { patchDoc.push({ op: "add", path: "/fields/System.State", value: request.state }); }
    if (request.areaPath) { patchDoc.push({ op: "add", path: "/fields/System.AreaPath", value: request.areaPath }); }
    if (request.iterationPath) { patchDoc.push({ op: "add", path: "/fields/System.IterationPath", value: request.iterationPath }); }
    if (request.priority) { patchDoc.push({ op: "add", path: "/fields/Microsoft.VSTS.Common.Priority", value: request.priority }); }
    if (request.remainingWork != null) { patchDoc.push({ op: "add", path: "/fields/Microsoft.VSTS.Scheduling.RemainingWork", value: request.remainingWork }); }
    if (request.completedWork != null) { patchDoc.push({ op: "add", path: "/fields/Microsoft.VSTS.Scheduling.CompletedWork", value: request.completedWork }); }
    if (request.originalEstimate != null) { patchDoc.push({ op: "add", path: "/fields/Microsoft.VSTS.Scheduling.OriginalEstimate", value: request.originalEstimate }); }
    if (request.tags) { patchDoc.push({ op: "add", path: "/fields/System.Tags", value: request.tags }); }

    const encodedType = encodeURIComponent(request.type);
    const json = await this.adoRequest(
      "POST",
      `/${organization}/${project}/_apis/wit/workitems/$${encodedType}?api-version=${ADO_API_VERSION}`,
      token,
      patchDoc,
      "application/json-patch+json"
    );
    return mapWorkItem(json);
  }

  async updateWorkItem(
    organization: string,
    project: string,
    id: number,
    request: UpdateWorkItemRequest,
    token: string
  ): Promise<WorkItem> {
    const patchDoc: any[] = [];
    if (request.title != null) { patchDoc.push({ op: "add", path: "/fields/System.Title", value: request.title }); }
    if (request.description != null) { patchDoc.push({ op: "add", path: "/fields/System.Description", value: request.description }); }
    if (request.assignedTo != null) { patchDoc.push({ op: "add", path: "/fields/System.AssignedTo", value: request.assignedTo }); }
    if (request.state != null) { patchDoc.push({ op: "add", path: "/fields/System.State", value: request.state }); }
    if (request.areaPath != null) { patchDoc.push({ op: "add", path: "/fields/System.AreaPath", value: request.areaPath }); }
    if (request.iterationPath != null) { patchDoc.push({ op: "add", path: "/fields/System.IterationPath", value: request.iterationPath }); }
    if (request.priority != null) { patchDoc.push({ op: "add", path: "/fields/Microsoft.VSTS.Common.Priority", value: request.priority }); }
    if (request.remainingWork != null) { patchDoc.push({ op: "add", path: "/fields/Microsoft.VSTS.Scheduling.RemainingWork", value: request.remainingWork }); }
    if (request.completedWork != null) { patchDoc.push({ op: "add", path: "/fields/Microsoft.VSTS.Scheduling.CompletedWork", value: request.completedWork }); }
    if (request.originalEstimate != null) { patchDoc.push({ op: "add", path: "/fields/Microsoft.VSTS.Scheduling.OriginalEstimate", value: request.originalEstimate }); }
    if (request.tags != null) { patchDoc.push({ op: "add", path: "/fields/System.Tags", value: request.tags }); }

    if (patchDoc.length === 0) {
      const item = await this.getWorkItem(organization, project, id, token);
      if (!item) { throw new Error(`Work item #${id} not found`); }
      return item;
    }

    const json = await this.adoRequest(
      "PATCH",
      `/${organization}/${project}/_apis/wit/workitems/${id}?api-version=${ADO_API_VERSION}`,
      token,
      patchDoc,
      "application/json-patch+json"
    );
    return mapWorkItem(json);
  }

  async deleteWorkItem(
    organization: string,
    project: string,
    id: number,
    token: string
  ): Promise<boolean> {
    try {
      await this.adoRequest(
        "DELETE",
        `/${organization}/${project}/_apis/wit/workitems/${id}?api-version=${ADO_API_VERSION}`,
        token
      );
      return true;
    } catch {
      return false;
    }
  }

  async queryWorkItems(
    organization: string,
    project: string,
    wiql: string,
    token: string,
    top: number = 200
  ): Promise<WorkItem[]> {
    const queryResult = await this.adoRequest(
      "POST",
      `/${organization}/${project}/_apis/wit/wiql?$top=${top}&api-version=${ADO_API_VERSION}`,
      token,
      { query: wiql }
    );

    const items = queryResult?.workItems;
    if (!items || !Array.isArray(items) || items.length === 0) { return []; }

    // Fetch details in batches of 200 (ADO limit per request)
    const allDetails: WorkItem[] = [];
    const allIds = items.map((wi: any) => wi.id);
    for (let i = 0; i < allIds.length; i += 200) {
      const batch = allIds.slice(i, i + 200);
      const idsParam = batch.join(",");
      const detailsJson = await this.adoRequest(
        "GET",
        `/${organization}/${project}/_apis/wit/workitems?ids=${idsParam}&$expand=all&api-version=${ADO_API_VERSION}`,
        token
      );
      const values = detailsJson?.value;
      if (values && Array.isArray(values)) {
        allDetails.push(...values.map(mapWorkItem));
      }
    }
    return allDetails;
  }

  async addBranchLink(
    organization: string,
    project: string,
    workItemId: number,
    projectId: string,
    repoId: string,
    branchName: string,
    token: string
  ): Promise<void> {
    // vstfs:///Git/Ref/{ProjectID}/{RepoID}/GB{BranchName}
    const encodedBranch = encodeURIComponent(branchName).replace(/%2F/g, "%252F");
    const artifactUrl = `vstfs:///Git/Ref/${projectId}/${repoId}/GB${encodedBranch}`;
    const patchDoc = [{
      op: "add",
      path: "/relations/-",
      value: {
        rel: "ArtifactLink",
        url: artifactUrl,
        attributes: { name: "Branch" },
      },
    }];
    await this.adoRequest(
      "PATCH",
      `/${organization}/${project}/_apis/wit/workitems/${workItemId}?api-version=${ADO_API_VERSION}`,
      token,
      patchDoc,
      "application/json-patch+json"
    );
  }

  async getRepositories(
    organization: string,
    project: string,
    token: string
  ): Promise<{ id: string; name: string }[]> {
    const json = await this.adoRequest(
      "GET",
      `/${organization}/${project}/_apis/git/repositories?api-version=${ADO_API_VERSION}`,
      token
    );
    const items = json?.value;
    if (!items || !Array.isArray(items)) { return []; }
    return items.map((r: any) => ({ id: r.id, name: r.name }));
  }

  async getProjectId(
    organization: string,
    project: string,
    token: string
  ): Promise<string> {
    const json = await this.adoRequest(
      "GET",
      `/${organization}/_apis/projects/${project}?api-version=${ADO_API_VERSION}`,
      token
    );
    return json?.id || "";
  }

  async addParentLink(
    organization: string,
    project: string,
    childId: number,
    parentId: number,
    token: string
  ): Promise<void> {
    const patchDoc = [{
      op: "add",
      path: "/relations/-",
      value: {
        rel: "System.LinkTypes.Hierarchy-Reverse",
        url: `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems/${parentId}`,
      },
    }];
    await this.adoRequest(
      "PATCH",
      `/${organization}/${project}/_apis/wit/workitems/${childId}?api-version=${ADO_API_VERSION}`,
      token,
      patchDoc,
      "application/json-patch+json"
    );
  }

  async getIterations(
    organization: string,
    project: string,
    team: string,
    token: string
  ): Promise<{ id: string; name: string; path: string; startDate?: string; finishDate?: string; timeFrame?: string }[]> {
    const json = await this.adoRequest(
      "GET",
      `/${organization}/${project}/${encodeURIComponent(team)}/_apis/work/teamsettings/iterations?api-version=${ADO_API_VERSION}`,
      token
    );
    const items = json?.value;
    if (!items || !Array.isArray(items)) { return []; }
    return items.map((it: any) => ({
      id: it.id,
      name: it.name,
      path: it.path,
      startDate: it.attributes?.startDate || undefined,
      finishDate: it.attributes?.finishDate || undefined,
      timeFrame: it.attributes?.timeFrame || undefined,
    }));
  }

  async getTeams(
    organization: string,
    project: string,
    token: string
  ): Promise<{ id: string; name: string }[]> {
    const allTeams: { id: string; name: string }[] = [];
    const pageSize = 500;
    let skip = 0;
    while (true) {
      const json = await this.adoRequest(
        "GET",
        `/${organization}/_apis/projects/${project}/teams?$top=${pageSize}&$skip=${skip}&api-version=${ADO_API_VERSION}`,
        token
      );
      const items = json?.value;
      if (!items || !Array.isArray(items) || items.length === 0) { break; }
      allTeams.push(...items.map((t: any) => ({ id: t.id, name: t.name })));
      if (items.length < pageSize) { break; }
      skip += pageSize;
    }
    return allTeams;
  }

  async getTeamFieldValues(
    organization: string,
    project: string,
    team: string,
    token: string
  ): Promise<{ defaultValue: string; values: { value: string; includeChildren: boolean }[] }> {
    const json = await this.adoRequest(
      "GET",
      `/${organization}/${project}/${encodeURIComponent(team)}/_apis/work/teamsettings/teamfieldvalues?api-version=${ADO_API_VERSION}`,
      token
    );
    return {
      defaultValue: json?.defaultValue || "",
      values: (json?.values || []).map((v: any) => ({ value: v.value, includeChildren: v.includeChildren })),
    };
  }

  private adoRequest(
    method: string,
    path: string,
    token: string,
    body?: unknown,
    contentType: string = "application/json"
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const bodyStr = body ? JSON.stringify(body) : undefined;
      const headers: Record<string, string> = {
        "Authorization": `Bearer ${token}`,
      };
      if (bodyStr) {
        headers["Content-Type"] = contentType;
        headers["Content-Length"] = Buffer.byteLength(bodyStr).toString();
      }

      const req = https.request(
        {
          hostname: "dev.azure.com",
          path,
          method,
          headers,
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              try {
                resolve(data ? JSON.parse(data) : undefined);
              } catch {
                resolve(data);
              }
            } else {
              const code = res.statusCode || 0;
              let friendly: string;
              if (code === 302 || code === 301 || code === 401) {
                friendly = "Your session has expired. Please sign out and sign back in from the Settings tab.";
              } else if (code === 403) {
                friendly = "Access denied. Check that your account has permission to this Azure DevOps resource.";
              } else if (code === 404) {
                friendly = "Resource not found. Please verify your organization, project, and team names in Settings.";
              } else if (code === 400) {
                // Try to extract a meaningful message from ADO error body
                try {
                  const body = JSON.parse(data);
                  friendly = body.message || data;
                } catch {
                  friendly = data || "Bad request. Please check your input and try again.";
                }
              } else {
                friendly = `Unexpected error (HTTP ${code}). Please try again or check your settings.`;
              }
              reject(new Error(friendly));
            }
          });
        }
      );

      req.on("error", reject);
      if (bodyStr) { req.write(bodyStr); }
      req.end();
    });
  }
}

function mapWorkItem(json: any): WorkItem {
  const fields = json.fields || {};
  const assignedTo = fields["System.AssignedTo"];
  let assignedToStr: string | undefined;
  if (assignedTo && typeof assignedTo === "object") {
    assignedToStr = assignedTo.displayName || assignedTo.uniqueName;
  } else if (typeof assignedTo === "string") {
    assignedToStr = assignedTo;
  }

  let parentId: number | undefined;
  const childIds: number[] = [];
  if (json.relations && Array.isArray(json.relations)) {
    for (const rel of json.relations) {
      if (rel.url) {
        const lastSlash = rel.url.lastIndexOf("/");
        const linkedId = lastSlash >= 0 ? parseInt(rel.url.substring(lastSlash + 1), 10) : NaN;
        if (!isNaN(linkedId)) {
          if (rel.rel === "System.LinkTypes.Hierarchy-Reverse") {
            parentId = linkedId;
          } else if (rel.rel === "System.LinkTypes.Hierarchy-Forward") {
            childIds.push(linkedId);
          }
        }
      }
    }
  }

  return {
    id: json.id,
    type: fields["System.WorkItemType"] || "",
    title: fields["System.Title"] || "",
    description: fields["System.Description"] || undefined,
    assignedTo: assignedToStr,
    state: fields["System.State"] || undefined,
    areaPath: fields["System.AreaPath"] || undefined,
    iterationPath: fields["System.IterationPath"] || undefined,
    priority: fields["Microsoft.VSTS.Common.Priority"] || undefined,
    url: json.url || undefined,
    createdDate: fields["System.CreatedDate"] || undefined,
    changedDate: fields["System.ChangedDate"] || undefined,
    parentId,
    childIds: childIds.length > 0 ? childIds : undefined,
    remainingWork: fields["Microsoft.VSTS.Scheduling.RemainingWork"] ?? undefined,
    completedWork: fields["Microsoft.VSTS.Scheduling.CompletedWork"] ?? undefined,
    originalEstimate: fields["Microsoft.VSTS.Scheduling.OriginalEstimate"] ?? undefined,
    tags: fields["System.Tags"] || undefined,
  };
}
