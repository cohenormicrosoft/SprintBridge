namespace SprintBridge.Api.Services;

public static class PatchDocumentBuilder
{
    public static List<AdoPatchOperation> Build(CreateWorkItemRequest request)
    {
        var ops = new List<AdoPatchOperation>();
        ops.Add(new("add", "/fields/System.Title", request.Title));
        AddIfNotNull(ops, "add", "/fields/System.Description", request.Description);
        AddIfNotNull(ops, "add", "/fields/System.AssignedTo", request.AssignedTo);
        AddIfNotNull(ops, "add", "/fields/System.State", request.State);
        AddIfNotNull(ops, "add", "/fields/System.AreaPath", request.AreaPath);
        AddIfNotNull(ops, "add", "/fields/System.IterationPath", request.IterationPath);
        AddIfNotNull(ops, "add", "/fields/Microsoft.VSTS.Common.Priority", request.Priority);
        AddIfNotNull(ops, "add", "/fields/Microsoft.VSTS.Scheduling.RemainingWork", request.RemainingWork);
        AddIfNotNull(ops, "add", "/fields/Microsoft.VSTS.Scheduling.CompletedWork", request.CompletedWork);
        AddIfNotNull(ops, "add", "/fields/Microsoft.VSTS.Scheduling.OriginalEstimate", request.OriginalEstimate);
        return ops;
    }

    public static List<AdoPatchOperation> Build(UpdateWorkItemRequest request)
    {
        var ops = new List<AdoPatchOperation>();
        AddIfNotNull(ops, "add", "/fields/System.Title", request.Title);
        AddIfNotNull(ops, "add", "/fields/System.Description", request.Description);
        AddIfNotNull(ops, "add", "/fields/System.AssignedTo", request.AssignedTo);
        AddIfNotNull(ops, "add", "/fields/System.State", request.State);
        AddIfNotNull(ops, "add", "/fields/System.AreaPath", request.AreaPath);
        AddIfNotNull(ops, "add", "/fields/System.IterationPath", request.IterationPath);
        AddIfNotNull(ops, "add", "/fields/Microsoft.VSTS.Common.Priority", request.Priority);
        AddIfNotNull(ops, "add", "/fields/Microsoft.VSTS.Scheduling.RemainingWork", request.RemainingWork);
        AddIfNotNull(ops, "add", "/fields/Microsoft.VSTS.Scheduling.CompletedWork", request.CompletedWork);
        AddIfNotNull(ops, "add", "/fields/Microsoft.VSTS.Scheduling.OriginalEstimate", request.OriginalEstimate);
        return ops;
    }

    private static void AddIfNotNull(List<AdoPatchOperation> ops, string op, string path, object? value)
    {
        if (value is not null)
            ops.Add(new(op, path, value));
    }
}
