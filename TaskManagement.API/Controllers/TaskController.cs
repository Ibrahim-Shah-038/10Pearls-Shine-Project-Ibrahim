using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
[Authorize]   // ✅ Applied to whole controller
public class TaskController : ControllerBase
{
    [HttpGet]
    public IActionResult GetTasks()
    {
        return Ok("Protected route");
    }
}