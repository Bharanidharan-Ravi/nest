import React, { useState } from "react";
import { IoMenu } from "react-icons/io5";
import { useLocation, useNavigate } from "react-router-dom";
import "./Header.css";
import { Breadcrumbs } from "../../../core/navigation/Breadcrumbs";
import workglowlogo from "../../../assets/WORKGLOWLOGO.png";
import { logoutUser } from "../../../core/auth/authUtils";
import { readUserFromSession } from "../../../core/auth/useCurrentUser";
import { useRef } from "react";
import { useEffect } from "react";




const Header = ({ toggleMobileMenu }) => {
  const navigate = useNavigate();
  const user = readUserFromSession();

  const location = useLocation();

  const dropdownRef = useRef(null);
  const UserName = user?.name || "Test";
  const Avatar = user?.PreviewUrl || "";
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const handleIconClick = () => {
    setDropdownVisible((prev) => !prev);
  };

  const handleLogout = () => {
    logoutUser();
    navigate("/");

  };

  const handleLogoClick = () => {
    if (location.pathname !== "/dashboard") {
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
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
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

      {/* Right Side: Breadcrumbs & User Profile */}
      <div className="flex items-center gap-4">
        <Breadcrumbs />

        {/* Dropdown Container (Needs 'relative' for absolute positioning of the menu) */}
        <div className="relative" ref={dropdownRef}>
          <div
            className="userheader flex items-center cursor-pointer"
            onClick={handleIconClick}
          >
            {/* Avatar Circle */}
            <div className="avatar-circle flex justify-center items-center w-10 h-10 rounded-full bg-gray-200 text-gray-700 font-semibold select-none">
              {Avatar ? (
                <img src={Avatar} alt="User Avatar" className="w-full h-full object-cover rounded-full" />
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
