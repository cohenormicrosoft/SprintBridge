namespace SprintBridge.Api.Models;

public class WorkItemDto
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? AssignedTo { get; set; }
    public string? State { get; set; }
    public string? AreaPath { get; set; }
    public string? IterationPath { get; set; }
    public int? Priority { get; set; }
    public string? Url { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? ChangedDate { get; set; }
    public int? ParentId { get; set; }
    public double? RemainingWork { get; set; }
    public double? CompletedWork { get; set; }
    public double? OriginalEstimate { get; set; }
}
