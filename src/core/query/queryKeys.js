export const queryKeys = {
  repo: {
    all: ["repo"],
    list: () => [...queryKeys.repo.all, "list"],
    detail: (id) => [...queryKeys.repo.all, "detail", id]
  },
  ticket: {
    all: ["ticket"],
    list: (repoId) => [...queryKeys.ticket.all, "list", repoId],
    detail: (id) => [...queryKeys.ticket.all, "detail", id],
    thread: (ticketId) => [...queryKeys.ticket.all, "thread", ticketId]
  },
  project: {
    all: ["project"],
    list: (repoId) => [...queryKeys.project.all, "list", repoId],
    detail: (id) => [...queryKeys.project.all, "detail", id]
  }
}
