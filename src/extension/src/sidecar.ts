import * as vscode from "vscode";
import * as cp from "child_process";
import * as path from "path";

export class SidecarManager {
  private process: cp.ChildProcess | undefined;
  private outputChannel: vscode.OutputChannel;
  private port: number;
  private ready = false;

  constructor(outputChannel: vscode.OutputChannel, port: number = 5059) {
    this.outputChannel = outputChannel;
    this.port = port;
  }

  async start(extensionPath: string): Promise<void> {
    if (this.process && this.ready) {
      this.outputChannel.appendLine("Backend already running.");
      return;
    }

    const backendPath = path.join(
      extensionPath,
      "..",
      "..",
      "backend",
      "SprintBridge.Api"
    );

    this.outputChannel.appendLine(
      `Starting SprintBridge backend on port ${this.port}...`
    );

    this.process = cp.spawn("dotnet", ["run", "--urls", `http://localhost:${this.port}`], {
      cwd: backendPath,
      env: { ...process.env, ASPNETCORE_ENVIRONMENT: "Development" },
      stdio: ["pipe", "pipe", "pipe"],
    });

    this.process.stdout?.on("data", (data: Buffer) => {
      this.outputChannel.appendLine(`[backend] ${data.toString().trim()}`);
    });

    this.process.stderr?.on("data", (data: Buffer) => {
      this.outputChannel.appendLine(`[backend:err] ${data.toString().trim()}`);
    });

    this.process.on("exit", (code) => {
      this.outputChannel.appendLine(`Backend exited with code ${code}`);
      this.ready = false;
      this.process = undefined;
    });

    // Wait for backend to be ready
    await this.waitForReady();
  }

  private async waitForReady(
    maxRetries: number = 30,
    intervalMs: number = 1000
  ): Promise<void> {
    const http = await import("http");

    for (let i = 0; i < maxRetries; i++) {
      try {
        const healthy = await new Promise<boolean>((resolve) => {
          const req = http.get(
            `http://localhost:${this.port}/health`,
            (res) => {
              resolve(res.statusCode === 200);
            }
          );
          req.on("error", () => resolve(false));
          req.setTimeout(1000, () => {
            req.destroy();
            resolve(false);
          });
        });

        if (healthy) {
          this.ready = true;
          this.outputChannel.appendLine("Backend is ready!");
          return;
        }
      } catch {
        // retry
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }

    throw new Error("Backend failed to start within timeout");
  }

  isRunning(): boolean {
    return this.ready && !!this.process;
  }

  stop(): void {
    if (this.process) {
      this.outputChannel.appendLine("Stopping backend...");
      this.process.kill();
      this.process = undefined;
      this.ready = false;
    }
  }
}
