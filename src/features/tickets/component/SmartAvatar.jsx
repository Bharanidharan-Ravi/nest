// import { getInitials } from "../../../app/shared/utilities/utilities"
// import { getEmployeeList } from "../../employee/hooks/useEmployeeList"

// const SmartAvatar = ({ userId, name, className = "w-8 h-8", extraClasses = "" }) => {
//     const { data: empData } = getEmployeeList()
//     const employee =empData?.find((e) =>{
//         if(userId && e.UserID){
//             return e.UserID.toLowerCase()===userId.toLowerCase()
//         }
//         if(name && e.UserName){
//             return e.UserName.toLowerCase()===name.toLowerCase()
//         }
//         return false
//     }
//     )
//     const avatarPath = employee?.PreviewUrl
//     return avatarPath ? (
//         <img
//             className={`${className} rounded-full object-cover border-2 border-white shadow-xs`}
//             src={avatarPath}
//             alt={name}
//         />
//     ) : (<div className={`${className} ${extraClasses}
//      rounded-full flex items-center justify-center text-xs font-semibold shadow-xs`}>
//         {getInitials(name || "?")}
//     </div>
//     )
// }

// export default SmartAvatar;




import { useState } from "react";
import { getInitials } from "../../../app/shared/utilities/utilities";
import { getEmployeeList } from "../../employee/hooks/useEmployeeList";
import { Tooltip, Modal, Box, IconButton } from "@mui/material";
import { FiX } from "react-icons/fi";
import { useCurrentUser } from "../../../core/auth/useCurrentUser";
import { fetUserStatus } from "../../Messenger/hooks/useUserStatus";
import { formateDateTime } from "../../../app/shared/utils/chattime";

const SmartAvatar = ({ userId, name, className = "w-8 h-8", extraClasses = "" }) => {
    const [open, setOpen] = useState(false);
    const { isViewer } = useCurrentUser();
    const { data: empData } = getEmployeeList(null,{enabled:!isViewer});
    const {data:statusList=[]}=fetUserStatus()

    const employee = empData?.find((e) => {
        if (userId && e.UserID)
            return e.UserID.toLowerCase() === userId.toLowerCase();
        if (name && e.UserName)
            return e.UserName.toLowerCase() === name.toLowerCase();
        return false;
    });

    const avatarPath = employee?.PreviewUrl;
    const displayName=name||employee?.Employeename
    ||employee?.UserName
    ||"Unknown"

    const statusMap=Object.fromEntries(statusList.map(s=>[s.EmployeeID?.toLowerCase(),s]))
const lookupId=userId||employee?.EmployeeID||employee?.UserID
    const status=lookupId?statusMap[lookupId?.toLowerCase()]:null
    const isOnline=status?.IsActive==true
    const statusTitle=isOnline
    ?`Online since ${formateDateTime(status?.LoginAt)}`
    :status?.LogoutAt
    ?`Last seen ${formateDateTime(status?.LogoutAt)}`
    :status?.LoginAt
    ?`Last login ${formateDateTime(status?.LoginAt)}`
    :"Offline"
   
    return (
        <>
            {/* Avatar with zoom + click */}
           
                <span
                    onClick={(e) =>{ e.stopPropagation(); setOpen(true)} }
                         
                    style={{
                        display: "inline-block",
                        transition: "transform 0.2s ease",
                        cursor: "pointer",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.3)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                    <div className="relative inline-block" title={[displayName,statusTitle].filter(Boolean).join("\n")}>
                    {avatarPath ? (
                        <img
                            className={`${className} rounded-full object-cover border-2 border-white shadow-xs`}
                            src={avatarPath}
                            alt={name}
                        />
                    ) : (
                        <div
                            className="avatar"
                        >
                            {getInitials(name || "?")}
                        </div>
                    )}
                    {status && (
                        <span className={[
                            "absolute bottom-0 right-0",
                            "w-3 h-3 rounded-full",
                            "border-2 border-white",
                            isOnline?"bg-green-500":"bg-red-400"
                        ].join(" ")}/>
                    )}
                    </div>
                </span>
            {/* Profile Popup */}
            {/* Profile Popup */}
            <Modal 
            open={open} 
            onClose={() => setOpen(false)}
            onClick={(e)=>e.stopPropagation()}
            sx={{zIndex:99999}}
                >
                <Box
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        bgcolor: "background.paper",
                        borderRadius: 3,
                        boxShadow: 24,
                        p: 3,
                        minWidth: 280,
                        outline: "none",
                        zIndex:99999,
                    }}
                >
                    <IconButton
                        onClick={() => setOpen(false)}
                        sx={{ position: "absolute", top: 8, right: 8 }}
                        size="small"
                    >
                        <FiX />
                    </IconButton>

                    <div className="flex flex-col items-center gap-3 pt-2">
                        {avatarPath ? (
                            <div
                                style={{
                                    width: 96,
                                    height: 96,
                                    borderRadius: "50%",
                                    overflow: "hidden",
                                    border: "3px solid #f3f4f6",
                                    boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
                                    background: "#f9fafb",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <img
                                    src={avatarPath}
                                    alt={name}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "contain",   // ← contain instead of cover — no crop, no stretch
                                        imageRendering: "auto", // ← browser picks best quality scaling
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold bg-gray-200 text-gray-600 shadow-md">
                                {getInitials(name || "?")}
                            </div>
                        )}

                        <div className="text-center">
                            <p className="font-semibold text-gray-800 text-base">Name: {name || "Unknown"}</p>
                            {/* {employee?.Role && (
                                <p className="text-xs text-gray-500 mt-0.5">{employee.Role}</p>
                            )}
                            {employee?.Team && (
                                <p className="text-xs text-gray-400">{employee.Team}</p>
                            )} */}
                            {employee?.Email && employee.Email !== "string" && (
                                <p className="text-xs text-blue-500 mt-1">Email: {employee.Email}</p>
                            )}
                        </div>
                    </div>
                </Box>
            </Modal>
        </>
    );
};

export default SmartAvatar;






















