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

  cardRenderer: (item, controls, isQuickOpen, setOpenQuickId) => (
    <TicketListCard
      item={item}
      controls={controls}
      // quickCommentButton={
      //   // config?.enablequickComment ? (
      //   <button
      //     className="px-2.5 py-1 rounded-md text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-300 transition-all duration-150 flex items-center gap-1 flex-shrink-0 shadow-sm hover:shadow-md outline-none focus:outline-none ring-0"
      //     title="Quick Comment"
      //     onClick={(e) => {
      //       e.stopPropagation();
      //       setOpenQuickId(isQuickOpen ? null : item);
      //     }}
      //   >
      //     <FiMessageSquare className="text-base" />
      //     {/* {isQuickOpen ? "Close" : "Quick Comment"} */}
      //   </button>
      //   // ) : null
      // }
    />
  ),
};
