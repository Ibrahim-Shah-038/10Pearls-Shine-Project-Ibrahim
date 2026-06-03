using System.Collections.Generic;
using System.Threading.Tasks;
using TaskManagement.API.DTOs;

namespace TaskManagement.API.Services
{
    public interface IUserService
    {
        Task<IEnumerable<UserDto>> GetUsersAsync();
        Task<UserDto?> GetUserByIdAsync(int id);
    }
}
