using System.Text.Json;
using SprintBridge.Api.Models;

namespace SprintBridge.Api.Services;

public static class WorkItemMapper
{
    public static WorkItemDto Map(JsonElement json)
    {
        var fields = json.GetProperty("fields");
        return new WorkItemDto
        {
            Id = json.GetProperty("id").GetInt32(),
            Type = GetString(fields, "System.WorkItemType"),
            Title = GetString(fields, "System.Title"),
            Description = GetStringOrNull(fields, "System.Description"),
            AssignedTo = GetAssignedTo(fields),
            State = GetStringOrNull(fields, "System.State"),
            AreaPath = GetStringOrNull(fields, "System.AreaPath"),
            IterationPath = GetStringOrNull(fields, "System.IterationPath"),
            Priority = GetIntOrNull(fields, "Microsoft.VSTS.Common.Priority"),
            Url = json.TryGetProperty("url", out var url) ? url.GetString() : null,
            CreatedDate = GetDateOrNull(fields, "System.CreatedDate"),
            ChangedDate = GetDateOrNull(fields, "System.ChangedDate"),
            ParentId = GetParentId(json),
            RemainingWork = GetDoubleOrNull(fields, "Microsoft.VSTS.Scheduling.RemainingWork"),
            CompletedWork = GetDoubleOrNull(fields, "Microsoft.VSTS.Scheduling.CompletedWork"),
            OriginalEstimate = GetDoubleOrNull(fields, "Microsoft.VSTS.Scheduling.OriginalEstimate"),
        };
    }

    public static string GetString(JsonElement fields, string fieldName) =>
        fields.TryGetProperty(fieldName, out var val) ? val.GetString() ?? string.Empty : string.Empty;

    public static string? GetStringOrNull(JsonElement fields, string fieldName) =>
        fields.TryGetProperty(fieldName, out var val) ? val.GetString() : null;

    public static int? GetIntOrNull(JsonElement fields, string fieldName) =>
        fields.TryGetProperty(fieldName, out var val) && val.ValueKind == JsonValueKind.Number ? val.GetInt32() : null;

    public static double? GetDoubleOrNull(JsonElement fields, string fieldName) =>
        fields.TryGetProperty(fieldName, out var val) && val.ValueKind == JsonValueKind.Number ? val.GetDouble() : null;

    public static DateTime? GetDateOrNull(JsonElement fields, string fieldName) =>
        fields.TryGetProperty(fieldName, out var val) && val.ValueKind == JsonValueKind.String
            ? DateTime.TryParse(val.GetString(), out var dt) ? dt : null
            : null;

    public static string? GetAssignedTo(JsonElement fields)
    {
        if (!fields.TryGetProperty("System.AssignedTo", out var assigned)) return null;
        if (assigned.ValueKind == JsonValueKind.Object && assigned.TryGetProperty("displayName", out var name))
            return name.GetString();
        if (assigned.ValueKind == JsonValueKind.String)
            return assigned.GetString();
        return null;
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
}
