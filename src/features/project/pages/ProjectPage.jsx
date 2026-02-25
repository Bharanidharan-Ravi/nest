import { useNavigate, useParams } from "react-router-dom";
import { ListProvider } from "../../../packages/ui-List/components/ListProvider";
import { ListLayout } from "../../../packages/ui-List/components/ListLayout";
import { ProjUIConfig } from "../config/ProjectUI.config";
import { useMasterData } from "../../../core/master/useMasterData";
import { useProjectData } from "../hooks/useProjectData";

const ProjectPage = () => {
  const navigate = useNavigate();
  const { repoId } = useParams();
  const { data } = useMasterData();
  const { data: projects } = useProjectData(repoId);

  const rawList = repoId ? projects?.ProjectList?.Data : data?.ProjectList;
  console.log("rawList :", rawList, projects?.ProjectList.Data, data);

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
    UpdatedAt: proj.UpdatedAt,
    UpdatedBy: proj.UpdatedBy,
  });
  const repos = rawList?.map(normalizeProj) || [];

  const employeeFilterOptions = [
    { label: "All Employees", value: "" },
    ...(data?.EmployeeList?.map((user) => ({
      label: user.UserName,
      value: user.UserName, // We use UserName because 'owner' contains the name
    })) || []),
  ];
  const repoFilterOptions = [
    { label: "All Repositories", value: "" },
    ...(data?.RepoList?.map((repo) => ({
      label: repo.Title, // What the user sees in the dropdown
      value: repo.Repo_Id, // What the system uses to filter the cards
    })) || []),
  ];
  const listConfigWithNav = {
    ...ProjUIConfig,
    filters: [
      ...(!repoId ? [{
        key: "repoId", 
        options: repoFilterOptions,
      }] : []),
      {
        key: "owner", // 👈 MUST match the 'owner' key in normalizeProj
        options: employeeFilterOptions,
      },
    ],
    onItemClick: (item) => {
      // Navigate exactly where you need to go using the item's ID
      navigate(`/projects/${item.id}`);
    },
  };
  return (
    <>
      <div className="flex justify-between items-center mb-3 flex-none">
        <h2>Projects</h2>
        <button
          onClick={() => navigate("create")}
          className="bg-brand-yellow text-white px-4 py-2 rounded-md font-medium hover:bg-yellow-500 transition-colors"
        >
          Create New Repository
        </button>
      </div>

      <div className="flex-1 min-h-0">
        <ListProvider config={listConfigWithNav} data={repos}>
          <ListLayout />
        </ListProvider>
      </div>
    </>
  );
};
export default ProjectPage;
