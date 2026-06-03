using Microsoft.AspNetCore.SignalR;

namespace TaskManagement.API.Hubs
{
    public class TaskHub : Hub
    {
        // Real-time operations will be triggered from controllers/services,
        // sending broadcasts like Clients.All.SendAsync("TaskUpdated", taskDetails)
    }
}
