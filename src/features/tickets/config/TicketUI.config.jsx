import React from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import TicketListCard from "../component/TicketListCard";
import { FiMessageSquare } from "react-icons/fi";
dayjs.extend(relativeTime);

export const TicketListConfig = {
  defaultView: "card",
  pageSize: 20,
  enableSearch: true,
  enableTabs: true, // 👈 required
  enableSort: true,
  infinite: true,
  enableSelection: false,
  enableEdit: true,
  enableCardControls: true,
  enablequickComment: true,
  searchFields: ["title", "description", "RepoKey"],
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
  defaultSort: {
    field: "updatedAt", // default field
    order: "desc", // default newest
  },

  sortFields: [
    { key: "createdAt", label: "Created on", type: "date" },
    { key: "updatedAt", label: "Last updated", type: "date" },
    // 🔥 NEW: Custom Bucket Sort for Due Date
    {
      key: "dueDate",
      label: "Due Priority",
      type: "custom",
      // These will override the global "Newest/Oldest" just for this field
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

  tabConfig: [
    {
      key: "open",
      label: "Open",
      field: "statusId",
      // Exclude OnHold(13), Closed(14), Cancelled(15), Inactive(16)
      // Anything NOT in this list will be treated as an Open/Active ticket
      excludeValues: [14, 15, 16, 17],
    },
    {
      key: "closed",
      label: "Closed",
      field: "statusId",
      // Specifically include these IDs for the Closed tab
      filterValue: [14, 15, 16, 17],
    },
  ],

  cardRenderer: (item, controls, config) => (
    <TicketListCard item={item} controls={controls} config={config} />
  ),
};
