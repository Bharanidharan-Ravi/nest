import TicketsPage from "./pages/TicketsPage";
import TicketDetailPage from "./pages/TicketDetailPage";
import TicketCreatePage from "./pages/TicketCreatePage";

export const TicketsFeature = {
  name: "tickets",
  basePath: "/tickets",

  routes: [
    {
      path: "",
      element: TicketsPage
    },
    {
      path: "/create",
      element: TicketCreatePage
    },
    {
      path: "/:ticketId",
      element: TicketDetailPage
    }
  ]
}
