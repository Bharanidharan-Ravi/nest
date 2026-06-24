import React from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import TicketListCard from "../component/TicketListCard";
import { FiMessageSquare } from "react-icons/fi";
dayjs.extend(relativeTime);

const ALL_TABS = [
  { key: "open", label: "Open", field: "statusId", excludeValues: [14, 15, 16, 17, 18,10] },
  { key: "closed", label: "Closed", field: "statusId", filterValue: [15, 16, 17] },
  { key: "hold", label: "Hold", field: "statusId", filterValue: [14] },
  { key: "queue", label: "In Queue", field: "statusId", filterValue: [18] },
  { key: "clientconfirm", label: "Need Confirmation", field: "statusId", filterValue: [10] },
];

// Pre-filtered viewer tabs
const VIEWER_TABS = ALL_TABS.filter(t => ["open", "closed","queue"].includes(t.key));


const fieldMap = {
  priorityRequest: "priorityRequest",
  isCloseRequested: "isCloseRequested",
  AdminResponse: "adminResponse",
  funcResponse: "funcResponse",
  TechnicalResponse: "technicalResponse",
  WebResponse: "webResponse",
};

const createSortFn = (priorityFields = []) => (a, b) => {
  for (let field of priorityFields) {
    const key = fieldMap[field]; // get actual property from object
    if (a[key] !== b[key]) {
      return a[key] ? -1 : 1; // true first
    }
  }
  // fallback to updatedAt descending
  return new Date(b.updatedAt) - new Date(a.updatedAt);
};

// Pre-create sort functions in your exact desired order
const fullCustomSortFn = createSortFn([
  "priorityRequest",
  "isCloseRequested",
  "AdminResponse",
  "funcResponse",
  "TechnicalResponse",
  "WebResponse",
]);

const ViewerCustomSortFn = createSortFn([]); // Only sorts by updatedAt

export const TicketListConfig = (isViewer = false) => ({
  defaultView: "card",
  pageSize: 20,
  moduleId: "tickets",
  syncUrl: true,
  enableSearch: true,
  enableTabs: true,
  enableSort: true,
  infinite: true,
  enableSelection: false,
  enableEdit: true,
  enableCardControls: true,
  enablequickComment: true,
  enablequickStatus: true,
  searchFields: ["title", "ticketKey"],
  filters: [
    {
      key: "status",
      options: [
        { label: "All", value: "" },
        { label: "Active", value: "Active" },
        { label: "Inactive", value: "Inactive" },
      ],
    },
  ],
  defaultSort: { field: "updatedAt", order: "desc" },
  sortFields: [
    { key: "createdAt", label: "Created on", type: "date" },
    { key: "updatedAt", label: "Last updated", type: "date" },
    {
      key: "dueDate",
      label: "Due Priority",
      type: "custom",
      orders: [
        { key: "today_first", label: "Due Today First" },
        { key: "overdue_first", label: "Overdue First" },
        { key: "upcoming_first", label: "Upcoming First" },
      ],
    },
  ],
  sortOrders: [
    { key: "desc", label: "Newest" },
    { key: "asc", label: "Oldest" },
  ],
  tabConfig: isViewer ? VIEWER_TABS : ALL_TABS,
  customSortFn: isViewer ? ViewerCustomSortFn : fullCustomSortFn,
  cardRenderer: (item, controls, config) => (
    <TicketListCard item={item} controls={controls} config={config} />
  ),
});