import { useParams } from "react-router-dom";
import { useClientData } from "../hooks/useRepoMaster";
import { CustomerData } from "../config/RepoUI.config";
import { ListProvider } from "../../../packages/ui-List/components/ListProvider";
import { ListLayout } from "../../../packages/ui-List/components/ListLayout";
import { useSmartNavigation } from "../../../core/navigation/useSmartNavigation";
import { ROUTE_KEYS } from "../../../core/routing/paths"; 
import { useCurrentUser } from "../../../core/auth/useCurrentUser";
const RepoOverview = () => {
  const { goTo } = useSmartNavigation();
  const {repoId}=useParams()
  const {data}=useClientData(repoId);
  const {isAdmin} = useCurrentUser();
 
  const normalizecustomer = (Ctm) => {
    return {
      Repo_Id: Ctm.Repo_Id,
      MailId:  Ctm.MailId,
      PhoneNumber:  Ctm.PhoneNumber,
      RepoKey: Ctm.RepoKey,
      Status:  Ctm.Status,
      UserName:  Ctm.UserName,
      WGUserName:  Ctm.WGUserName,
      UserId:Ctm.UserId,
      PreviewUrl: Ctm.PreviewUrl ||Ctm.AvatarPath || null,
      AvatarPath: Ctm.AvatarPath || Ctm.PreviewUrl || null,
      canEdit: isAdmin,
    };
  };
  const Customer = Array.isArray(data) ? data?.map(normalizecustomer) : [];
  const listConfigWithNav = {
    ...CustomerData,
    enableEdit: isAdmin,
    isEditDisabled: () => !isAdmin,
    onEditClick: (item) => {
      if (!isAdmin) return;
      goTo(ROUTE_KEYS.REPO_OVERVIEW_EDIT, { 
        repoId:item.Repo_Id,
        userId: item.UserId,
       });
    }, };

  return (
    <div>
       <div className="flex justify-between items-center mb-3 flex-none">
        
       <h2 >Repository Overview</h2>
       {isAdmin && (
        <button
          onClick={() => goTo(ROUTE_KEYS.REPO_OVERVIEW_CREATE)}
          className="bg-brand-yellow text-white px-4 py-2 rounded-md font-medium hover:bg-yellow-500 transition-colors"
        >
          Add Customer
        </button>
       )}
      </div>

      <div className="flex-1 min-h-0">
      <ListProvider config={listConfigWithNav} data={Customer}>
          <ListLayout />
        </ListProvider>
        </div>
    </div>
  )
}
export default RepoOverview;