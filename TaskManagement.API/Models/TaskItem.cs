namespace TaskManagement.API.Models
{
    public class TaskItem
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }

        public string Status { get; set; } // Pending, InProgress, Completed
        public string Priority { get; set; } // Low, Medium, High

        public DateTime DueDate { get; set; }

        // Foreign Key
        public int UserId { get; set; }
        public User User { get; set; }
    }
}
