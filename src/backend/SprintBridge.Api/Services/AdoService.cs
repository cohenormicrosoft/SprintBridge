using System.Text.Json;
using System.Text.Json.Serialization;
using SprintBridge.Api.Models;

namespace SprintBridge.Api.Services;

public interface IAdoService
{
    Task<WorkItemDto?> GetWorkItemAsync(string organization, string project, int id, string token);
    Task<WorkItemDto> CreateWorkItemAsync(string organization, string project, CreateWorkItemRequest request, string token);
    Task<WorkItemDto?> UpdateWorkItemAsync(string organization, string project, int id, UpdateWorkItemRequest request, string token);
    Task<bool> DeleteWorkItemAsync(string organization, string project, int id, string token);
    Task<List<WorkItemDto>> QueryWorkItemsAsync(string organization, string project, string wiql, string token);
}

public class AdoService : IAdoService
{
    private readonly HttpClient _httpClient;
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    private const string AdoApiVersion = "7.1";

    public AdoService(HttpClient httpClient)
    {
        _httpClient = httpClient;
        _httpClient.BaseAddress = new Uri("https://dev.azure.com/");
    }

    private void SetAuth(string token)
    {
        _httpClient.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
    }

    public async Task<WorkItemDto?> GetWorkItemAsync(string organization, string project, int id, string token)
    {
        SetAuth(token);
        var url = $"{organization}/{project}/_apis/wit/workitems/{id}?$expand=all&api-version={AdoApiVersion}";
        var response = await _httpClient.GetAsync(url);
        if (!response.IsSuccessStatusCode) return null;

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        return MapWorkItem(json);
    }

    public async Task<WorkItemDto> CreateWorkItemAsync(string organization, string project, CreateWorkItemRequest request, string token)
    {
        SetAuth(token);
        var patchDoc = new List<AdoPatchOperation>();

        patchDoc.Add(new("add", "/fields/System.Title", request.Title));
        if (request.Description is not null)
            patchDoc.Add(new("add", "/fields/System.Description", request.Description));
        if (request.AssignedTo is not null)
            patchDoc.Add(new("add", "/fields/System.AssignedTo", request.AssignedTo));
        if (request.State is not null)
            patchDoc.Add(new("add", "/fields/System.State", request.State));
        if (request.AreaPath is not null)
            patchDoc.Add(new("add", "/fields/System.AreaPath", request.AreaPath));
        if (request.IterationPath is not null)
            patchDoc.Add(new("add", "/fields/System.IterationPath", request.IterationPath));
        if (request.Priority is not null)
            patchDoc.Add(new("add", "/fields/Microsoft.VSTS.Common.Priority", request.Priority));
        if (request.RemainingWork is not null)
            patchDoc.Add(new("add", "/fields/Microsoft.VSTS.Scheduling.RemainingWork", request.RemainingWork));
        if (request.CompletedWork is not null)
            patchDoc.Add(new("add", "/fields/Microsoft.VSTS.Scheduling.CompletedWork", request.CompletedWork));
        if (request.OriginalEstimate is not null)
            patchDoc.Add(new("add", "/fields/Microsoft.VSTS.Scheduling.OriginalEstimate", request.OriginalEstimate));

        var url = $"{organization}/{project}/_apis/wit/workitems/${request.Type}?api-version={AdoApiVersion}";
        var content = new StringContent(
            JsonSerializer.Serialize(patchDoc, JsonOptions),
            System.Text.Encoding.UTF8,
            "application/json-patch+json");

        var response = await _httpClient.PostAsync(url, content);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        return MapWorkItem(json);
    }

