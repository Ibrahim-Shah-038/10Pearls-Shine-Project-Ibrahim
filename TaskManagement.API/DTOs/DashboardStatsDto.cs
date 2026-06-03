namespace TaskManagement.API.DTOs
{
    public class DashboardStatsDto
    {
        public int PendingCount { get; set; }
        public int InProgressCount { get; set; }
        public int CompletedCount { get; set; }
    }
}
