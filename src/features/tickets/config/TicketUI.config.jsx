import React from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import TicketListCard from "../component/TicketListCard";
dayjs.extend(relativeTime);

export const TicketListConfig = {
    defaultView: "card",
    pageSize:10,
    enableSearch: true,
    enableTabs: true, // 👈 required
    enableSort: true,
    infinite:true,
    enableSelection: true,
    enableEdit: true,
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
        key: "open", // UI key
        label: "Open", // What user sees
        field: "status",
        filterValue: "Active", // Actual DB value
      },
      {
        key: "closed",
        label: "Closed",
        field: "status",
        filterValue: "InActive",
      },
    ],
    cardRenderer: (item) => <TicketListCard item ={item}/>
  };
  