using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TaskManagement.API.Services;
using TaskManagement.API.DTOs;

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

        [HttpPost]
        public async Task<IActionResult> CreateUser([FromBody] RegisterDto dto)
        {
            var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (!string.Equals(currentUserRole, "Admin", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(currentUserRole, "SuperUser", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning("Access denied for user creation: Current role is '{Role}'", currentUserRole);
                return Forbid();
            }

            if (dto == null || string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest(new { message = "Username, email, and password are required." });
            }

            // Privilege check: Admins cannot create SuperUsers
            if (string.Equals(currentUserRole, "Admin", StringComparison.OrdinalIgnoreCase) && 
                string.Equals(dto.Role, "SuperUser", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning("Admin user attempted to create a SuperUser account.");
                return BadRequest(new { message = "Admins cannot create SuperUser accounts." });
            }

            _logger.LogInformation("Creating user '{Username}' with role '{Role}' by administrator role '{AdminRole}'", dto.Username, dto.Role ?? "User", currentUserRole);
            var newUser = await _userService.CreateUserAsync(dto);
            if (newUser == null)
            {
                return BadRequest(new { message = "Email is already registered." });
            }

            return CreatedAtAction(nameof(GetUsers), new { id = newUser.Id }, newUser);
        }

        [HttpPut("{id}/role")]
        public async Task<IActionResult> UpdateRole(int id, [FromBody] UpdateRoleRequest request)
        {
            var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (!string.Equals(currentUserRole, "Admin", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(currentUserRole, "SuperUser", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning("Access denied for role update on user ID {TargetId}: Current role is '{Role}'", id, currentUserRole);
                return Forbid();
            }

            if (request == null || string.IsNullOrWhiteSpace(request.Role))
            {
                return BadRequest(new { message = "Role is required." });
            }

            // Fetch target user first to verify role status
            var targetUser = await _userService.GetUserByIdAsync(id);
            if (targetUser == null)
            {
                return NotFound(new { message = "User not found." });
            }

            // Privilege checks for Admins
            if (string.Equals(currentUserRole, "Admin", StringComparison.OrdinalIgnoreCase))
            {
                // Admins cannot change the role of a SuperUser or another Admin
                if (string.Equals(targetUser.Role, "SuperUser", StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(targetUser.Role, "Admin", StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogWarning("Admin user attempted to change role of a privileged user (ID: {TargetId}, Current Role: {TargetRole})", id, targetUser.Role);
                    return BadRequest(new { message = "Admins cannot modify roles of other Admins or SuperUsers." });
                }

                // Admins cannot promote anyone to SuperUser
                if (string.Equals(request.Role, "SuperUser", StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogWarning("Admin user attempted to promote user ID {TargetId} to SuperUser.", id);
                    return BadRequest(new { message = "Admins cannot promote users to SuperUser." });
                }
            }

            _logger.LogInformation("Updating role of user ID {TargetId} (current: {CurrentRole}) to '{NewRole}' by administrator role '{AdminRole}'", id, targetUser.Role, request.Role, currentUserRole);
            var success = await _userService.UpdateUserRoleAsync(id, request.Role);
            if (!success)
            {
                return BadRequest(new { message = "Failed to update user role." });
            }

            return Ok(new { message = "User role updated successfully." });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (!string.Equals(currentUserRole, "Admin", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(currentUserRole, "SuperUser", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning("Access denied for user deletion of ID {TargetId}: Current role is '{Role}'", id, currentUserRole);
                return Forbid();
            }

            // Prevent self-deletion
            var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(currentUserIdClaim, out int currentUserId) && currentUserId == id)
            {
                _logger.LogWarning("Admin user ID {AdminId} attempted to delete their own account.", id);
                return BadRequest(new { message = "You cannot delete your own account." });
            }

            // Fetch target user first to verify role status
            var targetUser = await _userService.GetUserByIdAsync(id);
            if (targetUser == null)
            {
                return NotFound(new { message = "User not found." });
            }

            // Privilege check: Admins can only delete normal Users (not Admins or SuperUsers)
            if (string.Equals(currentUserRole, "Admin", StringComparison.OrdinalIgnoreCase))
            {
                if (string.Equals(targetUser.Role, "SuperUser", StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(targetUser.Role, "Admin", StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogWarning("Admin user attempted to delete a privileged user (ID: {TargetId}, Role: {TargetRole})", id, targetUser.Role);
                    return BadRequest(new { message = "Admins cannot delete other Admins or SuperUser accounts." });
                }
            }

            _logger.LogInformation("Deleting user ID {TargetId} by administrator role '{AdminRole}'", id, currentUserRole);
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
