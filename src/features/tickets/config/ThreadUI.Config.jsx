import ThreadListCard from "../component/ThreadListCard/ThreadListCard";
import ThreadParent from "../component/ThreadParent/ThreadParent";

export const ThreadParentConfig = {
  defaultView: "card",
  pageSize: 10,
  enableSearch: false,
  enableTabs: false, // 👈 required
  enableSort: false,
  hideTabs: true,
  // enableEdit:true,
  theme: {
    layout: "h-auto",
  },
  cardRenderer: (item) => {
    return <ThreadParent item={item} />;
  },
};

export const ThreadListConfig = {
  defaultView: "card",
  pageSize: 15,
  enableSearch: false,
  enableTabs: false,
  enableSort: true,
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
