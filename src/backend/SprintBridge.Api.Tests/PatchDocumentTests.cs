using SprintBridge.Api.Services;

namespace SprintBridge.Api.Tests;

public class PatchDocumentTests
{
    [Fact]
    public void CreateWorkItemRequest_AllFields_GeneratesCorrectPatchOps()
    {
        var request = new CreateWorkItemRequest(
            Type: "Bug",
            Title: "Test bug",
            Description: "A test description",
            AssignedTo: "GitHub Copilot <66dda6c5-07d0-4484-9979-116241219397@72f988bf-86f1-41af-91ab-2d7cd011db47>",
            State: "New",
            AreaPath: "Project\\Team",
            IterationPath: "Project\\Sprint 1",
            Priority: 1,
            RemainingWork: 5.0,
            CompletedWork: 2.0,
            OriginalEstimate: 8.0
        );

        var patchDoc = PatchDocumentBuilder.Build(request);

        Assert.Contains(patchDoc, p => p.path == "/fields/System.Title" && (string)p.value! == "Test bug");
        Assert.Contains(patchDoc, p => p.path == "/fields/System.Description" && (string)p.value! == "A test description");
        Assert.Contains(patchDoc, p => p.path == "/fields/System.AssignedTo" && ((string)p.value!).Contains("GitHub Copilot"));
        Assert.Contains(patchDoc, p => p.path == "/fields/System.State" && (string)p.value! == "New");
        Assert.Contains(patchDoc, p => p.path == "/fields/System.AreaPath" && (string)p.value! == "Project\\Team");
        Assert.Contains(patchDoc, p => p.path == "/fields/System.IterationPath" && (string)p.value! == "Project\\Sprint 1");
        Assert.Contains(patchDoc, p => p.path == "/fields/Microsoft.VSTS.Common.Priority" && (int)p.value! == 1);
        Assert.Contains(patchDoc, p => p.path == "/fields/Microsoft.VSTS.Scheduling.RemainingWork");
    }

    [Fact]
    public void CreateWorkItemRequest_OnlyRequired_GeneratesMinimalPatchOps()
    {
        var request = new CreateWorkItemRequest(Type: "Task", Title: "Simple task");

        var patchDoc = PatchDocumentBuilder.Build(request);

        Assert.Single(patchDoc);
        Assert.Equal("/fields/System.Title", patchDoc[0].path);
        Assert.Equal("Simple task", patchDoc[0].value);
    }

    [Fact]
    public void UpdateWorkItemRequest_PartialUpdate_GeneratesOnlySpecifiedFields()
    {
        var request = new UpdateWorkItemRequest(State: "Active", Priority: 2);

        var patchDoc = PatchDocumentBuilder.Build(request);

        Assert.Equal(2, patchDoc.Count);
        Assert.Contains(patchDoc, p => p.path == "/fields/System.State" && (string)p.value! == "Active");
        Assert.Contains(patchDoc, p => p.path == "/fields/Microsoft.VSTS.Common.Priority" && (int)p.value! == 2);
    }

    [Fact]
    public void UpdateWorkItemRequest_NoFields_GeneratesEmptyList()
    {
        var request = new UpdateWorkItemRequest();

        var patchDoc = PatchDocumentBuilder.Build(request);

        Assert.Empty(patchDoc);
    }
}
