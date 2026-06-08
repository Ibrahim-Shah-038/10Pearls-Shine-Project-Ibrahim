using System.Collections.Generic;
using System.Threading.Tasks;
using TaskManagement.API.DTOs;

namespace TaskManagement.API.Services
{
    public interface IUserService
    {
        Task<IEnumerable<UserDto>> GetUsersAsync();
        Task<UserDto?> GetUserByIdAsync(int id);
        Task<bool> UpdateUserRoleAsync(int id, string role);
        Task<bool> DeleteUserAsync(int id);
    }
}
