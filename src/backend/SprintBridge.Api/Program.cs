using SprintBridge.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpClient<IAdoService, AdoService>();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var app = builder.Build();
app.UseCors();

// Health check
app.MapGet("/health", () => Results.Ok(new { status = "healthy", service = "SprintBridge" }));

// Work Items endpoints
app.MapGet("/api/workitems/{organization}/{project}/{id:int}", async (
    string organization, string project, int id,
    HttpRequest request, IAdoService ado) =>
{
    var token = ExtractToken(request);
    if (token is null) return Results.Unauthorized();
    var result = await ado.GetWorkItemAsync(organization, project, id, token);
    return result is not null ? Results.Ok(result) : Results.NotFound();
});

app.MapPost("/api/workitems/{organization}/{project}", async (
    string organization, string project,
    CreateWorkItemRequest body,
    HttpRequest request, IAdoService ado) =>
{
    var token = ExtractToken(request);
    if (token is null) return Results.Unauthorized();
    var result = await ado.CreateWorkItemAsync(organization, project, body, token);
    return Results.Created($"/api/workitems/{organization}/{project}/{result.Id}", result);
});

app.MapPatch("/api/workitems/{organization}/{project}/{id:int}", async (
    string organization, string project, int id,
    UpdateWorkItemRequest body,
    HttpRequest request, IAdoService ado) =>
{
    var token = ExtractToken(request);
    if (token is null) return Results.Unauthorized();
    var result = await ado.UpdateWorkItemAsync(organization, project, id, body, token);
    return result is not null ? Results.Ok(result) : Results.NotFound();
});

app.MapDelete("/api/workitems/{organization}/{project}/{id:int}", async (
    string organization, string project, int id,
    HttpRequest request, IAdoService ado) =>
{
    var token = ExtractToken(request);
    if (token is null) return Results.Unauthorized();
    var success = await ado.DeleteWorkItemAsync(organization, project, id, token);
    return success ? Results.NoContent() : Results.NotFound();
});

app.MapPost("/api/workitems/{organization}/{project}/query", async (
    string organization, string project,
    WorkItemQueryRequest body,
    HttpRequest request, IAdoService ado) =>
{
    var token = ExtractToken(request);
    if (token is null) return Results.Unauthorized();
    var results = await ado.QueryWorkItemsAsync(organization, project, body.Wiql, token);
    return Results.Ok(results);
});

app.Run();

static string? ExtractToken(HttpRequest request)
{
    var auth = request.Headers.Authorization.FirstOrDefault();
    if (auth is null || !auth.StartsWith("Bearer ")) return null;
    return auth["Bearer ".Length..];
}

// Request/Response records
public record CreateWorkItemRequest(string Type, string Title, string? Description = null, string? AssignedTo = null, string? State = null, string? AreaPath = null, string? IterationPath = null, int? Priority = null);
public record UpdateWorkItemRequest(string? Title = null, string? Description = null, string? AssignedTo = null, string? State = null, string? AreaPath = null, string? IterationPath = null, int? Priority = null);
public record WorkItemQueryRequest(string Wiql);
