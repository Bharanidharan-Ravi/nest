import ThreadListCard from "../component/ThreadListCard/ThreadListCard";
import ThreadParent from "../component/ThreadParent/ThreadParent";

export const ThreadParentConfig = {
  defaultView: "card",
  pageSize:10,
  enableSearch: false,
  enableTabs: false, // 👈 required
  enableSort: false,
  hideTabs: true,
  // enableEdit:true,
  theme: {
    layout:"h-auto",
  },
  cardRenderer: (item) => {
    console.log("1233",item); // Log the item to the console
    return <ThreadParent item={item} />;
  },
};
  
  export const ThreadListConfig = {
    defaultView: "card",
    pageSize:10,
    enableSearch: false,
    enableTabs: false,
    enableSort: false,
    // enableEdit:true,
    hideTabs: true,
    theme: {
      layout:"h-auto",

    },
    cardRenderer: (item) =><ThreadListCard item ={item}/>
    ,
  };
  