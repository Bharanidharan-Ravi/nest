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

    // Paged ticket list (TicketListV2) and its counts (TicketListCountsV2)
    page: (request) => [...queryKeys.ticket.all, "page", request],
    pageCounts: (request) => [...queryKeys.ticket.all, "pageCounts", request],

    // Single ticket
    detail: (ticketId) => [...queryKeys.ticket.all, "detail", ticketId],

    // Ticket thread/comments
    thread: (ticketId) => [...queryKeys.ticket.all, "thread", ticketId],
    issueLog: (ticketId) => [...queryKeys.ticket.all, "issueLog", ticketId],
    byEmployee: (employeeId) => [
      ...queryKeys.ticket.all,
      "TicketsList",
      { EmployeeId: employeeId },
    ],
    history: (ticketId) => [...queryKeys.ticket.all, "history", ticketId],
    feedbacks: (ticketId) => [...queryKeys.ticket.all, "feedbacks", ticketId],
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
    // Filled by the same GET /notification/counts call as unreadCount (badgeCounts.js)
    leaveRequestCount: () => [...queryKeys.notification.all, "leave-request-count"],
    staleTickets: () => [...queryKeys.notification.all, "stale-tickets"],

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
  GetUserOnlineStatus: {
    all: ["GetUserOnlineStatus"],
    list: () => [...queryKeys.GetUserOnlineStatus.all, "list"],
    detail: (id) => [...queryKeys.GetUserOnlineStatus.all, "detail", id],
  },
  leaveRequest: {
    all: ["GetLeaveRequests"],
    list: () => [...queryKeys.leaveRequest.all, "list"],
  },
  permissionRequest: {
    all: ["GetPermissionRequests"],
    list: () => [...queryKeys.permissionRequest.all, "list"],
  },
  AllHour: {
    all: ["AllHour"],
    list: () => [...queryKeys.AllHour.all, "list"],
  },
  ThreadWorkType: {
    all: ["ThreadWorkType"],
    list: () => [...queryKeys.ThreadWorkType.all, "list"],
  },
  holiday: {
    all:["HolidayList"],
    list: (id) => [...queryKeys.holiday.all, "list", id],
  },
  policy: {
    all: ["policy"],
    latest: () => [...queryKeys.policy.all, "latest"],
  },
};
