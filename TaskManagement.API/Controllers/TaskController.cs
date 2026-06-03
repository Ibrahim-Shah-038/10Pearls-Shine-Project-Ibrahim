using System;
using System.Collections.Generic;
using System.IO;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using TaskManagement.API.DTOs;
using TaskManagement.API.Hubs;
using TaskManagement.API.Services;

namespace TaskManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TaskController : ControllerBase
    {
        private readonly ITaskService _taskService;
        private readonly IHubContext<TaskHub> _hubContext;
        private readonly ILogger<TaskController> _logger;

        public TaskController(ITaskService taskService, IHubContext<TaskHub> hubContext, ILogger<TaskController> logger)
        {
            _taskService = taskService;
            _hubContext = hubContext;
            _logger = logger;
        }

        private (int id, string role) GetUserContext()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;

            if (string.IsNullOrEmpty(idClaim) || !int.TryParse(idClaim, out int userId))
            {
                throw new UnauthorizedAccessException("User context is missing or invalid in token.");
            }

            return (userId, roleClaim ?? "User");
        }

        [HttpGet]
        public async Task<IActionResult> GetTasks([FromQuery] string? search, [FromQuery] string? status, [FromQuery] string? priority)
        {
            var (userId, role) = GetUserContext();
            _logger.LogInformation("Getting tasks for User ID: {UserId}, Role: {Role}. Filter - Search: {Search}, Status: {Status}, Priority: {Priority}", userId, role, search, status, priority);

            var tasks = await _taskService.GetTasksAsync(userId, role, search, status, priority);
            return Ok(tasks);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetTask(int id)
        {
            var (userId, role) = GetUserContext();
            _logger.LogInformation("Getting task ID: {TaskId} for User ID: {UserId}", id, userId);

            var task = await _taskService.GetTaskByIdAsync(id, userId, role);
            if (task == null)
            {
                _logger.LogWarning("Task ID: {TaskId} not found or unauthorized for User ID: {UserId}", id, userId);
                return NotFound(new { message = "Task not found." });
            }

            return Ok(task);
        }

        [HttpPost]
        public async Task<IActionResult> CreateTask(TaskCreateDto dto)
        {
            var (userId, role) = GetUserContext();
            _logger.LogInformation("Creating new task. Title: {Title}, User ID: {UserId}", dto.Title, userId);

            // If regular user, enforce assigning task to themselves
            if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase) && 
                !string.Equals(role, "SuperUser", StringComparison.OrdinalIgnoreCase))
            {
                dto.UserId = userId;
            }

            var createdTask = await _taskService.CreateTaskAsync(dto, userId);

            // Broadcast real-time update
            try
            {
                await _hubContext.Clients.All.SendAsync("TaskCreated", createdTask);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting SignalR TaskCreated notification.");
            }

            return CreatedAtAction(nameof(GetTask), new { id = createdTask.Id }, createdTask);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTask(int id, TaskUpdateDto dto)
        {
            var (userId, role) = GetUserContext();
            _logger.LogInformation("Updating task ID: {TaskId} for User ID: {UserId}", id, userId);

            var updatedTask = await _taskService.UpdateTaskAsync(id, dto, userId, role);
            if (updatedTask == null)
            {
                _logger.LogWarning("Task ID: {TaskId} not found or update unauthorized for User ID: {UserId}", id, userId);
                return NotFound(new { message = "Task not found or edit unauthorized." });
            }

            // Broadcast real-time update
            try
            {
                await _hubContext.Clients.All.SendAsync("TaskUpdated", updatedTask);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting SignalR TaskUpdated notification.");
            }

            return Ok(updatedTask);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTask(int id)
        {
            var (userId, role) = GetUserContext();
            _logger.LogInformation("Deleting task ID: {TaskId} for User ID: {UserId}", id, userId);

            var success = await _taskService.DeleteTaskAsync(id, userId, role);
            if (!success)
            {
                _logger.LogWarning("Task ID: {TaskId} not found or delete unauthorized for User ID: {UserId}", id, userId);
                return NotFound(new { message = "Task not found or delete unauthorized." });
            }

            // Broadcast real-time deletion
            try
            {
                await _hubContext.Clients.All.SendAsync("TaskDeleted", id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting SignalR TaskDeleted notification.");
            }

            return Ok(new { message = "Task deleted successfully." });
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var (userId, role) = GetUserContext();
            _logger.LogInformation("Getting dashboard stats for User ID: {UserId}, Role: {Role}", userId, role);

            var stats = await _taskService.GetDashboardStatsAsync(userId, role);
            return Ok(stats);
        }

        [HttpGet("export")]
        public async Task<IActionResult> ExportTasks()
        {
            var (userId, role) = GetUserContext();
            _logger.LogInformation("Exporting tasks for User ID: {UserId}", userId);

            // Fetch tasks without query filters
            var tasks = await _taskService.GetTasksAsync(userId, role, null, null, null);

            var csv = new StringBuilder();
            csv.AppendLine("Id,Title,Description,Status,Priority,DueDate,Assignee");

            foreach (var task in tasks)
            {
                // Escape commas/quotes in Title and Description
                var title = EscapeCsv(task.Title);
                var desc = EscapeCsv(task.Description);
                csv.AppendLine($"{task.Id},{title},{desc},{task.Status},{task.Priority},{task.DueDate:yyyy-MM-dd},{task.AssigneeUsername}");
            }

            var bytes = Encoding.UTF8.GetBytes(csv.ToString());
            return File(bytes, "text/csv", "tasks_export.csv");
        }

        [HttpPost("import")]
        public async Task<IActionResult> ImportTasks(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "No file uploaded or file is empty." });
            }

            var (userId, role) = GetUserContext();
            _logger.LogInformation("Importing tasks from CSV. User ID: {UserId}", userId);

            var tasksToCreate = new List<TaskCreateDto>();

            try
            {
                using var reader = new StreamReader(file.OpenReadStream());
                var headerLine = await reader.ReadLineAsync(); // skip header

                string? line;
                int rowNumber = 1;
                while ((line = await reader.ReadLineAsync()) != null)
                {
                    rowNumber++;
                    var columns = ParseCsvLine(line);
                    if (columns.Count < 5)
                    {
                        _logger.LogWarning("CSV Import row {Row}: Insufficient columns. Skipping.", rowNumber);
                        continue;
                    }

                    // Map fields
                    var title = columns[0];
                    var desc = columns[1];
                    var status = columns[2];
                    var priority = columns[3];
                    var dueDateStr = columns[4];

                    if (string.IsNullOrWhiteSpace(title))
                    {
                        _logger.LogWarning("CSV Import row {Row}: Title is empty. Skipping.", rowNumber);
                        continue;
                    }

                    // Parse Date
                    if (!DateTime.TryParse(dueDateStr, out DateTime dueDate))
                    {
                        dueDate = DateTime.Now.AddDays(7); // Default fallback
                    }

                    // Normalize Status
                    status = NormalizeValue(status, new[] { "Pending", "InProgress", "Completed" }, "Pending");
                    // Normalize Priority
                    priority = NormalizeValue(priority, new[] { "Low", "Medium", "High" }, "Medium");

                    var dto = new TaskCreateDto
                    {
                        Title = title,
                        Description = desc,
                        Status = status,
                        Priority = priority,
                        DueDate = dueDate,
                        UserId = userId // Default assignee is the current user
                    };

                    tasksToCreate.Add(dto);
                }

                int successCount = 0;
                foreach (var dto in tasksToCreate)
                {
                    var createdTask = await _taskService.CreateTaskAsync(dto, userId);
                    successCount++;
                    // Broadcast
                    try
                    {
                        await _hubContext.Clients.All.SendAsync("TaskCreated", createdTask);
                    }
                    catch { /* Suppress broadcast errors in loop */ }
                }

                _logger.LogInformation("CSV Import completed. Successfully imported {Count} tasks.", successCount);
                return Ok(new { message = $"Successfully imported {successCount} tasks." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error importing tasks from CSV.");
                return BadRequest(new { message = "Failed to parse CSV file.", details = ex.Message });
            }
        }

        private static string EscapeCsv(string value)
        {
            if (string.IsNullOrEmpty(value)) return string.Empty;
            if (value.Contains(",") || value.Contains("\"") || value.Contains("\n") || value.Contains("\r"))
            {
                return "\"" + value.Replace("\"", "\"\"") + "\"";
            }
            return value;
        }

        private static List<string> ParseCsvLine(string line)
        {
            var list = new List<string>();
            var item = new StringBuilder();
            bool inQuotes = false;

            for (int i = 0; i < line.Length; i++)
            {
                char c = line[i];
                if (c == '"')
                {
                    if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                    {
                        item.Append('"'); // Escaped quote
                        i++;
                    }
                    else
                    {
                        inQuotes = !inQuotes; // Toggle quote state
                    }
                }
                else if (c == ',' && !inQuotes)
                {
                    list.Add(item.ToString());
                    item.Clear();
                }
                else
                {
                    item.Append(c);
                }
            }
            list.Add(item.ToString());
            return list;
        }

        private static string NormalizeValue(string input, string[] validValues, string defaultValue)
        {
            if (string.IsNullOrWhiteSpace(input)) return defaultValue;
            foreach (var val in validValues)
            {
                if (val.Equals(input.Trim(), StringComparison.OrdinalIgnoreCase))
                {
                    return val;
                }
            }
            return defaultValue;
        }
    }
}