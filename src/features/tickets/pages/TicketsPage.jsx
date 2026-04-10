// import { useNavigate, useParams } from "react-router-dom";
// import React from "react";
// import { useTicketMaster } from "../hooks/useTicketMaster";
// import "../css/ViewTickets.css";
// import { ListProvider } from "../../../packages/ui-List/components/ListProvider";
// import { ListLayout } from "../../../packages/ui-List/components/ListLayout";
// import { useMasterData } from "../../../core/master/useMasterData";
// import { TicketListConfig } from "../config/TicketUI.config";
// import { ROUTE_KEYS } from "../../../core/routing/paths";
// import { useSmartNavigation } from "../../../core/navigation/useSmartNavigation";
// import { useTicketKeyboardNavigation } from "../hooks/useTicketKeyboardNavigation";
// import ThreadListCard from "../component/ThreadListCard/ThreadListCard";
// import TicketListCard from "../component/TicketListCard";

// export default function TicketsPage() {
//   const { repoId, projId } = useParams();
//   const navigate = useNavigate();
//   const { data: Master } = useMasterData();
//   const activeProjectId = projId;
//   const { goTo } = useSmartNavigation();

//   const { data, isLoading } = useTicketMaster({
//     repoId: repoId ?? null,
//     projectId: activeProjectId ?? null,
//   });
//   const editRouteKey = projId
//     ? ROUTE_KEYS.PROJ_TICKET_EDIT
//     : ROUTE_KEYS.TICKET_EDIT;

//   const createRouteKey = repoId
//     ? ROUTE_KEYS.REPO_TICKET_CREATE
//     : projId
//       ? ROUTE_KEYS.PROJ_TICKET_CREATE
//       : ROUTE_KEYS.TICKET_CREATE;

//   const isRepoScoped = !!repoId;
//   const normalizeTicket = (ticket) => ({
//     id: ticket.Issue_Id,
//     title: ticket.Title,
//     ticketKey: ticket.Issue_Code,
//     statusId: ticket.StatusId,
//     description: ticket.HtmlDesc || ticket.Description,
//     assginedTo: ticket.Assignee_Id,
//     estimateHours: ticket.hours,
//     createdAt: ticket.CreatedAt,
//     updatedAt: ticket.UpdatedAt,
//     UpdatedBy: ticket.UpdatedBy,
//     repoId: ticket.RepoId,
//     dueDate: ticket.Due_Date,
//     project: ticket.Project_Id,
//     priority: ticket.Priority,
//     multiAssignees: ticket.All_Assignees
//       ? JSON.parse(ticket.All_Assignees)
//       : [],
//     RepoKey: ticket.RepoKey,
//     label: ticket.Labels_JSON ? JSON.parse(ticket.Labels_JSON) : [],
//     teamId: ticket.Assignee_TeamId,
//     teamName: ticket.Assignee_TeamName,
//     CompletionPct: ticket.CompletionPct,
//   });
//   const employeeFilterOptions = [
//     { label: "All Employees", value: "" },
//     ...(Master?.EmployeeList?.map((user) => ({
//       label: user.UserName,
//       value: user.UserID,
      
//     })) || []),
//   ];

//   const repoFilterOptions = [
//     { label: " Repositories", value: "" },
//     ...(Master?.RepoList?.map((repo) => ({
//       label: repo.Title, // What the user sees in the dropdown
//       value: repo.Repo_Id, // What the system uses to filter the cards
//     })) || []),
//   ];
//   const projectFilterOptions = [
//     { label: "Projects", value: "" },
//     ...(Master?.ProjectList?.map((prj) => ({
//       label: prj.Project_Name, // What the user sees in the dropdown
//       value: prj.Id, // What the system uses to filter the cards
//     })) || []),
//   ];

//   const LabelFilterOptions = [
//     { label: " Labels", value: "" },
//     ...(Master?.LabelMaster?.map((labels) => ({
//       label: labels.Title, // What the user sees in the dropdown
//       value: labels.Id, // What the system uses to filter the cards
//     })) || []),
//   ];

