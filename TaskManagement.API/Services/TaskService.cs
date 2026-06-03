using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Data;
using TaskManagement.API.DTOs;
using TaskManagement.API.Models;

namespace TaskManagement.API.Services
{
    public class TaskService : ITaskService
    {
        private readonly ApplicationDbContext _context;

        public TaskService(ApplicationDbContext context)
        {
            _context = context;
        }

        private bool IsAdminOrSuperUser(string role)
        {
            return string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase) ||
                   string.Equals(role, "SuperUser", StringComparison.OrdinalIgnoreCase);
        }

        public async Task<IEnumerable<TaskResponseDto>> GetTasksAsync(int userId, string role, string? search, string? status, string? priority)
        {
            var query = _context.Tasks
                .Include(t => t.User)
                .AsQueryable();

            // Role-based filter: Users only see their own tasks
            if (!IsAdminOrSuperUser(role))
            {
                query = query.Where(t => t.UserId == userId);
            }

            // Search filter
            if (!string.IsNullOrWhiteSpace(search))
            {
                var cleanSearch = search.Trim().ToLower();
                query = query.Where(t => t.Title.ToLower().Contains(cleanSearch) || 
                                         t.Description.ToLower().Contains(cleanSearch));
            }

            // Status filter
            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(t => t.Status == status);
            }

            // Priority filter
            if (!string.IsNullOrWhiteSpace(priority))
            {
                query = query.Where(t => t.Priority == priority);
            }

            return await query
                .OrderBy(t => t.DueDate)
                .Select(t => new TaskResponseDto
                {
                    Id = t.Id,
                    Title = t.Title,
                    Description = t.Description,
                    Status = t.Status,
                    Priority = t.Priority,
                    DueDate = t.DueDate,
                    UserId = t.UserId,
                    AssigneeUsername = t.User != null ? t.User.Username : "Unassigned"
                })
                .ToListAsync();
        }

        public async Task<TaskResponseDto?> GetTaskByIdAsync(int id, int userId, string role)
        {
            var task = await _context.Tasks
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (task == null) return null;

            // Authorization check
            if (!IsAdminOrSuperUser(role) && task.UserId != userId)
            {
                return null;
            }

            return new TaskResponseDto
            {
                Id = task.Id,
                Title = task.Title,
                Description = task.Description,
                Status = task.Status,
                Priority = task.Priority,
                DueDate = task.DueDate,
                UserId = task.UserId,
                AssigneeUsername = task.User != null ? task.User.Username : "Unassigned"
            };
        }

        public async Task<TaskResponseDto> CreateTaskAsync(TaskCreateDto dto, int currentUserId)
        {
            // Determine who the task is assigned to
            int assignedUserId = dto.UserId ?? currentUserId;

            // Verify user exists, else default to currentUserId
            var userExists = await _context.Users.AnyAsync(u => u.Id == assignedUserId);
            if (!userExists)
            {
                assignedUserId = currentUserId;
            }

            var task = new TaskItem
            {
                Title = dto.Title,
                Description = dto.Description,
                Status = dto.Status,
                Priority = dto.Priority,
                DueDate = dto.DueDate,
                UserId = assignedUserId
            };

            _context.Tasks.Add(task);
            await _context.SaveChangesAsync();

            // Load user name for response
            var user = await _context.Users.FindAsync(assignedUserId);

            return new TaskResponseDto
            {
                Id = task.Id,
                Title = task.Title,
                Description = task.Description,
                Status = task.Status,
                Priority = task.Priority,
                DueDate = task.DueDate,
                UserId = task.UserId,
                AssigneeUsername = user != null ? user.Username : "Unassigned"
            };
        }

        public async Task<TaskResponseDto?> UpdateTaskAsync(int id, TaskUpdateDto dto, int currentUserId, string role)
        {
            var task = await _context.Tasks
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (task == null) return null;

            // Authorization check
            if (!IsAdminOrSuperUser(role) && task.UserId != currentUserId)
            {
                return null;
            }

            // If normal user, they can't re-assign task to someone else (unless they are admin)
            int assignedUserId = dto.UserId;
            if (!IsAdminOrSuperUser(role))
            {
                assignedUserId = task.UserId; // Keep original assignee
            }
            else
            {
                // Admin is editing: verify new assignee exists
                var userExists = await _context.Users.AnyAsync(u => u.Id == assignedUserId);
                if (!userExists)
                {
                    assignedUserId = task.UserId;
                }
            }

            task.Title = dto.Title;
            task.Description = dto.Description;
            task.Status = dto.Status;
            task.Priority = dto.Priority;
            task.DueDate = dto.DueDate;
            task.UserId = assignedUserId;

            await _context.SaveChangesAsync();

            // Reload User for assignee username mapping
            await _context.Entry(task).Reference(t => t.User).LoadAsync();

            return new TaskResponseDto
            {
                Id = task.Id,
                Title = task.Title,
                Description = task.Description,
                Status = task.Status,
                Priority = task.Priority,
                DueDate = task.DueDate,
                UserId = task.UserId,
                AssigneeUsername = task.User != null ? task.User.Username : "Unassigned"
            };
        }

        public async Task<bool> DeleteTaskAsync(int id, int currentUserId, string role)
        {
            var task = await _context.Tasks.FindAsync(id);
            if (task == null) return false;

            // Authorization check
            if (!IsAdminOrSuperUser(role) && task.UserId != currentUserId)
            {
                return false;
            }

            _context.Tasks.Remove(task);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<DashboardStatsDto> GetDashboardStatsAsync(int userId, string role)
        {
            var query = _context.Tasks.AsQueryable();

            if (!IsAdminOrSuperUser(role))
            {
                query = query.Where(t => t.UserId == userId);
            }

            var stats = await query
                .GroupBy(t => t.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToListAsync();

            var result = new DashboardStatsDto();

            foreach (var stat in stats)
            {
                if (string.Equals(stat.Status, "Pending", StringComparison.OrdinalIgnoreCase))
                {
                    result.PendingCount = stat.Count;
                }
                else if (string.Equals(stat.Status, "InProgress", StringComparison.OrdinalIgnoreCase) || 
                         string.Equals(stat.Status, "In Progress", StringComparison.OrdinalIgnoreCase))
                {
                    result.InProgressCount = stat.Count;
                }
                else if (string.Equals(stat.Status, "Completed", StringComparison.OrdinalIgnoreCase))
                {
                    result.CompletedCount = stat.Count;
                }
            }

            return result;
        }
    }
}
