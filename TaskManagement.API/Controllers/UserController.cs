using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TaskManagement.API.Services;

namespace TaskManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ILogger<UserController> _logger;

        public UserController(IUserService userService, ILogger<UserController> logger)
        {
            _userService = userService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetUsers()
        {
            // Verify if user is Admin or SuperUser
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (!string.Equals(userRole, "Admin", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(userRole, "SuperUser", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning("Access denied for user listing: Current role is '{Role}'", userRole);
                return Forbid();
            }

            _logger.LogInformation("Admin user listing requested by user role: {Role}", userRole);
            var users = await _userService.GetUsersAsync();
            return Ok(users);
        }
    }
}
