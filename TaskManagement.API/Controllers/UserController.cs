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

        [HttpPut("{id}/role")]
        public async Task<IActionResult> UpdateRole(int id, [FromBody] UpdateRoleRequest request)
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (!string.Equals(userRole, "Admin", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(userRole, "SuperUser", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning("Access denied for role update on user ID {TargetId}: Current role is '{Role}'", id, userRole);
                return Forbid();
            }

            if (request == null || string.IsNullOrWhiteSpace(request.Role))
            {
                return BadRequest(new { message = "Role is required." });
            }

            _logger.LogInformation("Updating role of user ID {TargetId} to '{NewRole}' by admin role '{AdminRole}'", id, request.Role, userRole);
            var success = await _userService.UpdateUserRoleAsync(id, request.Role);
            if (!success)
            {
                return BadRequest(new { message = "Failed to update user role. Ensure user exists and role is valid." });
            }

            return Ok(new { message = "User role updated successfully." });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (!string.Equals(userRole, "Admin", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(userRole, "SuperUser", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning("Access denied for user deletion of ID {TargetId}: Current role is '{Role}'", id, userRole);
                return Forbid();
            }

            // Prevent self-deletion
            var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(currentUserIdClaim, out int currentUserId) && currentUserId == id)
            {
                _logger.LogWarning("Admin user ID {AdminId} attempted to delete their own account.", id);
                return BadRequest(new { message = "You cannot delete your own account." });
            }

            _logger.LogInformation("Deleting user ID {TargetId} by admin role '{AdminRole}'", id, userRole);
            var success = await _userService.DeleteUserAsync(id);
            if (!success)
            {
                return NotFound(new { message = "User not found." });
            }

            return Ok(new { message = "User deleted successfully." });
        }
    }

    public class UpdateRoleRequest
    {
        public string Role { get; set; } = string.Empty;
    }
}
