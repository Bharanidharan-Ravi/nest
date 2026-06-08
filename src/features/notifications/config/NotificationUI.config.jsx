import React from "react";
import NotificationListCard from "../component/NotificationListCard";
import TimelineListCard from "../component/TimelineListCard";

export const NotificationListConfig = (isViewer = false) => ({
  defaultView: "card",
  enableSearch: true,
  searchFields: ["title", "message"], // Allows user to search notifications
  enableTabs: false,
  enableSort: false,
  infinite: true,
  pageSize: 20,
  cardRenderer: (item) => <NotificationListCard item={item} />,
});

export const TimelineListConfig = {
  defaultView: "card",
  enableSearch: true,
  searchFields: ["title", "message"],
  enableTabs: false,
  enableSort: false,
  infinite: true,
  pageSize: 20,
  // If your Timeline uses a different card design, replace this with <TimelineListCard />
  cardRenderer: (item) => <TimelineListCard item={item} />,
};
