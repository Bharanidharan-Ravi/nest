import Bannerlist from "../Components/Bannercard";

  
  export const BannerListConfig = {
    defaultView: "card",
    pageSize:100,
    enableSearch: true,
    enableTabs: true, // 👈 required
    enableSort: true,
    enableEdit:true,
    // allowViewSwitch: true,
    filters: [
      {
        key: "Status",
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
        field: "Status",
        filterValue: "Active", // Actual DB value
      },
      {
        key: "closed",
        label: "Closed",
        field: "Status",
        filterValue: "Inactive",
      },
    ],
    cardRenderer: (item) => <Bannerlist item={item} />
  };
  
  