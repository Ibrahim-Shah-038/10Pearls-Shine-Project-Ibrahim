# TaskSphere - Task Management System

TaskSphere is a premium, feature-rich Task Management System built as part of the **10Pearls Shine Internship Program**. The project features a secure ASP.NET Core Web API backend and an elegant, responsive React client designed with a sleek glassmorphic dark theme.

## Features

- **Seeded SuperUser Account**: Seeding on startup ensures immediate administrative access with pre-configured credentials.
- **Hierarchical User Management**:
  - **SuperUser**: Full control to create, modify, and delete users (except self-deletion).
  - **Admin**: Can create/modify `User` and `Admin` roles. Cannot modify or delete other Admins or SuperUsers.
  - **User**: Standard workspace privileges.
- **Task Workspace**:
  - Full CRUD operations with title, description, status, priority, and due date.
  - Custom filters (keyword search, status, priority).
  - Assign tasks to any user (Admin/SuperUser only).
- **Interactive Dashboard**: Metric cards tracking Pending, In Progress, Completed, and Total Tasks, alongside a workspace progress indicator.
- **Real-Time Synchronizations**: SignalR Hub broadcasts task creation, updates, and deletions instantly, displaying slide-in toast notifications.
- **CSV Data Exchange**: Export and import workspace tasks.
- **Robust Error Handling**: Exception-handling middleware returning standardized JSON errors.
- **Security**: SHA256 password hashing and JWT token authorization.
- **Unit Testing**: xUnit suite with Moq covering auth endpoints, task filters, and privilege rules.

---

## Technology Stack

### Backend API (`TaskManagement.API`)
- **Framework**: .NET 8.0 / C#
- **Database**: Entity Framework Core with SQL Server (`SQLEXPRESS`)
- **Real-Time Communication**: SignalR Hub
- **Authentication**: JWT Bearer Tokens
- **Logging**: Serilog file logging

### Frontend UI (`taskmanagement-ui`)
- **Library**: React 19
- **Routing**: React Router v7
- **Icons**: Lucide React
- **Theme**: Vanilla HTML5/CSS3 custom premium dark theme

### Unit Tests (`TaskManagement.Tests`)
- **Framework**: xUnit
- **Mocking**: Moq
- **Database**: InMemory Entity Framework Database

---

## Setup & Running Guide

### Prerequisites
1. [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
2. [Node.js (v18+)](https://nodejs.org)
3. [SQL Server Express Edition](https://www.microsoft.com/sql-server/sql-server-downloads)

### 1. Clone the Project
Open a terminal and clone the repository:
```bash
git clone https://github.com/Ibrahim-Shah-038/10Pearls-Shine-Project-Ibrahim.git
cd 10Pearls-Shine-Project-Ibrahim
```

### 2. Configure Database Connection
Update the database connection string in the backend configuration file `TaskManagement.API/appsettings.json` if your SQL Server instance uses a different server name (defaults to `.\SQLEXPRESS`):
```json
"ConnectionStrings": {
    "DefaultConnection": "Server=.\\SQLEXPRESS;Database=TaskManagementDB;Trusted_Connection=True;TrustServerCertificate=True;"
}
```

### 3. Run the Backend API
Navigate to the API project folder and start the server:
```bash
cd TaskManagement.API
dotnet run --launch-profile http
```
The backend API compiles, seeds the default SuperUser, and runs on `http://localhost:5172`.

### 4. Run the Frontend UI
Open a separate terminal window, navigate to the frontend folder, install dependencies, and start the development server:
```bash
cd taskmanagement-ui
npm install
npm start
```
The React dev server will compile and open `http://localhost:3000` in your browser.

---

## Default SuperUser Credentials
Log in with the seeded SuperUser account to explore the dashboard and administration tools:
- **Email**: `superuser@taskmanagement.com`
- **Password**: `SuperUser@123`

---

## Running Unit Tests
To execute all 21 backend unit tests, navigate to the project root and run:
```bash
dotnet test
```

---

## Structured Logging (Serilog)
Serilog is integrated into the backend pipeline to capture structured diagnostic events:
- **Console Logging**: Real-time console logs are rendered during server execution (captures CORS, DbCommand execution times, controller activity, and exceptions).
- **File Logging**: Rotating log files are generated automatically and saved under `TaskManagement.API/logs/log-.txt` with daily file rolling policies.

---

## Static Code Analysis (SonarQube)
A `sonar-project.properties` file is configured at the workspace root directory. To scan the codebase for code quality, bugs, and code smells:
1. Ensure your local SonarQube server is running.
2. Ensure you have the `SonarScanner CLI` installed.
3. Run the scanner from the project root directory:
   ```bash
   sonar-scanner
   ```
