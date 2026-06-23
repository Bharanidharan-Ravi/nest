export const queryKeys = {
  repo: {
    all: ["repo"],
    list: () => [...queryKeys.repo.all, "list"],
    detail: (id) => [...queryKeys.repo.all, "detail", id],
  },
  ticket: {
    all: ["ticket"],

    // Ticket list
    list: ({ repoId = "global", projectId = "all" } = {}) => [
      ...queryKeys.ticket.all,
      "list",
      repoId,
      projectId,
    ],

    // Single ticket
    detail: (ticketId) => [...queryKeys.ticket.all, "detail", ticketId],

    // Ticket thread/comments
    thread: (ticketId) => [...queryKeys.ticket.all, "thread", ticketId],
    byEmployee: (employeeId) => [
      ...queryKeys.ticket.all,
      "TicketsList",
      { EmployeeId: employeeId },
    ],
    history: (ticketId) => [...queryKeys.ticket.all, "history", ticketId],
  },
  project: {
    all: ["project"],
    list: (repoId) => [...queryKeys.project.all, "list", repoId],
    detail: (id) => [...queryKeys.project.all, "detail", id],
  },
  dashboard: {
    all: ["dashboard"],
  },
  label: {
    all: ["label"],
    list: () => [...queryKeys.label.all, "list"],
    detail: (id) => [...queryKeys.label.all, "detail", id],
  },
  employee: {
    all: ["EmployeeList"],
    list: (id) => [...queryKeys.employee.all, "list", id],
  },
  team: {
    all: ["TeamList"],
    // list:   (id)   => [...queryKeys.employee.all, "list",id]
  },
  TicketProgress: {
    all: ["TicketProgress"],
    list: (id) => [...queryKeys.TicketProgress.all, id],
  },
  client: {
    all: ["client"],
    list: () => [...queryKeys.client.all, "list"],
    detail: (id) => [...queryKeys.client.all, "detail", id],
  },
  notification: {
    all: ["notification"],

    unreadCount: () => [...queryKeys.notification.all, "unread-count"],

    list: () => [...queryKeys.notification.all, "list"],
    timeline: () => [...queryKeys.notification.all, "timeline"],
  },
   BannerData: {
    all: ["BannerData"],
    list: () => [...queryKeys.BannerData.all, "list"],
    detail: (id) => [...queryKeys.BannerData.all, "detail", id],
  },
  BannerDataType: {
    all: ["BannerDataType"],
    list: () => [...queryKeys.BannerDataType.all, "list"],
    detail: (id) => [...queryKeys.BannerDataType.all, "detail", id],
  },
  MeetingData: {
    all:   ["MeetingData"],
    list:  (Employee_Id) => [...queryKeys.MeetingData.all, "list",Employee_Id],
  },
   StaleTickets: {
    all: ["GetStaleTicketsForAssignee"],
    list: () => [...queryKeys.GetStaleTicketsForAssignee.all, "list"],
    detail: (id) => [...queryKeys.GetStaleTicketsForAssignee.all, "detail", id],
  },
};
