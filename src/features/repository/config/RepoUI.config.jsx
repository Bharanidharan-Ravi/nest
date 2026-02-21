export const RepoUIConfig = {
  data: [],
  columns: [
    { key: "title", label: "Title" },
    { key: "status", label: "Status" },
    { key: "priority", label: "Priority" },
  ],
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
  cardRenderer: (item) => (
    <div className="border p-3 rounded">
      <h3>{item.title}</h3>
      <p>{item.status}</p>
    </div>
  ),
};

export const repoListConfig = {
  defaultView: "card",
  enableSearch: true,
  enableTabs: true, // 👈 required
  enableSort: true,
  // allowViewSwitch: true,
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
  columns: [
    { key: "title", label: "Title" },
    { key: "author", label: "Author" },
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
      filterValue: "Inactive",
    },
  ],
  cardRenderer: (item) => (
    <div className="flex flex-col gap-1">
      <h3 className="text-ghBlue font-semibold text-base m-0">{item.title}</h3>
      {/* <p className="text-ghMuted text-sm">{item.owner}</p> */}
      <p className="text-xs text-ghMuted ">Updated: {item.createdAt}</p>
    </div>
  ),
};
