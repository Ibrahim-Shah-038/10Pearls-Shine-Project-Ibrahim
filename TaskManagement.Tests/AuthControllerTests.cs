using System;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using TaskManagement.API.Controllers;
using TaskManagement.API.Data;
using TaskManagement.API.DTOs;
using TaskManagement.API.Helpers;
using TaskManagement.API.Models;
using Xunit;

namespace TaskManagement.Tests
{
    public class AuthControllerTests
    {
        private DbContextOptions<ApplicationDbContext> CreateNewContextOptions()
        {
            return new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
        }

        private Mock<IConfiguration> MockConfiguration()
        {
            var mock = new Mock<IConfiguration>();
            mock.Setup(c => c["Jwt:Key"]).Returns("THIS_IS_A_VERY_SECRET_KEY_FOR_TESTING_12345");
            mock.Setup(c => c["Jwt:Issuer"]).Returns("TestIssuer");
            mock.Setup(c => c["Jwt:Audience"]).Returns("TestAudience");
            return mock;
        }

        private Mock<ILogger<AuthController>> MockLogger()
        {
            return new Mock<ILogger<AuthController>>();
        }

        [Fact]
        public void Register_ShouldCreateUser_WhenDetailsAreValid()
        {
            // Arrange
            var options = CreateNewContextOptions();
            using var context = new ApplicationDbContext(options);
            var config = MockConfiguration().Object;
            var logger = MockLogger().Object;
            var controller = new AuthController(context, config, logger);

            var registerDto = new RegisterDto
            {
                Username = "testuser",
                Email = "testuser@example.com",
                Password = "Password123",
                Role = "User"
            };

            // Act
            var result = controller.Register(registerDto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Contains("registered successfully", okResult.Value.ToString());

            var user = context.Users.FirstOrDefault(u => u.Email == "testuser@example.com");
            Assert.NotNull(user);
            Assert.Equal("testuser", user.Username);
            Assert.Equal("User", user.Role);
            Assert.Equal(PasswordHasher.Hash("Password123"), user.PasswordHash);
        }

        [Fact]
        public void Register_ShouldReturnBadRequest_WhenEmailAlreadyExists()
        {
            // Arrange
            var options = CreateNewContextOptions();
            using var context = new ApplicationDbContext(options);
            context.Users.Add(new User
            {
                Username = "existing",
                Email = "duplicate@example.com",
                PasswordHash = "hashed",
                Role = "User"
            });
            context.SaveChanges();

            var config = MockConfiguration().Object;
            var logger = MockLogger().Object;
            var controller = new AuthController(context, config, logger);

            var registerDto = new RegisterDto
            {
                Username = "newuser",
                Email = "duplicate@example.com",
                Password = "password",
                Role = "User"
            };

            // Act
            var result = controller.Register(registerDto);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Contains("is already registered", badRequestResult.Value.ToString());
        }

        [Fact]
        public void Login_ShouldReturnToken_WhenCredentialsAreValid()
        {
            // Arrange
            var options = CreateNewContextOptions();
            using var context = new ApplicationDbContext(options);
            var password = "SecurePassword";
            context.Users.Add(new User
            {
                Username = "loginuser",
                Email = "login@example.com",
                PasswordHash = PasswordHasher.Hash(password),
                Role = "User"
            });
            context.SaveChanges();

            var config = MockConfiguration().Object;
            var logger = MockLogger().Object;
            var controller = new AuthController(context, config, logger);

            var loginDto = new LoginDto
            {
                Email = "login@example.com",
                Password = password
            };

            // Act
            var result = controller.Login(loginDto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
            
            // Should contain a property token
            var tokenProp = okResult.Value.GetType().GetProperty("token");
            Assert.NotNull(tokenProp);
            var token = tokenProp.GetValue(okResult.Value)?.ToString();
            Assert.False(string.IsNullOrEmpty(token));
        }

        [Fact]
        public void Login_ShouldReturnUnauthorized_WhenCredentialsAreInvalid()
        {
            // Arrange
            var options = CreateNewContextOptions();
            using var context = new ApplicationDbContext(options);
            context.Users.Add(new User
            {
                Username = "loginuser",
                Email = "login@example.com",
                PasswordHash = PasswordHasher.Hash("CorrectPassword"),
                Role = "User"
            });
            context.SaveChanges();

            var config = MockConfiguration().Object;
            var logger = MockLogger().Object;
            var controller = new AuthController(context, config, logger);

            var loginDto = new LoginDto
            {
                Email = "login@example.com",
                Password = "WrongPassword"
            };

            // Act
            var result = controller.Login(loginDto);

            // Assert
            var unauthorizedResult = Assert.IsType<UnauthorizedObjectResult>(result);
            Assert.Contains("Invalid email or password", unauthorizedResult.Value.ToString());
        }
    }
}