//   const teamFilterOptions = [
//     { label: "All Teams", value: "" },
//     ...Array.from(new Set(
//       data
//         ?.map(ticket => ticket.Assignee_TeamName)
//         .filter(team => team) // Remove null/undefined
//     ))
//     .map(teamName => ({
//       label: teamName,
//       value: teamName  // Filter by exact team name string
//     }))
//     .sort((a, b) => a.label.localeCompare(b.label)) || []
//   ];
  
  
//   const TicketList = data?.map(normalizeTicket) || [];

//   // const focusedIndex = useTicketKeyboardNavigation(
//   //   TicketList,
//   //   (item) => navigate(`${location.pathname}/${item.id}`),
//   //   (item) => goTo(editRouteKey, { ticketId: item.id, repoId, projId }),
//   // );
//   const listConfigWithNav = {
//     ...TicketListConfig,
//     filters: [
//       ...(!repoId
//         ? [
//             {
//               key: "repoId",
//               view: "Repo",
//               options: repoFilterOptions,
//             },
//           ]
//         : []),
//       {
//         key: "assginedTo",
//         view: "Assignee",
//         options: employeeFilterOptions,
//         filterType: "custom",
//         customFilter: (item, selectedValue) => {
//           if (!selectedValue) return true; // If nothing is selected, don't filter it out

//           // 1. Convert the selected dropdown value to lowercase safely
//           const safeSelected = String(selectedValue).toLowerCase();

//           // 2. Check primary assignee (also converted to lowercase)
//           // (Assuming item.assginedTo holds the Name or ID)
//           if (
//             item.assginedTo &&
//             String(item.assginedTo).toLowerCase() === safeSelected
//           ) {
//             return true;
//           }

//           // 3. Check multiAssignees array
//           if (Array.isArray(item.multiAssignees)) {
//             return item.multiAssignees.some((assignee) => {
//               // Convert both Name and Id to lowercase before comparing
//               const matchName =
//                 assignee.Assignee_Name &&
//                 String(assignee.Assignee_Name).toLowerCase() === safeSelected;
//               const matchId =
//                 assignee.Assignee_Id &&
//                 String(assignee.Assignee_Id).toLowerCase() === safeSelected;

//               return matchName || matchId;
//             });
//           }

//           return false; // No match found
//         },
//       },
//       {
//         key: "project", // 👈 MUST match the 'owner' key in normalizeProj
//         view: "Project",
//         options: projectFilterOptions,
//       },
//       {
//         key: "label", // 👈 MUST match the 'owner' key in normalizeProj
//         view: "Label",
//         options: LabelFilterOptions,
//         filterType: "array",
//         filterKey: "LABEL_ID", // Because label is an array of objects, we need to specify which key to filter on
//       },
//       {
//         key: "teamName",  // 👈 MUST match normalizeTicket key
//         view: "Team",
//         options: teamFilterOptions,
//       },
//     ],
//     cardRenderer: (item, controls) => (
//       <TicketListCard
//         item={item}
//         controls={controls}
//         // focused={index === focusedIndex}
//       />
//     ),
//     onItemClick: (item) => {
//       const createRouteKey = ROUTE_KEYS.TICKET_DETAIL;
//       goTo(createRouteKey, { ticketId: item.id });
//     },
//     onEditClick: (item) => {
//       goTo(editRouteKey, { ticketId: item.id, repoId, projId });
//     },
//   };

//   return (
//     <>
//       {/* <h3>{isRepoScoped ? `Tickets for Repo ${repoId}` : "All Tickets"}</h3> */}

//       {/* 🔥 Create Button */}
//       {/* <button onClick={handleCreate}>Create Ticket</button> */}
//       {!repoId && !projId && (
//         <div className="flex justify-between items-center mb-4 flex-none px-2">
//           <h2 className="text-2xl font-bold text-gray-800">Tickets</h2>

//           <button
//             onClick={() => goTo(createRouteKey, { repoId, projId })}
//             className="bg-brand-yellow text-white px-4 py-2 rounded-md font-medium hover:bg-yellow-500 transition-colors"
//           >
//             Create New Tickets
//           </button>
//         </div>
//       )}

