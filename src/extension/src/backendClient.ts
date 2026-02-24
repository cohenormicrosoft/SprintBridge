import * as http from "http";

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
}

export interface UpdateWorkItemRequest {
  title?: string;
  description?: string;
  assignedTo?: string;
  state?: string;
  areaPath?: string;
  iterationPath?: string;
  priority?: number;
}

export class BackendClient {
  private baseUrl: string;

  constructor(port: number = 5059) {
    this.baseUrl = `http://localhost:${port}`;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await this.request("GET", "/health");
      return res.status === "healthy";
    } catch {
      return false;
    }
  }

  async getWorkItem(
    organization: string,
    project: string,
    id: number,
    token: string
  ): Promise<WorkItem | null> {
    try {
      return await this.request(
        "GET",
        `/api/workitems/${organization}/${project}/${id}`,
        undefined,
        token
      );
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
    return await this.request(
      "POST",
      `/api/workitems/${organization}/${project}`,
      request,
      token
    );
  }

  async updateWorkItem(
    organization: string,
    project: string,
    id: number,
    request: UpdateWorkItemRequest,
    token: string
  ): Promise<WorkItem | null> {
    try {
      return await this.request(
        "PATCH",
        `/api/workitems/${organization}/${project}/${id}`,
        request,
        token
      );
    } catch {
      return null;
    }
  }

  async deleteWorkItem(
    organization: string,
    project: string,
    id: number,
    token: string
  ): Promise<boolean> {
    try {
      await this.request(
        "DELETE",
        `/api/workitems/${organization}/${project}/${id}`,
        undefined,
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
    return await this.request(
      "POST",
      `/api/workitems/${organization}/${project}/query`,
      { wiql },
      token
    );
  }

  private request(
    method: string,
    path: string,
    body?: unknown,
    token?: string
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const req = http.request(
        {
          hostname: url.hostname,
          port: url.port,
          path: url.pathname,
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
              reject(
                new Error(
                  `HTTP ${res.statusCode}: ${data || res.statusMessage}`
                )
              );
            }
          });
        }
      );

      req.on("error", reject);
      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  }
}
