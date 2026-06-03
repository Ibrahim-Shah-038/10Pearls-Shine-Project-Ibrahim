using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Data;
using TaskManagement.API.DTOs;
using TaskManagement.API.Models;
using TaskManagement.API.Services;
using Xunit;

namespace TaskManagement.Tests
{
    public class TaskServiceTests
    {
        private DbContextOptions<ApplicationDbContext> CreateNewContextOptions()
        {
            return new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
        }

        private async Task SeedDataAsync(ApplicationDbContext context)
        {
            var user1 = new User { Id = 1, Username = "user1", Email = "u1@example.com", PasswordHash = "hash", Role = "User" };
            var user2 = new User { Id = 2, Username = "user2", Email = "u2@example.com", PasswordHash = "hash", Role = "User" };
            var admin = new User { Id = 3, Username = "admin", Email = "admin@example.com", PasswordHash = "hash", Role = "Admin" };

            context.Users.AddRange(user1, user2, admin);

            var tasks = new List<TaskItem>
            {
                new TaskItem { Id = 10, Title = "Clean Room", Description = "Clean the main room", Status = "Pending", Priority = "Low", DueDate = DateTime.Now.AddDays(1), UserId = 1 },
                new TaskItem { Id = 11, Title = "Write Code", Description = "Write backend API tests", Status = "InProgress", Priority = "High", DueDate = DateTime.Now.AddDays(2), UserId = 1 },
                new TaskItem { Id = 12, Title = "Review Code", Description = "Review UI features", Status = "Completed", Priority = "Medium", DueDate = DateTime.Now.AddDays(3), UserId = 1 },
                new TaskItem { Id = 13, Title = "Deploy App", Description = "Deploy app to production", Status = "Pending", Priority = "High", DueDate = DateTime.Now.AddDays(4), UserId = 2 }
            };

            context.Tasks.AddRange(tasks);
            await context.SaveChangesAsync();
        }

        [Fact]
        public async Task GetTasksAsync_ShouldReturnOnlyUserTasks_ForRegularUser()
        {
            // Arrange
            var options = CreateNewContextOptions();
            using var context = new ApplicationDbContext(options);
            await SeedDataAsync(context);
            var service = new TaskService(context);

            // Act
            var tasks = await service.GetTasksAsync(1, "User", null, null, null);

            // Assert
            Assert.Equal(3, tasks.Count());
            Assert.All(tasks, t => Assert.Equal(1, t.UserId));
        }

        [Fact]
        public async Task GetTasksAsync_ShouldReturnAllTasks_ForAdmin()
        {
            // Arrange
            var options = CreateNewContextOptions();
            using var context = new ApplicationDbContext(options);
            await SeedDataAsync(context);
            var service = new TaskService(context);

            // Act
            var tasks = await service.GetTasksAsync(3, "Admin", null, null, null);

            // Assert
            Assert.Equal(4, tasks.Count());
        }

        [Fact]
        public async Task GetTasksAsync_ShouldApplyFiltersCorrectly()
        {
            // Arrange
            var options = CreateNewContextOptions();
            using var context = new ApplicationDbContext(options);
            await SeedDataAsync(context);
            var service = new TaskService(context);

            // Act: Search filter
            var tasksSearch = await service.GetTasksAsync(3, "Admin", "Clean", null, null);
            // Act: Status filter
            var tasksStatus = await service.GetTasksAsync(3, "Admin", null, "InProgress", null);
            // Act: Priority filter
            var tasksPriority = await service.GetTasksAsync(3, "Admin", null, null, "High");

            // Assert
            Assert.Single(tasksSearch);
            Assert.Equal("Clean Room", tasksSearch.First().Title);

            Assert.Single(tasksStatus);
            Assert.Equal("Write Code", tasksStatus.First().Title);

            Assert.Equal(2, tasksPriority.Count()); // Write Code and Deploy App
        }

        [Fact]
        public async Task CreateTaskAsync_ShouldCreateTaskAndAssignToSelf_WhenUserIdNotSpecified()
        {
            // Arrange
            var options = CreateNewContextOptions();
            using var context = new ApplicationDbContext(options);
            await SeedDataAsync(context);
            var service = new TaskService(context);

            var createDto = new TaskCreateDto
            {
                Title = "New Task",
                Description = "Description",
                Status = "Pending",
                Priority = "Medium",
                DueDate = DateTime.Now.AddDays(5),
                UserId = null
            };

            // Act
            var created = await service.CreateTaskAsync(createDto, 1);

            // Assert
            Assert.NotNull(created);
            Assert.Equal(1, created.UserId);
            Assert.Equal("New Task", created.Title);

            var taskInDb = await context.Tasks.FindAsync(created.Id);
            Assert.NotNull(taskInDb);
        }

