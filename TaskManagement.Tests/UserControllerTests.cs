using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using TaskManagement.API.Controllers;
using TaskManagement.API.DTOs;
using TaskManagement.API.Services;
using Xunit;

namespace TaskManagement.Tests
{
    public class UserControllerTests
    {
        private Mock<IUserService> MockUserService()
        {
            return new Mock<IUserService>();
        }

        private Mock<ILogger<UserController>> MockLogger()
        {
            return new Mock<ILogger<UserController>>();
        }

        private UserController CreateControllerWithUser(IUserService userService, string role, string id = "1")
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.NameIdentifier, id)
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);

            var controller = new UserController(userService, MockLogger().Object)
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = new DefaultHttpContext { User = principal }
                }
            };

            return controller;
        }

        [Fact]
        public async Task CreateUser_ShouldReturnCreated_WhenCallerIsSuperUser()
        {
            // Arrange
            var userServiceMock = MockUserService();
            var dto = new RegisterDto { Username = "newuser", Email = "new@example.com", Password = "Password123", Role = "Admin" };
            userServiceMock.Setup(s => s.CreateUserAsync(dto))
                .ReturnsAsync(new UserDto { Id = 10, Username = dto.Username, Email = dto.Email, Role = dto.Role });

            var controller = CreateControllerWithUser(userServiceMock.Object, "SuperUser");

            // Act
            var result = await controller.CreateUser(dto);

            // Assert
            var createdResult = Assert.IsType<CreatedAtActionResult>(result);
            var returnedUser = Assert.IsType<UserDto>(createdResult.Value);
            Assert.Equal("Admin", returnedUser.Role);
        }

        [Fact]
        public async Task CreateUser_ShouldReturnBadRequest_WhenRoleIsSuperUser()
        {
            // Arrange
            var userServiceMock = MockUserService();
            var dto = new RegisterDto { Username = "newsuper", Email = "super@example.com", Password = "Password123", Role = "SuperUser" };
            var controller = CreateControllerWithUser(userServiceMock.Object, "SuperUser");

            // Act
            var result = await controller.CreateUser(dto);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Contains("Creating additional SuperUser accounts is not permitted", badRequestResult.Value.ToString());
        }

        [Fact]
        public async Task UpdateRole_ShouldReturnBadRequest_WhenTargetIsSuperUser()
        {
            // Arrange
            var userServiceMock = MockUserService();
            userServiceMock.Setup(s => s.GetUserByIdAsync(2))
                .ReturnsAsync(new UserDto { Id = 2, Username = "targetsuper", Email = "super@example.com", Role = "SuperUser" });

            var controller = CreateControllerWithUser(userServiceMock.Object, "SuperUser");
            var request = new UpdateRoleRequest { Role = "User" };

            // Act
            var result = await controller.UpdateRole(2, request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Contains("The SuperUser account role cannot be changed", badRequestResult.Value.ToString());
        }

        [Fact]
        public async Task UpdateRole_ShouldReturnBadRequest_WhenRoleToAssignIsSuperUser()
        {
            // Arrange
            var userServiceMock = MockUserService();
            userServiceMock.Setup(s => s.GetUserByIdAsync(2))
                .ReturnsAsync(new UserDto { Id = 2, Username = "targetuser", Email = "user@example.com", Role = "User" });

            var controller = CreateControllerWithUser(userServiceMock.Object, "SuperUser");
            var request = new UpdateRoleRequest { Role = "SuperUser" };

            // Act
            var result = await controller.UpdateRole(2, request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Contains("Assigning the SuperUser role is not permitted", badRequestResult.Value.ToString());
        }

        [Fact]
        public async Task DeleteUser_ShouldReturnBadRequest_WhenCallerIsAdminAndTargetIsAdmin()
        {
            // Arrange
            var userServiceMock = MockUserService();
            userServiceMock.Setup(s => s.GetUserByIdAsync(3))
                .ReturnsAsync(new UserDto { Id = 3, Username = "targetadmin", Email = "admin2@example.com", Role = "Admin" });

            var controller = CreateControllerWithUser(userServiceMock.Object, "Admin", id: "1");

            // Act
            var result = await controller.DeleteUser(3);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Contains("Admins cannot delete other Admins or SuperUser accounts", badRequestResult.Value.ToString());
        }
    }
}
