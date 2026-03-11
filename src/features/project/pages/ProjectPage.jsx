/**
 * src/features/project/pages/ProjectPage.jsx
 *
 * Uses goTo(key, params) — no hardcoded navigate('/projects/...') calls.
 * Works for both standalone /projects view and repo-scoped /repository/:repoId/p view.
 */

import { useParams } from "react-router-dom";
import { ListProvider } from "../../../packages/ui-List/components/ListProvider";
import { ListLayout } from "../../../packages/ui-List/components/ListLayout";
import { ProjUIConfig } from "../config/ProjectUI.config";
import { useMasterData } from "../../../core/master/useMasterData";
import { useProjectData } from "../hooks/useProjectData";
import { useSmartNavigation } from "../../../core/navigation/useSmartNavigation";
import { ROUTE_KEYS } from "../../../core/routing/paths";

const ProjectPage = () => {
  const { repoId } = useParams();
  const { data } = useMasterData();
  const { data: projects } = useProjectData(repoId);
  const { goTo } = useSmartNavigation();

  const scopedProjects = Array.isArray(projects)
    ? projects
    : Array.isArray(projects?.ProjectList?.Data)
      ? projects.ProjectList.Data
      : [];

  const rawList = repoId ? scopedProjects : data?.ProjectList;
  const editRouteKey = repoId
    ? ROUTE_KEYS.REPO_PROJ_EDIT
    : ROUTE_KEYS.PROJ_EDIT;

  const normalizeProj = (proj) => ({
    id: proj.Id,
    title: proj.Project_Name,
    key: proj.ProjectKey,
    status: proj.Status,
    owner: proj.EmployeeName,
    createdAt: proj.CreatedAt,
    CreatedBy: proj.CreatedBy,
    repoId: proj.Repo_Id,
    repoName: proj.Repo_Name,
    repoKey: proj.RepoKey,
    UpdatedAt: proj.UpdatedAt,
    UpdatedBy: proj.UpdatedBy,
  });

  const repos = rawList?.map(normalizeProj) || [];

  const employeeFilterOptions = [
    { label: "All Employees", value: "" },
    ...(data?.EmployeeList?.map((user) => ({
      label: user.UserName,
      value: user.UserName,
    })) || []),
  ];

  const repoFilterOptions = [
    { label: "All Repositories", value: "" },
    ...(data?.RepoList?.map((repo) => ({
      label: repo.Title,
      value: repo.Repo_Id,
    })) || []),
  ];
console.log("ProjectPage repos:", repos);
  // Determine create route key based on context (inside repo vs standalone)
  const createRouteKey = repoId
    ? ROUTE_KEYS.REPO_PROJ_CREATE
    : ROUTE_KEYS.PROJ_CREATE;

  // const detailRouteKey = repoId
  //   ? ROUTE_KEYS.REPO_PROJ_LIST // no individual proj detail from repo context yet
  //   : ROUTE_KEYS.PROJ_DETAIL;

  const listConfigWithNav = {
    ...ProjUIConfig,
    filters: [
      ...(!repoId
        ? [{ key: "repoId", view: "Repo", options: repoFilterOptions }]
        : []),
      { key: "owner", view: "Emp", options: employeeFilterOptions },
    ],
    onSelectionChange: (item, isChecked) => {
      console.log(
        `Item ${item.id} is now ${isChecked ? "selected" : "unselected"}`,
      );
    },
    onEditClick: (item) => {
      goTo(editRouteKey, { projId: item.id });
    },
    onItemClick: (item) => {
      goTo(ROUTE_KEYS.PROJ_DETAIL, {
        projId: item.id,
      });
    },
  };

  return (
    <>
      {!repoId && (
        <div className="flex justify-between items-center mb-3 flex-none">
          <h2>Projects</h2>

          <button
            onClick={() => goTo(createRouteKey)}
            className="bg-brand-yellow text-white px-4 py-2 rounded-md font-medium hover:bg-yellow-500 transition-colors"
          >
            Create New Project
          </button>
        </div>
      )}

      <div className="flex-1 min-h-0">
        <ListProvider config={listConfigWithNav} data={repos}>
          <ListLayout />
        </ListProvider>
      </div>
    </>
  );
};

export default ProjectPage;

// import { useNavigate, useParams } from "react-router-dom";
// import { ListProvider } from "../../../packages/ui-List/components/ListProvider";
// import { ListLayout } from "../../../packages/ui-List/components/ListLayout";
// import { ProjUIConfig } from "../config/ProjectUI.config";
// import { useMasterData } from "../../../core/master/useMasterData";
// import { useProjectData } from "../hooks/useProjectData";

// const ProjectPage = () => {
//   const navigate = useNavigate();
//   const { repoId } = useParams();
//   const { data } = useMasterData();
//   const { data: projects } = useProjectData(repoId);

//   const scopedProjects = Array.isArray(projects)
//     ? projects
//     : Array.isArray(projects?.ProjectList?.Data)
//       ? projects.ProjectList.Data
//       : [];

//   const rawList = repoId ? scopedProjects : data?.ProjectList;

//   const normalizeProj = (proj) => ({
//     id: proj.Id,
//     title: proj.Project_Name,
//     key: proj.ProjectKey,
//     status: proj.Status,
//     owner: proj.EmployeeName,
//     createdAt: proj.CreatedAt,
//     CreatedBy: proj.CreatedBy,
//     repoId: proj.Repo_Id,
//     repoName: proj.Repo_Name,
//     repoKey: proj.RepoKey,
//     UpdatedAt: proj.UpdatedAt,
//     UpdatedBy: proj.UpdatedBy,
//   });

//   const repos = rawList?.map(normalizeProj) || [];

//   const employeeFilterOptions = [
//     { label: "All Employees", value: "" },
//     ...(data?.EmployeeList?.map((user) => ({
//       label: user.UserName,
//       value: user.UserName, // We use UserName because 'owner' contains the name
//     })) || []),
//   ];

//   const repoFilterOptions = [
//     { label: "All Repositories", value: "" },
//     ...(data?.RepoList?.map((repo) => ({
//       label: repo.Title, // What the user sees in the dropdown
//       value: repo.Repo_Id, // What the system uses to filter the cards
//     })) || []),
//   ];

//   const listConfigWithNav = {
//     ...ProjUIConfig,
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
//         key: "owner", // 👈 MUST match the 'owner' key in normalizeProj
//         view: "Emp",
//         options: employeeFilterOptions,
//       },
//     ],
//     onSelectionChange: (item, isChecked) => {
//       console.log(
//         `Item ${item.id} is now ${isChecked ? "selected" : "unselected"}`,
//       );
//       // Update your selectedIds state here
//     },
//     onEditClick: (item) => {
//       console.log(`Triggering edit modal for ${item.id}`);
//       // Open edit modal or navigate to edit route here
//     },
//     onItemClick: (item) => {
//       // Navigate exactly where you need to go using the item's ID
//       navigate(`/projects/${item.id}`);
//     },
//   };

//   return (
//     <>
//       <div className="flex justify-between items-center mb-3 flex-none">
//         <h2>Projects</h2>
//         <button
//           onClick={() => navigate("create")}
//           className="bg-brand-yellow text-white px-4 py-2 rounded-md font-medium hover:bg-yellow-500 transition-colors"
//         >
//           Create New Repository
//         </button>
//       </div>

//       <div className="flex-1 min-h-0">
//         <ListProvider config={listConfigWithNav} data={repos}>
//           <ListLayout className="h-50" />
//         </ListProvider>
//       </div>
//     </>
//   );
// };
// export default ProjectPage;
