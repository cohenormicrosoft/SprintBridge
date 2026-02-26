using System.Text.Json;
using SprintBridge.Api.Services;

namespace SprintBridge.Api.Tests;

public class WorkItemMapperTests
{
    [Fact]
    public void Map_BasicWorkItem_ReturnsCorrectDto()
    {
        var json = JsonDocument.Parse("""
        {
            "id": 42,
            "url": "https://dev.azure.com/org/proj/_apis/wit/workitems/42",
            "fields": {
                "System.WorkItemType": "Bug",
                "System.Title": "Login crash",
                "System.Description": "App crashes on login",
                "System.State": "Active",
                "System.AreaPath": "MyProject\\Team",
                "System.IterationPath": "MyProject\\Sprint 5",
                "Microsoft.VSTS.Common.Priority": 2,
                "System.CreatedDate": "2025-01-15T10:30:00Z",
                "System.ChangedDate": "2025-01-16T14:00:00Z",
                "Microsoft.VSTS.Scheduling.RemainingWork": 4.5,
                "Microsoft.VSTS.Scheduling.CompletedWork": 2.0,
                "Microsoft.VSTS.Scheduling.OriginalEstimate": 8.0
            }
        }
        """).RootElement;

        var dto = WorkItemMapper.Map(json);

        Assert.Equal(42, dto.Id);
        Assert.Equal("Bug", dto.Type);
        Assert.Equal("Login crash", dto.Title);
        Assert.Equal("App crashes on login", dto.Description);
        Assert.Equal("Active", dto.State);
        Assert.Equal("MyProject\\Team", dto.AreaPath);
        Assert.Equal("MyProject\\Sprint 5", dto.IterationPath);
        Assert.Equal(2, dto.Priority);
        Assert.Equal(4.5, dto.RemainingWork);
        Assert.Equal(2.0, dto.CompletedWork);
        Assert.Equal(8.0, dto.OriginalEstimate);
        Assert.NotNull(dto.CreatedDate);
        Assert.NotNull(dto.ChangedDate);
        Assert.Null(dto.AssignedTo);
        Assert.Null(dto.ParentId);
    }

    [Fact]
    public void Map_AssignedToObject_ExtractsDisplayName()
    {
        var json = JsonDocument.Parse("""
        {
            "id": 1,
            "fields": {
                "System.WorkItemType": "Task",
                "System.Title": "Test",
                "System.AssignedTo": {
                    "displayName": "John Doe",
                    "uniqueName": "john@example.com"
                }
            }
        }
        """).RootElement;

        var dto = WorkItemMapper.Map(json);

        Assert.Equal("John Doe", dto.AssignedTo);
    }

    [Fact]
    public void Map_AssignedToString_ReturnsString()
    {
        var json = JsonDocument.Parse("""
        {
            "id": 1,
            "fields": {
                "System.WorkItemType": "Task",
                "System.Title": "Test",
                "System.AssignedTo": "GitHub Copilot <66dda6c5-07d0-4484-9979-116241219397@72f988bf-86f1-41af-91ab-2d7cd011db47>"
            }
        }
        """).RootElement;

        var dto = WorkItemMapper.Map(json);

        Assert.Contains("GitHub Copilot", dto.AssignedTo);
    }

    [Fact]
    public void Map_WithParentRelation_ExtractsParentId()
    {
        var json = JsonDocument.Parse("""
        {
            "id": 10,
            "fields": {
                "System.WorkItemType": "Task",
                "System.Title": "Child task"
            },
            "relations": [
                {
                    "rel": "System.LinkTypes.Hierarchy-Reverse",
                    "url": "https://dev.azure.com/org/proj/_apis/wit/workitems/5"
                },
                {
                    "rel": "System.LinkTypes.Hierarchy-Forward",
                    "url": "https://dev.azure.com/org/proj/_apis/wit/workitems/20"
                }
            ]
        }
        """).RootElement;

        var dto = WorkItemMapper.Map(json);

        Assert.Equal(5, dto.ParentId);
    }

    [Fact]
    public void Map_NoRelations_ParentIdIsNull()
    {
        var json = JsonDocument.Parse("""
        {
            "id": 10,
            "fields": {
                "System.WorkItemType": "Task",
                "System.Title": "Standalone task"
            }
        }
        """).RootElement;

        var dto = WorkItemMapper.Map(json);

        Assert.Null(dto.ParentId);
    }

    [Fact]
    public void Map_MissingOptionalFields_ReturnsNulls()
    {
        var json = JsonDocument.Parse("""
        {
            "id": 99,
            "fields": {
                "System.WorkItemType": "Epic",
                "System.Title": "Minimal item"
            }
        }
        """).RootElement;

        var dto = WorkItemMapper.Map(json);

        Assert.Equal(99, dto.Id);
        Assert.Equal("Epic", dto.Type);
        Assert.Equal("Minimal item", dto.Title);
        Assert.Null(dto.Description);
        Assert.Null(dto.AssignedTo);
        Assert.Null(dto.State);
        Assert.Null(dto.AreaPath);
        Assert.Null(dto.IterationPath);
        Assert.Null(dto.Priority);
        Assert.Null(dto.RemainingWork);
        Assert.Null(dto.CompletedWork);
        Assert.Null(dto.OriginalEstimate);
        Assert.Null(dto.CreatedDate);
        Assert.Null(dto.ChangedDate);
    }

    [Fact]
    public void GetAssignedTo_MissingField_ReturnsNull()
    {
        var json = JsonDocument.Parse("""{ "System.Title": "Test" }""").RootElement;

        var result = WorkItemMapper.GetAssignedTo(json);

        Assert.Null(result);
    }

    [Fact]
    public void GetIntOrNull_ValidNumber_ReturnsInt()
    {
        var json = JsonDocument.Parse("""{ "Priority": 3 }""").RootElement;

        Assert.Equal(3, WorkItemMapper.GetIntOrNull(json, "Priority"));
    }

    [Fact]
    public void GetIntOrNull_MissingField_ReturnsNull()
    {
        var json = JsonDocument.Parse("""{ "Other": 3 }""").RootElement;

        Assert.Null(WorkItemMapper.GetIntOrNull(json, "Priority"));
    }

    [Fact]
    public void GetDoubleOrNull_ValidNumber_ReturnsDouble()
    {
        var json = JsonDocument.Parse("""{ "Hours": 4.5 }""").RootElement;

        Assert.Equal(4.5, WorkItemMapper.GetDoubleOrNull(json, "Hours"));
    }

    [Fact]
    public void GetDateOrNull_ValidDate_ReturnsDateTime()
    {
        var json = JsonDocument.Parse("""{ "Created": "2025-06-15T10:00:00Z" }""").RootElement;

        var result = WorkItemMapper.GetDateOrNull(json, "Created");

        Assert.NotNull(result);
        Assert.Equal(2025, result!.Value.Year);
    }

    [Fact]
    public void GetDateOrNull_InvalidDate_ReturnsNull()
    {
        var json = JsonDocument.Parse("""{ "Created": "not-a-date" }""").RootElement;

        Assert.Null(WorkItemMapper.GetDateOrNull(json, "Created"));
    }
}
