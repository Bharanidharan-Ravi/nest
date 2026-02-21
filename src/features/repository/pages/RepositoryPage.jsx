import { useNavigate, useParams } from "react-router-dom";
import { useMasterData } from "../../../core/master/useMasterData";
import { ListProvider } from "../../../packages/ui-List/components/ListProvider";
import { repoListConfig, RepoUIConfig } from "../config/RepoUI.config";
import { ListLayout } from "../../../packages/ui-List/components/ListLayout";

export default function RepositoryPage() {
  // const { data, isLoading } = useRepoMaster();
  const { data, isLoading } = useMasterData();
  const navigate = useNavigate();
  const normalizeRepo = (repo) => ({
    id: repo.Repo_Id,
    title: repo.Title,
    key: repo.RepoKey,
    status: repo.Status,
    owner: repo.OwnerName,
    users: repo.RepoUserList ? JSON.parse(repo.RepoUserList) : [],
    createdAt: repo.CreatedAt,
  });
  const repos = data?.RepoList?.map(normalizeRepo) || [];
 return (
    // 1. Make this page a flex column that fills 100% of the height
    <div className="flex flex-col h-full pb-2">
      
      {/* 2. Top section (Title and Button) stays fixed */}
      <div className="flex justify-between items-center mb-3 flex-none">
        <h2 className="text-2xl font-semibold m-0">Repository</h2>
        <button 
          onClick={() => navigate("/repository/create")}
          className="bg-brand-yellow text-white px-4 py-2 rounded-md font-medium hover:bg-yellow-500 transition-colors"
        >
          Create New Repository
        </button>
      </div>

      {/* 3. The List container takes up all remaining vertical space */}
      {/* Note: min-h-0 is a crucial CSS trick to stop flex children from overflowing! */}
      <div className="flex-1 min-h-0">
        <ListProvider config={repoListConfig} data={repos}>
          <ListLayout />
        </ListProvider>
      </div>
    </div>
  );
}
