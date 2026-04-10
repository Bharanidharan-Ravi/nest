// src/core/adapters/employeeAdapter.js
export const formatEmployee = (Emp) => {
  if (!Emp) return null;
  return {
    id:             Emp.UserID, // API renames UserID → EmployeeID? Change ONLY here
    name:           Emp.UserName,
    Status:         Emp.Status,
    isActive:       Emp.Status === "Active",
    AvatarPath:     Emp?.PreviewUrl,
    Team:           Emp.Team,
    Role:           Emp.Role,
    Specialization: Emp.Specialization,
    CreatedBy:      Emp.CreatedBy,
    CreatedAt:      Emp.CreatedAt,
    Email:          Emp.Email,
    PhoneNumber:    Emp.PhoneNumber,
    DoB:            Emp.DoB,
  };
};

// src/core/adapters/repoAdapter.js
export const formatRepo = (raw) => {
  if (!raw) return null;
  return {
    id: raw.Repo_Id,
    name: raw.Title,
    key: raw.RepoKey,
  };
};

// src/core/adapters/projectAdapter.js
export const formatProject = (raw) => {
  if (!raw) return null;

  return {
    id: raw.Id,
    name: raw.Project_Name,
    description: raw.Description || raw.HtmlDesc,
    status: raw.Status,
    projectKey: raw.ProjectKey,

    repoId: raw.Repo_Id,
    repoName: raw.Repo_Name,

    responsibleId: raw.Responsible,
    createdBy: raw.CreatedBy,
    createdAt: raw.CreatedAt,
    updatedBy: raw.UpdatedBy,
    updatedAt: raw.UpdatedAt,

    startDate: raw.StartDate,
    dueDate: raw.DueDate,

    employeeName: raw.EmployeeName,
  };
};

// src/core/adapters/labelAdapter.js
export const formatLabel = (raw) => {
  if (!raw) return null;
  return {
    id: raw.Id,
    name: raw.Title,
  };
};

export const formatTeam = (raw) => {
  if (!raw) return null;
  return {
    id: raw.TeamId,
    name: raw.TeamName,
  };
};

// src/core/adapters/ticketAdapter.js  ← move out of TicketCreatePage
export const formatTicket = (ticket) => {
  if (!ticket) return null;
  return {
    id: ticket.Issue_Id,
    issueId: ticket.Issue_Id,
    title: ticket.Title,
    ticketKey: ticket.Issue_Code,
    status: ticket.Status,
    navId: ticket.Issue_Id,
    statusId: ticket.StatusId,
    description: ticket.HtmlDesc || ticket.Description,
    assignedTo: ticket.Assignee_Id,
    estimateHours: ticket.hours,
    createdAt: ticket.CreatedAt,
    updatedAt: ticket.UpdatedAt,
    updatedBy: ticket.UpdatedBy,
    repoId: ticket.RepoId,
    dueDate: ticket.Due_Date,
    project: ticket.Project_Id,
    ProjKey: ticket.ProjKey,
    RepoKey: ticket.RepoKey,
    priority: ticket.Priority,
    // Safely parse JSON strings, fallback to empty arrays if null/invalid
    multiAssignees: ticket.All_Assignees
      ? JSON.parse(ticket.All_Assignees)
      : [],
    label: ticket.Labels_JSON ? JSON.parse(ticket.Labels_JSON) : [],
    CompletionPct: ticket.CompletionPct,
    teamId: ticket.Assignee_TeamId,
    teamName: ticket.Assignee_TeamName,
  };
};