    public async Task<WorkItemDto?> UpdateWorkItemAsync(string organization, string project, int id, UpdateWorkItemRequest request, string token)
    {
        SetAuth(token);
        var patchDoc = new List<AdoPatchOperation>();

        if (request.Title is not null)
            patchDoc.Add(new("add", "/fields/System.Title", request.Title));
        if (request.Description is not null)
            patchDoc.Add(new("add", "/fields/System.Description", request.Description));
        if (request.AssignedTo is not null)
            patchDoc.Add(new("add", "/fields/System.AssignedTo", request.AssignedTo));
        if (request.State is not null)
            patchDoc.Add(new("add", "/fields/System.State", request.State));
        if (request.AreaPath is not null)
            patchDoc.Add(new("add", "/fields/System.AreaPath", request.AreaPath));
        if (request.IterationPath is not null)
            patchDoc.Add(new("add", "/fields/System.IterationPath", request.IterationPath));
        if (request.Priority is not null)
            patchDoc.Add(new("add", "/fields/Microsoft.VSTS.Common.Priority", request.Priority));
        if (request.RemainingWork is not null)
            patchDoc.Add(new("add", "/fields/Microsoft.VSTS.Scheduling.RemainingWork", request.RemainingWork));
        if (request.CompletedWork is not null)
            patchDoc.Add(new("add", "/fields/Microsoft.VSTS.Scheduling.CompletedWork", request.CompletedWork));
        if (request.OriginalEstimate is not null)
            patchDoc.Add(new("add", "/fields/Microsoft.VSTS.Scheduling.OriginalEstimate", request.OriginalEstimate));

        if (patchDoc.Count == 0) return await GetWorkItemAsync(organization, project, id, token);

        var url = $"{organization}/{project}/_apis/wit/workitems/{id}?api-version={AdoApiVersion}";
        var content = new StringContent(
            JsonSerializer.Serialize(patchDoc, JsonOptions),
            System.Text.Encoding.UTF8,
            "application/json-patch+json");

        var httpRequest = new HttpRequestMessage(HttpMethod.Patch, url) { Content = content };
        var response = await _httpClient.SendAsync(httpRequest);
        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync();
            throw new HttpRequestException($"ADO PATCH {response.StatusCode}: {errorBody}", null, response.StatusCode);
        }

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        return MapWorkItem(json);
    }

    public async Task<bool> DeleteWorkItemAsync(string organization, string project, int id, string token)
    {
        SetAuth(token);
        var url = $"{organization}/{project}/_apis/wit/workitems/{id}?api-version={AdoApiVersion}";
        var response = await _httpClient.DeleteAsync(url);
        return response.IsSuccessStatusCode;
    }

    public async Task<List<WorkItemDto>> QueryWorkItemsAsync(string organization, string project, string wiql, string token)
    {
        SetAuth(token);
        var url = $"{organization}/{project}/_apis/wit/wiql?api-version={AdoApiVersion}";
        var body = new { query = wiql };
        var response = await _httpClient.PostAsJsonAsync(url, body);
        response.EnsureSuccessStatusCode();

        var queryResult = await response.Content.ReadFromJsonAsync<JsonElement>();
        var workItems = new List<WorkItemDto>();

        if (queryResult.TryGetProperty("workItems", out var items))
        {
            var ids = items.EnumerateArray()
                .Select(wi => wi.GetProperty("id").GetInt32())
                .Take(50) // Limit to 50 results
                .ToList();

            if (ids.Count > 0)
            {
                var idsParam = string.Join(",", ids);
                var detailsUrl = $"{organization}/{project}/_apis/wit/workitems?ids={idsParam}&$expand=all&api-version={AdoApiVersion}";
                var detailsResponse = await _httpClient.GetAsync(detailsUrl);
                detailsResponse.EnsureSuccessStatusCode();

                var detailsJson = await detailsResponse.Content.ReadFromJsonAsync<JsonElement>();
                if (detailsJson.TryGetProperty("value", out var values))
                {
                    foreach (var item in values.EnumerateArray())
                    {
                        workItems.Add(MapWorkItem(item));
                    }
                }
            }
        }

        return workItems;
    }

    private static WorkItemDto MapWorkItem(JsonElement json)
    {
        var fields = json.GetProperty("fields");
        return new WorkItemDto
        {
            Id = json.GetProperty("id").GetInt32(),
            Type = GetFieldString(fields, "System.WorkItemType"),
            Title = GetFieldString(fields, "System.Title"),
            Description = GetFieldStringOrNull(fields, "System.Description"),
            AssignedTo = GetAssignedTo(fields),
            State = GetFieldStringOrNull(fields, "System.State"),
            AreaPath = GetFieldStringOrNull(fields, "System.AreaPath"),
            IterationPath = GetFieldStringOrNull(fields, "System.IterationPath"),
            Priority = GetFieldIntOrNull(fields, "Microsoft.VSTS.Common.Priority"),
            Url = json.TryGetProperty("url", out var url) ? url.GetString() : null,
            CreatedDate = GetFieldDateOrNull(fields, "System.CreatedDate"),
            ChangedDate = GetFieldDateOrNull(fields, "System.ChangedDate"),
            ParentId = GetParentId(json),
            RemainingWork = GetFieldDoubleOrNull(fields, "Microsoft.VSTS.Scheduling.RemainingWork"),
            CompletedWork = GetFieldDoubleOrNull(fields, "Microsoft.VSTS.Scheduling.CompletedWork"),
            OriginalEstimate = GetFieldDoubleOrNull(fields, "Microsoft.VSTS.Scheduling.OriginalEstimate"),
        };
    }

    private static int? GetParentId(JsonElement json)
    {
        if (!json.TryGetProperty("relations", out var relations) || relations.ValueKind != JsonValueKind.Array)
            return null;

        foreach (var rel in relations.EnumerateArray())
        {
            if (rel.TryGetProperty("rel", out var relType) && relType.GetString() == "System.LinkTypes.Hierarchy-Reverse"
                && rel.TryGetProperty("url", out var relUrl))
            {
                var urlStr = relUrl.GetString();
                if (urlStr is not null)
                {
                    var lastSlash = urlStr.LastIndexOf('/');
                    if (lastSlash >= 0 && int.TryParse(urlStr[(lastSlash + 1)..], out var parentId))
                        return parentId;
                }
            }
        }
        return null;
    }

    private static string GetFieldString(JsonElement fields, string fieldName) =>
        fields.TryGetProperty(fieldName, out var val) ? val.GetString() ?? string.Empty : string.Empty;

    private static string? GetFieldStringOrNull(JsonElement fields, string fieldName) =>
        fields.TryGetProperty(fieldName, out var val) ? val.GetString() : null;

    private static int? GetFieldIntOrNull(JsonElement fields, string fieldName) =>
        fields.TryGetProperty(fieldName, out var val) && val.ValueKind == JsonValueKind.Number ? val.GetInt32() : null;

    private static double? GetFieldDoubleOrNull(JsonElement fields, string fieldName) =>
        fields.TryGetProperty(fieldName, out var val) && val.ValueKind == JsonValueKind.Number ? val.GetDouble() : null;

    private static DateTime? GetFieldDateOrNull(JsonElement fields, string fieldName) =>
        fields.TryGetProperty(fieldName, out var val) && val.ValueKind == JsonValueKind.String
            ? DateTime.TryParse(val.GetString(), out var dt) ? dt : null
            : null;

    private static string? GetAssignedTo(JsonElement fields)
    {
        if (!fields.TryGetProperty("System.AssignedTo", out var assigned)) return null;
        if (assigned.ValueKind == JsonValueKind.Object && assigned.TryGetProperty("displayName", out var name))
            return name.GetString();
        if (assigned.ValueKind == JsonValueKind.String)
            return assigned.GetString();
        return null;
    }
}

internal record AdoPatchOperation(string op, string path, object? value);
