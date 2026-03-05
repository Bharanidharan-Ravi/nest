export const queryKeys = {
  repo: {
    all: ["repo"],
    list: () => [...queryKeys.repo.all, "list"],
    detail: (id) => [...queryKeys.repo.all, "detail", id]
  },
  ticket: {
    all: ["ticket"],
    list: (scope) => {
      if (scope && typeof scope === "object") {
        const { repoId = "global", projectId = "all" } = scope;
        return [...queryKeys.ticket.all, "list", repoId, projectId];
      }

      return [...queryKeys.ticket.all, "list", scope ?? "global", "all"];
    },
    detail: (id) => [...queryKeys.ticket.all, "detail", id],
    thread: (ticketId) => [...queryKeys.ticket.all, "thread", ticketId]
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
}
