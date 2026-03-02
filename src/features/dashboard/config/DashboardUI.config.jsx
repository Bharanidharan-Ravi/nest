// export const DashboardCardConfig = {
//   defaultView: "card",
//   enableSearch: false,
//   enableTabs: false, // 👈 required
//   enableSort: false,
//   theme: {
//     cardItem:"rounded-[8px]"
//   },
//   cardRenderer: (item) => (
//     <div className="flex flex-col items-center justify-center gap-1 overflow-hidden ">
//       {/* Applying border-radius (rounded-lg) and overflow-hidden */}
//       <h1 className="text-ghBlue font-bold  text-2xl  m-0">{item.title}</h1>
//     </div>
//   ),
// }


// export const DashboardTableUI = {
//   syncUrl: false,
//   defaultView: "table",
//   enableSearch: false,
//   enableSelection:true,
//   enableTabs: false, 
//   theme: {
//     extend: {
//       height: {
//         '30': '30px', // Custom height (optional if needed for reference)
//       },
//     },
//   },
//   enableSort: false,
//   columns: [
//     { key: "issuesNo", label: "Issues No", render: (item) => <div className="h-30">{item.issuesNo}</div> },
//     { key: "title", label: "Title", render: (item) => <div className="h-30">{item.title}</div> },
//     { key: "dueDate", label: "Due Date", render: (item) => <div className="h-30">{item.dueDate}</div> },
//     { key: "assignee", label: "Assignee", render: (item) => <div className="h-30">{item.assignee}</div> },
//   ]
// };




// export const DashboardTimesheet = {
//   syncUrl: false,
//   defaultView: "table",
//   enableSearch: false,
//   enableTabs: false, 
//   theme: {
//     extend: {
//       height: {
//         '50': '50px', // Custom height (50px)
//       },
//     },
//   },
//   enableSort: false,
//   columns: [
//     { key: "TicketNo", label: "Ticket No", render: (item) => <div className="h-50">{item.TicketNo}</div> },
//     { key: "TicketName", label: "Ticket Name", render: (item) => <div className="h-50">{item.TicketName}</div> },
//     { key: "StartTime", label: "Start Time", render: (item) => <div className="h-50">{item.StartTime}</div> },
//     { key: "EndTime", label: "End Time", render: (item) => <div className="h-50">{item.EndTime}</div> },
//     { key: "total", label: "Total", render: (item) => <div className="h-50">{item.total}</div> },
//   ]
// };







export const DashboardCardConfig = {
  defaultView: "card",
  enableSearch: false,
  enableTabs: false,
  enableSort: false,
  theme: {
    cardItem: "rounded-[8px]",
  },
  cardRenderer: (item) => (
    <div className="flex flex-col items-center justify-center gap-1 overflow-hidden">
      <h1 className="text-ghBlue font-bold text-2xl m-0">{item.title}</h1>
    </div>
  ),
};

export const DashboardTableUI = {
  syncUrl: false,
  defaultView: "table",
  enableSearch: false,
  enableSelection: true,
  enableTabs: false,
  theme: {
    extend: {
      height: {
        '30': '30px',
      },
    },
  },
  enableSort: false,
  enableFooter:false,
  columns: [
    { key: "issuesNo", label: "Issues No", render: (item) => <div className="h-30">{item.issuesNo}</div> },
    { key: "title", label: "Title", render: (item) => <div className="h-30">{item.title}</div> },
    { key: "dueDate", label: "Due Date", render: (item) => <div className="h-30">{item.dueDate}</div> },
    { key: "assignee", label: "Assignee", render: (item) => <div className="h-30">{item.assignee}</div> },
  ],
};

export const DashboardTimesheet = {
  syncUrl: false,
  defaultView: "table",
  enableSearch: false,
  enableTabs: false,
  theme: {
    extend: {
      height: {
        '50': '50px',
      },
    },
  },
  enableSort: false,
  enableFooter:false,
  columns: [
    { key: "TicketNo", label: "Ticket No", render: (item) => <div className="h-50">{item.TicketNo}</div> },
    { key: "TicketName", label: "Ticket Name", render: (item) => <div className="h-50">{item.TicketName}</div> },
    { key: "StartTime", label: "Start Time", render: (item) => <div className="h-50">{item.StartTime}</div> },
    { key: "EndTime", label: "End Time", render: (item) => <div className="h-50">{item.EndTime}</div> },
    { key: "ConsumeTime", label: "Total", render: (item) => <div className="h-50">{item.ConsumeTime}</div> },
    { key: "total", label: "GrandTotal", render: (item) => <div className="h-50">{item.total}</div> },
  ],
};