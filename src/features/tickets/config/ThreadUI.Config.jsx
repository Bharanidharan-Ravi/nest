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
  pageSize: 10,
  enableSearch: false,
  enableTabs: false,
  enableSort: false,
  // enableEdit:true,
  hideTabs: true,
  // defaultSort: {
  //   field: "updatedAt", // default field
  //   order: "desc", // default newest
  // },

  theme: {
    layout: "h-auto",
  },
  cardRenderer: (item) => <ThreadListCard item={item} />,
};