        [Fact]
        public async Task UpdateTaskAsync_ShouldUpdateTask_WhenUserOwnsIt()
        {
            // Arrange
            var options = CreateNewContextOptions();
            using var context = new ApplicationDbContext(options);
            await SeedDataAsync(context);
            var service = new TaskService(context);

            var updateDto = new TaskUpdateDto
            {
                Title = "Clean Room (Updated)",
                Description = "Clean properly",
                Status = "InProgress",
                Priority = "High",
                DueDate = DateTime.Now.AddDays(1),
                UserId = 1
            };

            // Act
            var updated = await service.UpdateTaskAsync(10, updateDto, 1, "User");

            // Assert
            Assert.NotNull(updated);
            Assert.Equal("Clean Room (Updated)", updated.Title);
            Assert.Equal("InProgress", updated.Status);
            Assert.Equal("High", updated.Priority);
        }

        [Fact]
        public async Task UpdateTaskAsync_ShouldReturnNull_WhenUserDoesNotOwnItAndIsNoAdmin()
        {
            // Arrange
            var options = CreateNewContextOptions();
            using var context = new ApplicationDbContext(options);
            await SeedDataAsync(context);
            var service = new TaskService(context);

            var updateDto = new TaskUpdateDto
            {
                Title = "Deploy App (Hacked)",
                Description = "Hack description",
                Status = "Completed",
                Priority = "Low",
                DueDate = DateTime.Now.AddDays(4),
                UserId = 2
            };

            // Act: User 1 attempts to update User 2's task (ID: 13)
            var updated = await service.UpdateTaskAsync(13, updateDto, 1, "User");

            // Assert
            Assert.Null(updated);
            
            // Check that task is not modified in Db
            var originalTask = await context.Tasks.FindAsync(13);
            Assert.Equal("Deploy App", originalTask.Title);
        }

        [Fact]
        public async Task DeleteTaskAsync_ShouldDeleteTask_WhenUserOwnsIt()
        {
            // Arrange
            var options = CreateNewContextOptions();
            using var context = new ApplicationDbContext(options);
            await SeedDataAsync(context);
            var service = new TaskService(context);

            // Act
            var result = await service.DeleteTaskAsync(10, 1, "User");

            // Assert
            Assert.True(result);
            var task = await context.Tasks.FindAsync(10);
            Assert.Null(task);
        }

        [Fact]
        public async Task DeleteTaskAsync_ShouldReturnFalse_WhenUserDoesNotOwnItAndIsNoAdmin()
        {
            // Arrange
            var options = CreateNewContextOptions();
            using var context = new ApplicationDbContext(options);
            await SeedDataAsync(context);
            var service = new TaskService(context);

            // Act: User 1 attempts to delete User 2's task (ID: 13)
            var result = await service.DeleteTaskAsync(13, 1, "User");

            // Assert
            Assert.False(result);
            var task = await context.Tasks.FindAsync(13);
            Assert.NotNull(task);
        }

        [Fact]
        public async Task GetDashboardStatsAsync_ShouldReturnCorrectAggregations()
        {
            // Arrange
            var options = CreateNewContextOptions();
            using var context = new ApplicationDbContext(options);
            await SeedDataAsync(context);
            var service = new TaskService(context);

            // Act
            var statsUser1 = await service.GetDashboardStatsAsync(1, "User");
            var statsAdmin = await service.GetDashboardStatsAsync(3, "Admin");

            // Assert
            // User 1 has: Pending (10), InProgress (11), Completed (12)
            Assert.Equal(1, statsUser1.PendingCount);
            Assert.Equal(1, statsUser1.InProgressCount);
            Assert.Equal(1, statsUser1.CompletedCount);

            // Admin totals: Pending (10, 13), InProgress (11), Completed (12)
            Assert.Equal(2, statsAdmin.PendingCount);
            Assert.Equal(1, statsAdmin.InProgressCount);
            Assert.Equal(1, statsAdmin.CompletedCount);
        }
    }
}
