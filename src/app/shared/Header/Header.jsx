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
  console.log("Notification Count Data:", data, notificationList);
  const markSeen = async () => {
    await executeApi({
      url: "/Notification/mark-seen",
      method: "POST",
      payload: {
        sessionId: user.sessionId,
      },
    });
  }
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

  const handleLogout = async () => {
    // const user = readUserFromSession();

    await executeApi({
      url: "/Login/logout",
      method: "POST",
      payload: {
        sessionId: user.sessionId,
      },
    });
    logoutUser();
    // navigate("/");
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
  return (
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
        <div
          className="relative cursor-pointer"
          // onClick={() => navigate("/notifications")}
        >
          <IoNotificationsOutline
            size={24}
            onClick={() => setShowNotifications(!showNotifications)}
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
        </div>
        {showNotifications && (
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
  );
};

export default Header;

//anbu

// const Header = ({ toggleMobileMenu }) => {
//   const navigate = useNavigate();
//   const user = readUserFromSession();

//   const UserName = user?.name || "Test";
//   const [dropdownVisible, setDropdownVisible] = useState(false);

//   const handleIconClick = () => {
//     setDropdownVisible((prev) => !prev);
//   };

//   const handleLogout = () => {
//     logoutUser();
//     navigate("/");
//   };

//   const firstLetter = UserName.charAt(0).toUpperCase();

//   return (
//     <header className="header py-4 px-8 flex justify-between items-center w-full bg-white shadow-sm">
//       {/* Left Side: Menu & Logo */}
//       <div className="flex gap-4 items-center">
//         <button
//           className="menu-toggle block p-0 bg-transparent border-none focus:outline-none"
//           onClick={toggleMobileMenu}
//         >
//           <IoMenu size={24} color="black" />
//         </button>

//         <div className="flex justify-center">
//           <img
//             src={workglowlogo}
//             alt="Logo"
//             className="inline-block align-top w-[100px]"
//           />
//         </div>
//       </div>

//       {/* Right Side: Breadcrumbs & User Profile */}
//       <div className="flex items-center gap-4">
//         <Breadcrumbs />

//         {/* Dropdown Container (Needs 'relative' for absolute positioning of the menu) */}
//         <div className="relative">
//           <div
//             className="userheader flex items-center cursor-pointer"
//             onClick={handleIconClick}
//           >
//             {/* Avatar Circle */}
//             <div className="avatar-circle flex justify-center items-center w-10 h-10 rounded-full bg-gray-200 text-gray-700 font-semibold select-none">
//               {firstLetter}
//             </div>
//           </div>

//           {/* Dropdown Menu */}
//           {dropdownVisible && (
//             <div className="dropdown-menu-custom absolute right-0 mt-3 p-4 shadow-md border border-gray-100 bg-white rounded-md min-w-[150px] z-50">
//               <div className="text-center mb-3">
//                 <strong className="text-gray-800">{UserName}</strong>
//               </div>
//               <button
//                 className="logout-btn w-full mt-2 text-center rounded bg-red-500 hover:bg-red-600 text-white py-2 px-4 transition-colors"
//                 onClick={handleLogout}
//               >
//                 Logout
//               </button>
//             </div>
//           )}
//         </div>
//       </div>
//     </header>
//   );
// };

// export default Header;
