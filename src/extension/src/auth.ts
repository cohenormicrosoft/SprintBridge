import * as vscode from "vscode";

const MICROSOFT_AUTH_PROVIDER = "microsoft";
const ADO_SCOPES = ["499b84ac-1321-427f-aa17-267ca6975798/.default"];

export class AuthProvider {
  private session: vscode.AuthenticationSession | undefined;

  async signIn(): Promise<vscode.AuthenticationSession> {
    this.session = await vscode.authentication.getSession(
      MICROSOFT_AUTH_PROVIDER,
      ADO_SCOPES,
      { createIfNone: true }
    );
    return this.session;
  }

  async getToken(): Promise<string> {
    if (!this.session) {
      this.session = await vscode.authentication.getSession(
        MICROSOFT_AUTH_PROVIDER,
        ADO_SCOPES,
        { createIfNone: true }
      );
    }
    return this.session.accessToken;
  }

  async isSignedIn(): Promise<boolean> {
    const session = await vscode.authentication.getSession(
      MICROSOFT_AUTH_PROVIDER,
      ADO_SCOPES,
      { createIfNone: false }
    );
    this.session = session;
    return !!session;
  }

  async getAccountName(): Promise<string | undefined> {
    if (!this.session) {
      await this.getToken();
    }
    return this.session?.account?.label;
  }
}
