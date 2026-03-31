import React from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import TicketListCard from "../component/TicketListCard";
dayjs.extend(relativeTime);

export const TicketListConfig = {
  defaultView: "card",
  pageSize: 20,
  enableSearch: true,
  enableTabs: true, // 👈 required
  enableSort: true,
  infinite: true,
  enableSelection: true,
  enableEdit: true,
  enableCardControls: true,
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
    { key: "createdAt", label: "Created on" },
    { key: "updatedAt", label: "Last updated" },
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
      excludeValues: [13, 14, 15, 16],
    },
    {
      key: "closed",
      label: "Closed",
      field: "statusId",
      // Specifically include these IDs for the Closed tab
      filterValue: [13, 14, 15, 16],
    },
  ],

  cardRenderer: (item, controls) => (
    <TicketListCard item={item} controls={controls} />
  ),
};
