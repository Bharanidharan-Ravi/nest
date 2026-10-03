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



import { useState, useMemo } from "react";
import { getInitials } from "../../../app/shared/utilities/utilities";
import { Modal, Box, IconButton } from "@mui/material";
import { FiX } from "react-icons/fi";
import { presenceDotClass } from "../../messenger/hooks/useUserStatus";
import { useAvatarData, useAvatarDataSource } from "./avatarData";

// Id / name → row indexes, built once per list and shared by every avatar.
// A card list renders hundreds of avatars, and scanning (and JSON-parsing the
// repo user lists) per avatar made those lists slow to render.
const lower = (v) => String(v).toLowerCase();
const indexCache = new WeakMap();
const getIndex = (list, build) => {
    let index = indexCache.get(list);
    if (!index) {
        index = build(list);
        indexCache.set(list, index);
    }
    return index;
};
const addFirst = (map, key, row) => {
    if (key && !map.has(lower(key))) map.set(lower(key), row);
};

const buildEmployeeIndex = (employees) => {
    const byId = new Map();
    const byName = new Map();
    employees.forEach((e) => {
        addFirst(byId, e.UserID, e);
        addFirst(byName, e.UserName, e);
    });
    return { byId, byName };
};

// Client users listed on the repos (RepoUserList: JSON string or array)
const buildRepoUserIndex = (repos) => {
    const byId = new Map();
    const byName = new Map();
    repos.forEach((repo) => {
        if (!repo.RepoUserList) return;
        let users = repo.RepoUserList;
        if (typeof users === "string") {
            try {
                users = JSON.parse(users);
            } catch {
                return;
            }
        }
        if (!Array.isArray(users)) return;
        users.forEach((u) => {
            addFirst(byId, u.UserId, u);
            addFirst(byName, u.UserName, u);
        });
    });
    return { byId, byName };
};

// Match by id, then by name
const findIn = (index, userId, name) =>
    (userId && index.byId.get(lower(userId))) ||
    (name && index.byName.get(lower(name))) ||
    null;

// Shared data from AvatarDataProvider (MainLayout); outside it, the avatar
// subscribes on its own.
const SmartAvatar = (props) => {
    const shared = useAvatarData();
    return shared ? <AvatarView {...props} data={shared} /> : <StandaloneAvatar {...props} />;
};

const StandaloneAvatar = (props) => <AvatarView {...props} data={useAvatarDataSource()} />;

const AvatarView = ({ userId, name, className = "w-8 h-8", extraClasses = "", data }) => {
    const [open, setOpen] = useState(false);
    // Same EmployeeList rows as the preloaded master data (kept current by realtime),
    // so avatars don't each start their own EmployeeList request
    const empData = data.employees;

    const employee = empData ? findIn(getIndex(empData, buildEmployeeIndex), userId, name) : null;

    // const avatarPath = employee?.PreviewUrl;
    const displayName=name||employee?.Employeename
    ||employee?.UserName
    ||"Unknown"

    const {avatarPath, email} = useMemo(() =>{
        if (employee) {
            return {avatarPath: employee.PreviewUrl, email: employee.Email};
        }

        const repos = data.getRepos();
        if (Array.isArray(repos) && repos.length > 0) {
            const client = findIn(getIndex(repos, buildRepoUserIndex), userId, name);
            if (client) {
                return {avatarPath: client.avatarPath || null, email: client.MailId};
            }
        }

        return {avatarPath:null, email:null};
    }, [userId, name, employee, data]);
    // const employee = empData?.find((e) => {
    //     if (userId && e.UserID)
    //         return e.UserID.toLowerCase() === userId.toLowerCase();
    //     if (name && e.UserName)
    //         return e.UserName.toLowerCase() === name.toLowerCase();
    //     return false;
    // });

    // const avatarPath = employee?.PreviewUrl;

    const presence = data.presenceLookup(userId || employee?.EmployeeID || employee?.UserID);

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
                    <div className="relative inline-block" title={[displayName, presence?.label].filter(Boolean).join("\n")}>
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
                    {presence && (
                        <span className={[
                            "absolute bottom-0 right-0",
                            "w-3 h-3 rounded-full",
                            "border-2 border-white",
                            presenceDotClass(presence)
                        ].join(" ")}/>
                    )}
                    </div>
                </span>
            {/* Profile Popup */}
            {/* Profile Popup */}
            {/* Mounted only while open: hundreds of avatars in a list */}
            {open && <Modal
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
                            {email && email !== "string" && (
                                <p className="text-xs text-blue-500 mt-1">Email: {email}</p>
                            )}
                        </div>
                    </div>
                </Box>
            </Modal>}
        </>
    );
};

export default SmartAvatar;






















