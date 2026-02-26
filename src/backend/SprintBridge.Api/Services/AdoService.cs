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
        return WorkItemMapper.Map(json);
    }

    public async Task<WorkItemDto> CreateWorkItemAsync(string organization, string project, CreateWorkItemRequest request, string token)
    {
        SetAuth(token);
        var patchDoc = PatchDocumentBuilder.Build(request);

        var url = $"{organization}/{project}/_apis/wit/workitems/${request.Type}?api-version={AdoApiVersion}";
        var content = new StringContent(
            JsonSerializer.Serialize(patchDoc, JsonOptions),
            System.Text.Encoding.UTF8,
            "application/json-patch+json");

        var response = await _httpClient.PostAsync(url, content);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        return WorkItemMapper.Map(json);
    }

    public async Task<WorkItemDto?> UpdateWorkItemAsync(string organization, string project, int id, UpdateWorkItemRequest request, string token)
    {
        SetAuth(token);
        var patchDoc = PatchDocumentBuilder.Build(request);

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
        return WorkItemMapper.Map(json);
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
                        workItems.Add(WorkItemMapper.Map(item));
                    }
                }
            }
        }

        return workItems;
    }
}

public record AdoPatchOperation(string op, string path, object? value);
