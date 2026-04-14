/**
 * src/features/repository/pages/RepositoryPage.jsx
 *
 * Uses goTo(key, params) — no hardcoded navigate('/repository/...') calls.
 */

import { useMasterData } from "../../../core/master/masterCall/useMasterData";
import { ListProvider } from "../../../packages/ui-List/components/ListProvider";
import { repoListConfig } from "../config/RepoUI.config";
import { ListLayout } from "../../../packages/ui-List/components/ListLayout";
import { useSmartNavigation } from "../../../core/navigation/useSmartNavigation";
import { ROUTE_KEYS } from "../../../core/routing/paths";
import { readUserFromSession } from "../../../core/auth/useCurrentUser";

export default function RepositoryPage() {
  const { data } = useMasterData();
  const { goTo } = useSmartNavigation();
  const user = readUserFromSession();
  const allowedUsers = ["bharanidharan", "dinesh", "poovannan"];
  const userName = user?.name?.toLowerCase() || "";
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

  const listConfigWithNav = {
    ...repoListConfig,
    onItemClick: (item) => {
      // repoId passed as extra param — hook fills in the full path
      goTo(ROUTE_KEYS.REPO_DETAIL, { repoId: item.id });
    },
  };

  return (
    <div className="flex flex-col h-full pb-2">
      <div className="flex justify-between items-center mb-3 flex-none">
        <h2 className="text-2xl font-semibold m-0">Repository</h2>
        {allowedUsers.includes(userName) && (
          <button
            onClick={() => goTo(ROUTE_KEYS.REPO_CREATE)}
            className="bg-brand-yellow text-white px-4 py-2 rounded-md font-medium hover:bg-yellow-500 transition-colors"
          >
            Create New Repository
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0">
        <ListProvider config={listConfigWithNav} data={repos}>
          <ListLayout />
        </ListProvider>
      </div>
    </div>
  );
}

// import { useNavigate } from "react-router-dom";
// import { useMasterData } from "../../../core/master/useMasterData";
// import { ListProvider } from "../../../packages/ui-List/components/ListProvider";
// import { repoListConfig } from "../config/RepoUI.config";
// import { ListLayout } from "../../../packages/ui-List/components/ListLayout";

// export default function RepositoryPage() {
//   // const { data, isLoading } = useRepoMaster();
//   const { data } = useMasterData();
//   const navigate = useNavigate();
//   const normalizeRepo = (repo) => ({
//     id: repo.Repo_Id,
//     title: repo.Title,
//     key: repo.RepoKey,
//     status: repo.Status,
//     owner: repo.OwnerName,
//     users: repo.RepoUserList ? JSON.parse(repo.RepoUserList) : [],
//     createdAt: repo.CreatedAt,
//   });
//   // const generateDummyRepos = (count = 1000) => {
//   //   return Array.from({ length: count }, (_, index) => {
//   //     const repo = {
//   //       Repo_Id: index + 1,
//   //       Title: `Repository ${index + 1}`,
//   //       RepoKey: `repo_key_${index + 1}`,
//   //       Status: index % 2 === 0 ? "Active" : "Inactive",
//   //       OwnerName: `Owner ${index % 10}`,
//   //       RepoUserList: JSON.stringify([
//   //         { id: 1, name: "User A" },
//   //         { id: 2, name: "User B" },
//   //       ]),
//   //       CreatedAt: new Date().toISOString(),
//   //     };

//   //     return normalizeRepo(repo);
//   //   });
//   // };

//   // const repos = generateDummyRepos(1000);
//   const repos = data?.RepoList?.map(normalizeRepo) || [];
//   const listConfigWithNav = {
//     ...repoListConfig,
//     onItemClick: (item) => {
//       // Navigate exactly where you need to go using the item's ID
//       navigate(`/repository/${item.id}`);
//     }
//   };
//   return (
//     // 1. Make this page a flex column that fills 100% of the height
//     <div className="flex flex-col h-full pb-2">

//       {/* 2. Top section (Title and Button) stays fixed */}
//       <div className="flex justify-between items-center mb-3 flex-none">
//         <h2 className="text-2xl font-semibold m-0">Repository</h2>
//         <button
//           onClick={() => navigate("/repository/create")}
//           className="bg-brand-yellow text-white px-4 py-2 rounded-md font-medium hover:bg-yellow-500 transition-colors"
//         >
//           Create New Repository
//         </button>
//       </div>

//       {/* 3. The List container takes up all remaining vertical space */}
//       {/* Note: min-h-0 is a crucial CSS trick to stop flex children from overflowing! */}
//       <div className="flex-1 min-h-0">
//         <ListProvider config={listConfigWithNav} data={repos}>
//           <ListLayout />
//         </ListProvider>
//       </div>
//     </div>
//   );
// }
