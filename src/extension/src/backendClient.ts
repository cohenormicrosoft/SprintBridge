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
  remainingWork?: number;
  completedWork?: number;
  originalEstimate?: number;
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

    const json = await this.adoRequest(
      "POST",
      `/${organization}/${project}/_apis/wit/workitems/$${request.type}?api-version=${ADO_API_VERSION}`,
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
    token: string
  ): Promise<WorkItem[]> {
    const queryResult = await this.adoRequest(
      "POST",
      `/${organization}/${project}/_apis/wit/wiql?api-version=${ADO_API_VERSION}`,
      token,
      { query: wiql }
    );

    const items = queryResult?.workItems;
    if (!items || !Array.isArray(items) || items.length === 0) { return []; }

    const ids = items.slice(0, 50).map((wi: any) => wi.id);
    const idsParam = ids.join(",");

    const detailsJson = await this.adoRequest(
      "GET",
      `/${organization}/${project}/_apis/wit/workitems?ids=${idsParam}&$expand=all&api-version=${ADO_API_VERSION}`,
      token
    );

    const values = detailsJson?.value;
    if (!values || !Array.isArray(values)) { return []; }
    return values.map(mapWorkItem);
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
    const json = await this.adoRequest(
      "GET",
      `/${organization}/_apis/projects/${project}/teams?api-version=${ADO_API_VERSION}`,
      token
    );
    const items = json?.value;
    if (!items || !Array.isArray(items)) { return []; }
    return items.map((t: any) => ({ id: t.id, name: t.name }));
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
              reject(new Error(`HTTP ${res.statusCode}: ${data || res.statusMessage}`));
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
  if (json.relations && Array.isArray(json.relations)) {
    for (const rel of json.relations) {
      if (rel.rel === "System.LinkTypes.Hierarchy-Reverse" && rel.url) {
        const lastSlash = rel.url.lastIndexOf("/");
        if (lastSlash >= 0) {
          const parsed = parseInt(rel.url.substring(lastSlash + 1), 10);
          if (!isNaN(parsed)) { parentId = parsed; }
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
    remainingWork: fields["Microsoft.VSTS.Scheduling.RemainingWork"] ?? undefined,
    completedWork: fields["Microsoft.VSTS.Scheduling.CompletedWork"] ?? undefined,
    originalEstimate: fields["Microsoft.VSTS.Scheduling.OriginalEstimate"] ?? undefined,
  };
}