//       {/* <div className="tickets-container container"> */}
//       <div className="w-full pb-10">
//         <ListProvider config={listConfigWithNav} data={TicketList}>
//           <ListLayout />
//         </ListProvider>
//       </div>
//       {/* </div> */}
//     </>
//   );
// }


// //anbu




import { useNavigate, useParams } from "react-router-dom";
import React from "react";
import { useTicketMaster } from "../hooks/useTicketMaster";
import "../css/ViewTickets.css";
import { ListProvider } from "../../../packages/ui-List/components/ListProvider";
import { ListLayout } from "../../../packages/ui-List/components/ListLayout";
import { useMasterData } from "../../../core/master/useMasterData";
import { TicketListConfig } from "../config/TicketUI.config";
import { ROUTE_KEYS } from "../../../core/routing/paths";
import { useSmartNavigation } from "../../../core/navigation/useSmartNavigation";
import { useTicketKeyboardNavigation } from "../hooks/useTicketKeyboardNavigation";
import ThreadListCard from "../component/ThreadListCard/ThreadListCard";
import TicketListCard from "../component/TicketListCard";
import { normalizeTicket } from "../../../app/shared/utils/ticketNormalizer";

export default function TicketsPage() {
  const { repoId, projId } = useParams();
  const navigate = useNavigate();
  const { data: Master } = useMasterData();
  const activeProjectId = projId;
  const { goTo } = useSmartNavigation();

  const { data, isLoading } = useTicketMaster({
    repoId: repoId ?? null,
    projectId: activeProjectId ?? null,
  });
  const editRouteKey = projId
    ? ROUTE_KEYS.PROJ_TICKET_EDIT
    : ROUTE_KEYS.TICKET_EDIT;

  const createRouteKey = repoId
    ? ROUTE_KEYS.REPO_TICKET_CREATE
    : projId
      ? ROUTE_KEYS.PROJ_TICKET_CREATE
      : ROUTE_KEYS.TICKET_CREATE;

  const isRepoScoped = !!repoId;
  // const normalizeTicket = (ticket) => ({
  //   id: ticket.Issue_Id,
  //   title: ticket.Title,
  //   ticketKey: ticket.Issue_Code,
  //   status: ticket.Status,
  //   statusId: ticket.StatusId,
  //   description: ticket.HtmlDesc || ticket.Description,
  //   assginedTo: ticket.Assignee_Id,
  //   estimateHours: ticket.hours,
  //   createdAt: ticket.CreatedAt,
  //   updatedAt: ticket.UpdatedAt,
  //   UpdatedBy: ticket.UpdatedBy,
  //   repoId: ticket.RepoId,
  //   dueDate: ticket.Due_Date,
  //   project: ticket.Project_Id,
  //   priority: ticket.Priority,
  //   multiAssignees: ticket.All_Assignees
  //     ? JSON.parse(ticket.All_Assignees)
  //     : [],
  //   RepoKey: ticket.RepoKey,
  //   label: ticket.Labels_JSON ? JSON.parse(ticket.Labels_JSON) : [],
  //   CompletionPct: ticket.CompletionPct,
  //   // 🆕 ADD TEAM FIELDS
  //   teamId: ticket.Assignee_TeamId,
  //   teamName: ticket.Assignee_TeamName,
  // });

  const employeeFilterOptions = [
    { label: "All Employees", value: "" },
    ...(Master?.EmployeeList
          ?.filter((user) => user.Status === "Active") // 👈 1. Filter first
          .map((user) => ({                            // 👈 2. Then map
            label: user.UserName,
            value: user.UserID,
          })) || []),
  ];
  

  const repoFilterOptions = [
    { label: " Repositories", value: "" },
    ...(Master?.RepoList?.map((repo) => ({
      label: repo.Title, // What the user sees in the dropdown
      value: repo.Repo_Id, // What the system uses to filter the cards
    })) || []),
  ];
  const projectFilterOptions = [
    { label: "Projects", value: "" },
    ...(Master?.ProjectList?.map((prj) => ({
      label: prj.Project_Name, // What the user sees in the dropdown
      value: prj.Id, // What the system uses to filter the cards
    })) || []),
  ];

  const LabelFilterOptions = [
    { label: " Labels", value: "" },
    ...(Master?.LabelMaster?.map((labels) => ({
      label: labels.Title, // What the user sees in the dropdown
      value: labels.Id, // What the system uses to filter the cards
    })) || []),
  ];
  // 🆕 ADD THIS - Team filter options
// const teamFilterOptions = [
//   { label: "All Teams", value: "" },
//   ...(Master?.EmployeeList?.map((emp) => ({
//     label: emp.TeamName || emp.Assignee_TeamName , // Adjust based on your master data structure
//     value: emp.TeamId || emp.Assignee_TeamId ,
//   })) || []),
// ];

// 🆕 CORRECT teamFilterOptions - Extract from TICKETS
const teamFilterOptions = [
  { label: "All Teams", value: "" },
  ...(Master?.TeamMaster?.map((team) => ({
    label: team.TeamName, // What the user sees in the dropdown
    value: team.TeamId, // What the system uses to filter the cards
  })) || []),
];
console.log("teamFilterOptions :", teamFilterOptions);

  const TicketList = data?.map(normalizeTicket) || [];

  // const focusedIndex = useTicketKeyboardNavigation(
  //   TicketList,
  //   (item) => navigate(`${location.pathname}/${item.id}`),
  //   (item) => goTo(editRouteKey, { ticketId: item.id, repoId, projId }),
  // );
  const listConfigWithNav = {
    ...TicketListConfig,
    filters: [
      ...(!repoId
        ? [
          {
            key: "repoId",
            view: "Repo",
            options: repoFilterOptions,
          },
        ]
        : []),
      {
        key: "assginedTo", // 👈 MUST match the 'owner' key in normalizeProj
        view: "Assignee",
        options: employeeFilterOptions,
      },
      {
        key: "project", // 👈 MUST match the 'owner' key in normalizeProj
        view: "Project",
        options: projectFilterOptions,
      },
      {
        key: "label", // 👈 MUST match the 'owner' key in normalizeProj
        view: "Label",
        options: LabelFilterOptions,
        filterType: "array",
        filterKey: "LABEL_ID", // Because label is an array of objects, we need to specify which key to filter on
      },
      {
        key: "teamId",  // 👈 MUST match normalizeTicket key
        view: "Team",
        options: teamFilterOptions,
      },
    ],
    cardRenderer: (item, controls) => (
      <TicketListCard
        item={item}
        controls={controls}
      // focused={index === focusedIndex}
      />
    ),
    onItemClick: (item) => {
      const createRouteKey = ROUTE_KEYS.TICKET_DETAIL;
      goTo(createRouteKey, { ticketId: item.id });
    },
    onEditClick: (item) => {
      goTo(editRouteKey, { ticketId: item.id, repoId, projId });
    },
  };

  return (
    <>
      {/* <h3>{isRepoScoped ? `Tickets for Repo ${repoId}` : "All Tickets"}</h3> */}

      {/* 🔥 Create Button */}
      {/* <button onClick={handleCreate}>Create Ticket</button> */}
      {!repoId && !projId && (
        <div className="flex justify-between items-center mb-4 flex-none px-2">
          <h2 className="text-2xl font-bold text-gray-800">Tickets</h2>

          <button
            onClick={() => goTo(createRouteKey, { repoId, projId })}
            className="bg-brand-yellow text-white px-4 py-2 rounded-md font-medium hover:bg-yellow-500 transition-colors"
          >
            Create New Tickets
          </button>
        </div>
      )}

      {/* <div className="tickets-container container"> */}
      <div className="w-full pb-10">
        <ListProvider config={listConfigWithNav} data={TicketList}>
          <ListLayout />
        </ListProvider>
      </div>
      {/* </div> */}
    </>
  );
}
