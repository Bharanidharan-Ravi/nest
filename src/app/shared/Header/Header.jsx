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
} from "lucide-react";
import { handleLogout } from "../../Hooks/Logout";
import { useSmartNavigation } from "../../../core/navigation/useSmartNavigation";
import { ROUTE_KEYS } from "../../../core/routing/paths";
import dayjs, { Dayjs } from "dayjs";
import { useQueryClient } from "@tanstack/react-query";
import relativeTime from "dayjs/plugin/relativeTime";

// 🔥 THIS IS THE MISSING PART
dayjs.extend(relativeTime);

const Header = ({ toggleMobileMenu }) => {
  const navigate = useNavigate();
  const user = readUserFromSession();
  const { isViewer } = useCurrentUser();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);
  const UserName = user?.name || "Test";
  const Avatar = user?.PreviewUrl || "";
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const { data } = useNotificationCount();
  const { data: notificationList } = getNotification(showNotifications);
  const notificationRef = useRef(null);
  const { goTo } = useSmartNavigation();
  const queryClient = useQueryClient();
  const { data: bannerListWrapper } = useBannerMessage();
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
  const activeBanners = Array.isArray(bannerListWrapper)
    ? bannerListWrapper.filter((b) => b.Status === "Active")
    : [];
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
  console.log("banner", activeBanners);
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
          )}
          {/* )} */}
          {/* {showNotifications && (
          <div
            className="
            absolute
            right-0
            top-12
            w-96
            bg-white
            shadow-lg
            rounded-lg
            z-50
            max-h-[500px]
            overflow-auto"
          >
            {notificationList?.map((item) => (
              <div
                key={item.NotificationId}
                className="
                      p-3
                      border-b
                      cursor-pointer"
              >
                <div className="font-semibold">{item.Title}</div>

                <div
                  className="
                  text-sm
                  text-gray-600"
                >
                  {item.Message}
                </div>
              </div>
            ))}
          </div>
        )} */}
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
        <div className="running-banner">
          <div className="running-banner-content">
            {
              // Filter banners: only show if EndDate >= current date
              activeBanners.filter((banner) => dayjs(banner.EndDate) >= dayjs())
                .length > 0 &&
                [
                  ...activeBanners.filter(
                    (banner) => dayjs(banner.EndDate) >= dayjs(),
                  ),
                  ...activeBanners.filter(
                    (banner) => dayjs(banner.EndDate) >= dayjs(),
                  ),
                  ...activeBanners.filter(
                    (banner) => dayjs(banner.EndDate) >= dayjs(),
                  ),
                  ...activeBanners.filter(
                    (banner) => dayjs(banner.EndDate) >= dayjs(),
                  ),
                ].map((banner, i) => (
                  <span key={i} className="running-banner-item">
                    {/* Replace <i> tag with React icon */}
                    <span className="mr-2 inline-block">
                      {getBannerIcon(banner.IconClass, banner.ColorCode)}
                    </span>
                    <span className="text-gray-700 font-semibold mr-1">
                      {banner.Type_Name}:
                    </span>
                    <span className="text-gray-600">{banner.MessageText}</span>
                  </span>
                ))
            }
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
