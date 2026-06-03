using System;
using System.ComponentModel.DataAnnotations;

namespace TaskManagement.API.DTOs
{
    public class TaskUpdateDto
    {
        [Required]
        [StringLength(100)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        [Required]
        public string Status { get; set; } = "Pending"; // Pending, InProgress, Completed

        [Required]
        public string Priority { get; set; } = "Medium"; // Low, Medium, High

        [Required]
        public DateTime DueDate { get; set; }

        public int UserId { get; set; } // The assigned user ID
    }
}
