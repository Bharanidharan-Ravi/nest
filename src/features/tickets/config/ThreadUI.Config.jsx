import ThreadListCard from "../component/ThreadListCard/ThreadListCard";

export const ThreadListConfig = {
  defaultView: "card",
  pageSize: 15,
  enableSearch: false,
  enableTabs: false,
  enableSort: true,
  syncUrl: false,
  // enableEdit:true,
  infinite:true,
  hideTabs: true,
  defaultSort: {
    field: "UpdatedAt", // default field
    order: "asc", // default newest
  },

  // theme: {
  //   layout: "h-auto",
  // },
  theme: {
    layout: "h-auto overflow-visible shadow-none border-none", // Remove constraints
    cardItem: "w-full overflow-visible relative", // MUST remove overflow-hidden here
  },
  cardRenderer: (item) => <ThreadListCard item={item} />,
};
