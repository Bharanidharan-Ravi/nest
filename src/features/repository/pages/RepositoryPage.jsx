import { useNavigate, useParams } from "react-router-dom"
import { useMasterData } from "../../../core/master/useMasterData";
import { ListCardView } from "../../../packages/ui-List/components/ListCardView";
import { ListFilters } from "../../../packages/ui-List/components/ListFilters";
import { ListPagination } from "../../../packages/ui-List/components/ListPagination";
import { ListProvider } from "../../../packages/ui-List/components/ListProvider";
import { ListTableView } from "../../../packages/ui-List/components/ListTableView";
import { ListToolbar } from "../../../packages/ui-List/components/ListToolbar";
import { useList } from "../../../packages/ui-List/context/ListContext";
import { RepoUIConfig } from "../config/RepoUI.config";
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
  // function TicketContent() {
  //   const { view } = useList()
  //   console.log(" view: ", view);

  //   return (
  //     <>
  //       <ListToolbar />
  //       <ListFilters />
  //       {view === "table" ? <ListTableView /> : <ListCardView />}
  //       <ListPagination />
  //     </>
  //   )
  // }
  // if (isLoading) return <p>Loading repo details...</p>

  return (
    <div>
      <h2>Repository</h2>
      <ListProvider config={RepoUIConfig} data={repos}>
        <ListLayout />
      </ListProvider>
      <button onClick={() => navigate("/repository/create")}>Create New Repository</button>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}

