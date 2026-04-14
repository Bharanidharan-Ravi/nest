import { masterKeys } from "../../../core/master/masterCall/masterKeys";
import { queryKeys } from "../../../core/query/queryKeys";
import { ROUTE_KEYS } from "../../../core/routing/paths";
import { TicketFieldConfig } from "./Ticket.Config";

export const TicketFormConfig = {
  key: "ticket",
  title: "Tickets",
  api: "/Ticket/CreateTicket",

  invalidateKeys: [masterKeys.multi(["TicketsList"])],

  redirectTo: ROUTE_KEYS.TICKET_LIST,

  fields: TicketFieldConfig(),

  theme: {
    // Parent Card & Footer
    // formContainer: "wg-form-container",
    // footer: "wg-form-footer",
    // submitBtn: "wg-submit-btn",
    // input: "wg-input",
    // Editor Styling
    editorContainer:
      "border border-gray-300 rounded-md overflow-hidden bg-white focus-within:border-gray-500 focus-within:ring-0 transition-all",
    editorToolbar:
      "flex flex-wrap items-center gap-1 px-3 py-2 border-b border-gray-200 bg-gray-50",
  },
};
