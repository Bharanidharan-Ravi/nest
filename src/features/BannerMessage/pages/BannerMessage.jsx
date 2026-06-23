import { useSmartNavigation } from "../../../core/navigation/useSmartNavigation";
import { ROUTE_KEYS } from "../../../core/routing/paths";
import { ListLayout } from "../../../packages/ui-List/components/ListLayout";
import { ListProvider } from "../../../packages/ui-List/components/ListProvider";
import { BannerListConfig } from "../config/bannerUI.config";
import { useBannerMessage } from "../hooks/useBannerdata"

const BannerPage=()=>{
    const {data:banner}=useBannerMessage();
    const { goTo } = useSmartNavigation();

    const normalizeBanner=(banner)=>({
        BannerMessageId:banner.BannerMessageId,
        MessageText:banner.MessageText,
        MessageTypeId:banner.MessageTypeId,
        Status:banner.Status,   
        StartDate:banner.StartDate,
        EndDate:banner.EndDate,
        CreatedBy:banner.CreatedBy,
        CreatedAt:banner.CreatedAt,
        UpdatedBy:banner.UpdatedBy,
        UpdatedAt:banner.UpdatedAt,
        Type_Name:banner.Type_Name,
        ColorCode:banner.ColorCode,
        IconClass:banner.IconClass,
    })
    const Bannerlist=Array.isArray(banner)
    ?banner.map(normalizeBanner)
    :[]
    const listConfigWithNav = {
        ...BannerListConfig,
    
        onEditClick: (item) => {
          goTo(ROUTE_KEYS.BANNER_EDIT, { BannerMessageId: item.BannerMessageId })
        },
    
        onSelectionChange: (item, isChecked) => {
          console.log(`Label ${item.id} ${isChecked ? "selected" : "deselected"}`)
        },
      }
      return (
        <>
          <div className="flex justify-between items-center mb-3 flex-none">
            <h2>Banner Message</h2>
    
            <button
              onClick={() => goTo(ROUTE_KEYS.BANNER_CREATE)}
              className="bg-brand-yellow text-white px-4 py-2 rounded-md font-medium hover:bg-yellow-500 transition-colors"
            >
              Create New Message
            </button>
          </div>
    
          <div className="flex-1 min-h-0">
            <ListProvider config={listConfigWithNav} data={Bannerlist}>
              <ListLayout />
            </ListProvider>
          </div>
        </>
      ) 
}
export default BannerPage