export const queryKeys = {
  repo: {
    all: ["repo"],
    list: () => [...queryKeys.repo.all, "list"],
    detail: (id) => [...queryKeys.repo.all, "detail", id]
  },
   ticket: {
    all: ["ticket"],

    // Ticket list
    list: ({ repoId = "global", projectId = "all" } = {}) => [
      ...queryKeys.ticket.all,
      "list",
      repoId,
      projectId
    ],

    // Single ticket
    detail: (ticketId) => [
      ...queryKeys.ticket.all,
      "detail",
      ticketId
    ],

    // Ticket thread/comments
    thread: (ticketId) => [
      ...queryKeys.ticket.all,
      "thread",
      ticketId
    ],
    byEmployee: (employeeId) => [
      ...queryKeys.ticket.all, 
      "TicketsList", 
      { EmployeeId: employeeId }
    ],
    history: (ticketId) => [
      ...queryKeys.ticket.all,
      "history",
      ticketId
    ],
  },
  project: {
    all: ["project"],
    list: (repoId) => [...queryKeys.project.all, "list", repoId],
    detail: (id) => [...queryKeys.project.all, "detail", id]
  },
  dashboard: {
    all: ["dashboard"]
  },
   label: {
    all:    ["label"],
    list:   ()   => [...queryKeys.label.all, "list"],
    detail: (id) => [...queryKeys.label.all, "detail", id]
  },
   employee: {
    all:    ["EmployeeList"],
    list:   (id)   => [...queryKeys.employee.all, "list",id]
  },team: {
    all:    ["TeamList"],
    // list:   (id)   => [...queryKeys.employee.all, "list",id]
  },
  TicketProgress: {
    all:    ["TicketProgress"],
    list:   (id)   => [...queryKeys.TicketProgress.all, id]
  },
}
