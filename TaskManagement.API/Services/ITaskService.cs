using System.Collections.Generic;
using System.Threading.Tasks;
using TaskManagement.API.DTOs;

namespace TaskManagement.API.Services
{
    public interface ITaskService
    {
        Task<IEnumerable<TaskResponseDto>> GetTasksAsync(int userId, string role, string? search, string? status, string? priority);
        Task<TaskResponseDto?> GetTaskByIdAsync(int id, int userId, string role);
        Task<TaskResponseDto> CreateTaskAsync(TaskCreateDto dto, int currentUserId);
        Task<TaskResponseDto?> UpdateTaskAsync(int id, TaskUpdateDto dto, int currentUserId, string role);
        Task<bool> DeleteTaskAsync(int id, int currentUserId, string role);
        Task<DashboardStatsDto> GetDashboardStatsAsync(int userId, string role);
    }
}
