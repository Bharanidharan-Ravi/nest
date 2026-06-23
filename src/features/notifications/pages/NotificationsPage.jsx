import React from "react";
import { useQuery } from "@tanstack/react-query";
import { executeApi } from "../../../core/api/executor";
import { readUserFromSession, useCurrentUser } from "../../../core/auth/useCurrentUser";
import ModuleSwitcher from "../../dashboard/component/ModuleSwitcher";
import {
  NotificationListConfig,
  TimelineListConfig,
} from "../config/NotificationUI.config";
import { normalizeNotificationList } from "../../../app/shared/utils/normalizer";
import { useSmartNavigation } from "../../../core/navigation/useSmartNavigation";
import { ROUTE_KEYS } from "../../../core/routing/paths";
import { getNotification, getTimeline } from "../../../app/Hooks/useNotificationCount";
import { useSearchParams } from "react-router-dom";

export default function NotificationsPage() {
   const [searchParams, setSearchParams] = useSearchParams();
  const user = readUserFromSession();
  const { goTo } = useSmartNavigation();
  const { isViewer } = useCurrentUser();
  const currentModule = searchParams.get("module");
  // 1. Fetch Notifications
  const { data: notificationsData, isLoading: isLoadingNotifs } = getNotification()
  const { data: timelineData, isLoading: isLoadingTimeline } = getTimeline(
    currentModule === "timeline"
  );
  // 2. Fetch Timeline (Adjust URL to your actual Timeline endpoint)
  // const { data: timelineData, isLoading: isLoadingTimeline } = useQuery({
  //   queryKey: ["timeline", "list"],
  //   // queryFn: async () => {
  //   //   const response = await executeApi({
  //   //     url: "/Timeline/list", // Replace with actual API endpoint
  //   //     method: "GET",
  //   //   });
  //   //   return response?.data || response || [];
  //   // },
  //   enabled: !!user?.userId,
  // });
  
  const listConfigWithNav = {
    ...NotificationListConfig(isViewer),
    onItemClick: (item) => {
      const createRouteKey = ROUTE_KEYS.TICKET_DETAIL;
      goTo(createRouteKey, { ticketId: item.entityId });
    },
  };
  // 3. Define the Modules for the Switcher
 const notificationModules = [
    {
      id: "notifications",
      label: "Notifications",
      config: listConfigWithNav,
      data: notificationsData || [],
    },
    // 🔥 CONDITIONALLY ADD TIMELINE:
    !isViewer && {
      id: "timeline",
      label: "Timeline",
      config: TimelineListConfig,
      data: timelineData || [],
    },
  ].filter(Boolean);

  if (isLoadingNotifs || isLoadingTimeline) {
    return <div className="p-8 text-center text-gray-500">Loading data...</div>;
  }

  return (
    <div className="notifications-dashboard-container p-4 h-full flex flex-col max-w-5xl mx-auto w-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 px-2">
        Activity Hub
      </h2>

      {/* 4. Render the Switcher (with hideCreateAction = true) */}
      {/* <div className="flex-1 min-h-0 bg-white p-4 rounded-lg shadow-sm border border-gray-100"> */}
        <ModuleSwitcher
          modules={notificationModules}
          hideCreateAction={true} // Hides the "Create Ticket" button
        />
      {/* </div> */}
    </div>
  );
}
