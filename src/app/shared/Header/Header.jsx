import React, { useState } from "react";
import { IoMenu } from "react-icons/io5";
import { useLocation, useNavigate } from "react-router-dom";
import "./Header.css";
import { Breadcrumbs } from "../../../core/navigation/Breadcrumbs";
import workglowlogo from "../../../assets/WORKGLOWLOGO.png";
import { logoutUser } from "../../../core/auth/authUtils";
import {
  readUserFromSession,
  useCurrentUser,
} from "../../../core/auth/useCurrentUser";
import { useRef } from "react";
import { useEffect } from "react";
import { executeApi } from "../../../core/api/executor";
import { IoNotificationsOutline } from "react-icons/io5";
import {
  getNotification,
  useNotificationCount,
} from "../../Hooks/useNotificationCount";
import { useNotificationStore } from "../../../core/state/useNotificationStore";
import { useBannerMessage } from "../../../features/BannerMessage/hooks/useBannerdata";
import { banner } from "../../../features/BannerMessage/elements";
import {
  AlertTriangle,
  CheckCircle,
  Info,
  AlertCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { handleLogout } from "../../Hooks/Logout";
import { useSmartNavigation } from "../../../core/navigation/useSmartNavigation";
import { ROUTE_KEYS } from "../../../core/routing/paths";
import dayjs, { Dayjs } from "dayjs";
import { useQueryClient } from "@tanstack/react-query";
import relativeTime from "dayjs/plugin/relativeTime";
import { useMemo } from "react";
import { useGetStaleTicketData } from "./hook/GetStaleTickets.Api";
import { FiClock, FiFolder } from "react-icons/fi";
import { Tooltip } from "@mui/material";

// 🔥 THIS IS THE MISSING PART
dayjs.extend(relativeTime);

const Header = ({ toggleMobileMenu }) => {
  const navigate = useNavigate();
  const user = readUserFromSession();
  const { isViewer } = useCurrentUser();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);
  const [showStaleTickets, setShowStaleTickets] = useState(false)
  const staleTicketsRef = useRef(null)
  const UserName = user?.name || "Test";
  const Avatar = user?.PreviewUrl || "";

  const [dropdownVisible, setDropdownVisible] = useState(false);
  const { data } = useNotificationCount();
  const { data: notificationList } = getNotification(showNotifications);

  // const {data:statleTicketsData}=useGetStaleTicketData(user?.userId)
  // const staleTickets=statleTicketsData?.GetStaleTicketsForAssignee?.Data||[]
  // const staleCount=staleTickets.length;
  const { data: statleTicketsData } = useGetStaleTicketData(user?.userId);

  const staleTickets = statleTicketsData || [];

  const staleCount = staleTickets.length;

  const notificationRef = useRef(null);
  const { goTo } = useSmartNavigation();
  const queryClient = useQueryClient();
  const { data: bannerListWrapper } = useBannerMessage();
  const bannerContainerRef = useRef(null);
  const bannerTrackRef = useRef(null);

  const [repeatedBanners, setRepeatedBanners] = useState([]);
  const [animationDuration, setAnimationDuration] = useState(40);

  const markSeen = async () => {
    try {
      await executeApi({
        url: "/Notification/mark-seen",
        method: "POST",
        payload: { sessionId: user.sessionId },
      });

      // 🔥 FIX 4: Refresh React Query so it knows the count is now 0
      queryClient.invalidateQueries({ queryKey: ["notification"] });
    } catch (error) {
      console.error("Failed to mark notifications seen", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownVisible(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
      if (staleTicketsRef.current &&
        !staleTicketsRef.current.contains(event.target)
      ) {
        setShowStaleTickets(false)
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!showNotifications) return;

    markSeen();

    useNotificationStore.getState().reset();
  }, [showNotifications]);
  const setCount = useNotificationStore((s) => s.setCount);
  const count = useNotificationStore((s) => s.count);
  useEffect(() => {
    setCount(data ?? 0);
  }, [data, setCount]);
  const handleIconClick = () => {
    setDropdownVisible((prev) => !prev);
  };

  const handleLogoClick = () => {
    if (location.pathname !== "/dashboard" && isViewer) {
      navigate("/tickets");
    } else if (location.pathname !== "/dashboard") {
      navigate("/dashboard");
    }
  };

  const handleTicket = () => {
    if (location.pathname !== "/tickets") {
      navigate("/tickets");
    }
  };
  const handleProject = () => {
    if (location.pathname !== "projects") {
      navigate("projects");
    }
  };

  const handleViewAllNotifications = () => {
    goTo(ROUTE_KEYS.NOTIFICATIONS);
    setShowNotifications(false);
  };

  const handleViewAllStaleTickets = () => {
    setShowStaleTickets(false);
  };


  const firstLetter = UserName.charAt(0).toUpperCase();
  const Avatarimage = Avatar;
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const activeBanners = useMemo(() => {
    return Array.isArray(bannerListWrapper)
      ? bannerListWrapper.filter((b) => b.Status === "Active")
      : [];
  }, [bannerListWrapper]);
  // Add this function inside your component
  const getBannerIcon = (iconClass, colorCode) => {
    switch (iconClass) {
      case "ti-alert":
        return <AlertTriangle size={18} color={colorCode} />;
      case "ti-check":
        return <CheckCircle size={18} color={colorCode} />;
      case "ti-info-alt":
      case "ti-info-circle":
        return <Info size={18} color={colorCode} />;
      case "ti-exclamation-circle":
        return <AlertCircle size={18} color={colorCode} />;
      case "ti-times":
        return <XCircle size={18} color={colorCode} />;
      default:
        return <Info size={18} color={colorCode} />;
    }
  };
  const now = useMemo(() => dayjs(), []);

  const filteredBanners = useMemo(() => {
    return activeBanners.filter((banner) => dayjs(banner.EndDate).isAfter(now));
  }, [activeBanners, now]);

  useEffect(() => {
    if (!filteredBanners.length) {
      setRepeatedBanners([]);
      return;
    }

    const calculateTicker = () => {
      if (!bannerContainerRef.current || !bannerTrackRef.current) return;

      const containerWidth = bannerContainerRef.current.offsetWidth;

      const singleSetWidth = bannerTrackRef.current.scrollWidth;

      let copies = 2;

      while (singleSetWidth * copies < containerWidth * 2) {
        copies++;
      }

      const banners = [];

      for (let i = 0; i < copies; i++) {
        banners.push(...filteredBanners);
      }

      setRepeatedBanners((prev) => {
        if (prev.length === banners.length) {
          return prev;
        }

        return banners;
      });

      /*
      Constant speed:
      80 pixels per second
    */
      const totalDistance = singleSetWidth;

      // 40 pixels per second
      const duration = totalDistance / 50;

      // Never go below 45 seconds
      setAnimationDuration(Math.max(duration, 40));
    };

    calculateTicker();

    window.addEventListener("resize", calculateTicker);

    return () => {
      window.removeEventListener("resize", calculateTicker);
    };
  }, [filteredBanners]);

  const measurementItems =
    repeatedBanners.length > 0 ? repeatedBanners : filteredBanners;
  return (
    <>
      <header className="header py-4 px-8 flex justify-between items-center w-full bg-white shadow-sm">
        {/* Left Side: Menu & Logo */}
        <div className="flex gap-4 items-center">
          <button
            className="menu-toggle block p-0 bg-transparent border-none focus:outline-none"
            onClick={toggleMobileMenu}
          >
            <IoMenu size={24} color="black" />
          </button>

          <div className="flex justify-center" onClick={handleLogoClick}>
            <img
              src={workglowlogo}
              alt="Logo"
              className="inline-block align-top w-[100px]"
            />
          </div>
        </div>

        {!isViewer && (
          <div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={handleTicket}
                className="px-3 py-1 text-sm font-semibold text-ghText bg-ghBorder rounded-md transition-all hover:bg-ghBorderDark active:bg-ghBorderActive"
              >
                Tickets
              </button>

              <button
                onClick={handleProject}
                className="px-3 py-1 text-sm font-semibold text-ghText bg-ghBorder rounded-md transition-all hover:bg-ghBorderDark active:bg-ghBorderActive"
              >
                Projects
              </button>
            </div>
          </div>
        )}
        {/* Right Side: Breadcrumbs & User Profile */}
        <div className="flex items-center gap-4">
          <Breadcrumbs />
          {/* {!isViewer && ( */}
          {!isViewer && (
            <>
              <div className="relative cursor-pointer" ref={staleTicketsRef}>
                <Clock
                  size={24}
                  onClick={() => setShowStaleTickets((prev) => !prev)}
                />

                {staleCount > 0 && (
                  <span
                    className="
                  absolute
                  -top-2
                  -right-2
                  bg-red-500
                  text-white
                  text-xs
                  rounded-full
                  min-w-[18px]
                  h-[18px]
                  flex
                  items-center
                  justify-center
                  px-1
                "
                  >
                    {staleCount > 99 ? "99+" : staleCount}
                  </span>
                )}

                {showStaleTickets && (
                  <div
                    className="
                  absolute
                  right-0
                  top-12
                  w-[420px]
                  bg-white
                  rounded-xl
                  shadow-2xl
                  border
                  border-gray-200
                  z-50
                  overflow-hidden
                "
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
                      <h3 className="font-semibold text-sm">Stale Tickets</h3>

                      <span
                        className="
                      bg-blue-100
                      text-blue-600
                      text-[10px]
                      px-2
                      py-0.5
                      rounded-full
                    "
                      >
                        {staleCount || 0}
                      </span>
                    </div>

                    {/* Body */}
                    <div className="max-h-[300px] overflow-y-auto">
                      {staleTickets?.length > 0 ? (
                        staleTickets.map((item) => (
                          <div
                            key={item.Issue_Id}
                            className="
                          px-4
                          py-2.5
                          border-b
                          hover:bg-gray-50
                          cursor-pointer
                          transition
                        "
                            onClick={() => {
                              goTo(ROUTE_KEYS.TICKET_DETAIL, {
                                ticketId: item.Issue_Id,
                              });
                              setShowStaleTickets(false); // Close the dropdown after navigating
                            }}
                          >
                            <div className="flex flex-col gap-1 min-w-0">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-md">
                                  #{item.Issue_Code}
                                </span>

                                <h4 className="text-sm font-medium text-gray-900 truncate">
                                  {item.Title}
                                </h4>
                              </div>

                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <div className="flex items-center gap-1 min-w-0">
                                  {/* Repo */}
                                  <Tooltip title={item.Repo_Name} arrow>
                                    <span className="text-xs font-medium text-gray-700 uppercase">
                                      {item?.Repo_Name
                                        ?.split(" ")
                                        .map((w) => w[0]?.toUpperCase())
                                        .join("")}
                                    </span>
                                  </Tooltip>

                                  <span className="text-gray-400">•</span>

                                  {/* Project */}
                                  <Tooltip title={item.Proj_Name} arrow>
                                    <span className="text-xs text-gray-600 truncate max-w-[140px]">
                                      {item?.Proj_Name?.split(" ").length > 2
                                        ? item.Proj_Name.split(" ").slice(0, 2).join(" ") + "..."
                                        : item.Proj_Name}
                                    </span>
                                  </Tooltip>
                                </div>

                                <div className="flex items-center gap-1 text-amber-600 shrink-0">
                                  <FiClock className="w-3.5 h-3.5" />
                                  <span>{item.DaysSinceLastUpdate}days ago</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-gray-500">
                          No stale tickets
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>
              <div className="relative cursor-pointer" ref={notificationRef}>
                <IoNotificationsOutline
                  size={24}
                  onClick={() => setShowNotifications((prev) => !prev)}
                />

                {count > 0 && (
                  <span
                    className="
                  absolute
                  -top-2
                  -right-2
                  bg-red-500
                  text-white
                  text-xs
                  rounded-full
                  min-w-[18px]
                  h-[18px]
                  flex
                  items-center
                  justify-center
                  px-1
                "
                  >
                    {count > 99 ? "99+" : count}
                  </span>
                )}

                {showNotifications && (
                  <div
                    className="
                  absolute
                  right-0
                  top-12
                  w-[420px]
                  bg-white
                  rounded-xl
                  shadow-2xl
                  border
                  border-gray-200
                  z-50
                  overflow-hidden
                "
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
                      <h3 className="font-semibold text-sm">Notifications</h3>

                      <span
                        className="
                      bg-blue-100
                      text-blue-600
                      text-[10px]
                      px-2
                      py-0.5
                      rounded-full
                    "
                      >
                        {count || 0}
                      </span>
                    </div>

                    {/* Body */}
                    <div className="max-h-[300px] overflow-y-auto">
                      {notificationList?.length > 0 ? (
                        notificationList.map((item) => (
                          <div
                            key={item.id}
                            className="
                          px-4
                          py-2.5
                          border-b
                          hover:bg-gray-50
                          cursor-pointer
                          transition
                        "
                            onClick={() => {
                              goTo(ROUTE_KEYS.TICKET_DETAIL, {
                                ticketId: item.entityId,
                              });
                              setShowNotifications(false); // Close the dropdown after navigating
                            }}
                          >
                            <div className="font-medium text-sm text-gray-800 truncate">
                              {item.title}
                            </div>

                            <div className="text-xs text-gray-500 mt-1 truncate">
                              {item.message}
                            </div>

                            <span className="text-xs text-gray-400">
                              {dayjs(item?.createdAt).fromNow()}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-gray-500">
                          No notifications found
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div
                      className="
          border-t
          bg-gray-50
          p-3
        "
                    >
                      <button
                        onClick={handleViewAllNotifications}
                        className="
            w-full
            text-blue-600
            font-medium
            text-sm
            hover:text-blue-700
          "
                      >
                        View All Notifications →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Dropdown Container (Needs 'relative' for absolute positioning of the menu) */}
          <div className="relative" ref={dropdownRef}>
            <div
              className="userheader flex items-center cursor-pointer"
              onClick={handleIconClick}
            >
              {/* Avatar Circle */}
              <div className="avatar-circle flex justify-center items-center w-10 h-10 rounded-full bg-gray-200 text-gray-700 font-semibold select-none">
                {Avatar ? (
                  <img
                    src={Avatar}
                    alt="User Avatar"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  firstLetter
                )}
              </div>
            </div>

            {/* Dropdown Menu */}
            {dropdownVisible && (
              <div className="dropdown-menu-custom absolute right-0 mt-3 p-4 shadow-md border border-gray-100 bg-white rounded-md min-w-[150px] z-50">
                <div className="text-center mb-3">
                  <strong className="text-gray-800">{UserName}</strong>
                </div>
                <button
                  className="logout-btn w-full mt-2 text-center rounded bg-red-500 hover:bg-red-600 text-white py-2 px-4 transition-colors"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      {!isViewer && activeBanners.length > 0 && (
        <div className="running-banner" ref={bannerContainerRef}>
          <div
            className="running-banner-content"
            style={{
              animationDuration: `${animationDuration}s`,
            }}
          >
            {repeatedBanners.map((banner, i) => (
              <span key={i} className="running-banner-item">
                <span className="mr-2">
                  {getBannerIcon(banner.IconClass, banner.ColorCode)}
                </span>

                <span className="text-gray-700 font-semibold mr-1">
                  {banner.Type_Name}:
                </span>

                <span className="text-gray-600">{banner.MessageText}</span>
              </span>
            ))}
          </div>

          {/* Hidden measurement */}
          <div ref={bannerTrackRef} className="running-banner-measure">
            {measurementItems.map((banner, i) => (
              <span key={i} className="running-banner-item">
                <span className="mr-2">
                  {getBannerIcon(banner.IconClass, banner.ColorCode)}
                </span>

                <span className="text-gray-700 font-semibold mr-1">
                  {banner.Type_Name}:
                </span>

                <span className="text-gray-600">{banner.MessageText}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
