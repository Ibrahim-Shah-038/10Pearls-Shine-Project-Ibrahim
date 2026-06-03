using System;

namespace TaskManagement.API.DTOs
{
    public class TaskResponseDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public DateTime DueDate { get; set; }
        public int UserId { get; set; }
        public string AssigneeUsername { get; set; } = string.Empty;
    }
}
