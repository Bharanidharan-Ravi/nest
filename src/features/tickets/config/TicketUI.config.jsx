import React from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import TicketListCard from "../component/TicketListCard";
import { FiMessageSquare } from "react-icons/fi";
dayjs.extend(relativeTime);

export const TicketListConfig={
  defaultView: "card",
  pageSize: 20,
  moduleId: "tickets",
  syncUrl: true,
  enableSearch: true,
  enableTabs: true, // 👈 required
  enableSort: true,
  infinite: true,
  enableSelection: false,
  enableEdit: true,
  enableCardControls: true,
  enablequickComment: true,
  enablequickStatus: true,
  // searchFields: ["title", "description", "RepoKey","ticketKey" ],
  searchFields: ["title","ticketKey"],
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
      excludeValues: [14, 15, 16, 17, 18],
    },
    {
      key: "closed",
      label: "Closed",
      field: "statusId",
      // Specifically include these IDs for the Closed tab
      filterValue: [15, 16, 17],
    },
    {
      key: "hold",
      label: "Hold",
      field: "statusId",
      // Specifically include these IDs for the Closed tab
      filterValue: [14],
    },
     {
      key: "queue",
      label: "In Queue",
      field: "statusId",
      filterValue: [18],
    },
  ],

  cardRenderer: (item, controls, config) => (
    <TicketListCard item={item} controls={controls} config={config} />
  ),
  customSortFn:(a,b)=>{
    if(a.priorityRequest!=b.priorityRequest)
      return a.priorityRequest ? -1:1;
    if(a.isCloseRequested!=b.isCloseRequested)
      return a.isCloseRequested ? -1:1;
    if(a.AdminResponse!=b.AdminResponse)
      return a.AdminResponse ? -1:1;
    if(a.funcResponse!=b.funcResponse)
      return a.funcResponse ? -1:1;
    if(a.TechnicalResponse!=b.TechnicalResponse)
      return a.TechnicalResponse ? -1:1;
    if(a.WebResponse!=b.WebResponse)
      return a.WebResponse ? -1:1;
   
    
    return new Date(b.updatedAt)-new Date(a.updatedAt)
  }

};
