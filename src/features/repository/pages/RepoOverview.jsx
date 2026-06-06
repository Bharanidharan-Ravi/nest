import { useParams } from "react-router-dom";
import { useClientData } from "../hooks/useRepoMaster";
import { CustomerData } from "../config/RepoUI.config";
import { ListProvider } from "../../../packages/ui-List/components/ListProvider";
import { ListLayout } from "../../../packages/ui-List/components/ListLayout";
import { useSmartNavigation } from "../../../core/navigation/useSmartNavigation";
import { ROUTE_KEYS } from "../../../core/routing/paths"; 
const RepoOverview = () => {
  const { goTo } = useSmartNavigation();
  const {repoId}=useParams()
  const {data}=useClientData(repoId);
 
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
    };
  };
  const Customer = Array.isArray(data) ? data?.map(normalizecustomer) : [];
  const listConfigWithNav = {
    ...CustomerData,
    onEditClick: (item) => {
      goTo(ROUTE_KEYS.REPO_OVERVIEW_EDIT, { 
        repoId:item.Repo_Id,
        userId: item.UserId,
       });
    }, };

  return (
    <div>
       <div className="flex justify-between items-center mb-3 flex-none">
        
       <h2 >Repository Overview</h2>
        <button
          onClick={() => goTo(ROUTE_KEYS.REPO_OVERVIEW_CREATE)}
          className="bg-brand-yellow text-white px-4 py-2 rounded-md font-medium hover:bg-yellow-500 transition-colors"
        >
          Add Customer
        </button>
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