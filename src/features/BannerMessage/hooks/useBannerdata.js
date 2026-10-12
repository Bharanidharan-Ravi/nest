import { executeApi } from "../../../core/api/executor";
import { queryKeys } from "../../../core/query/queryKeys";
import { useApiQuery } from "../../../core/query/useApiQuery";
import { buildSyncPayload } from "../../../core/sync/buildSyncPayload";

  export const useBannerMessage=(BannerMessageId=null,FromDate=null,ToDate)=>{
      return useApiQuery({   
          queryKey: [
            "BannerData", 
            "list", 
            BannerMessageId ?? "none",
            FromDate ?? "none",
            ToDate ?? "none"
        ],
      url: "/sync/v2",
      method: "POST",
      source:"BannerData",
      payload:{
          configKeys:["BannerData"],
          params:{
            BannerData:{
               BannerMessageId,
              FromDate,
              ToDate,}
             
          }
      },
      // Loaded once per page load
      options:{
          staleTime:Infinity,
          gcTime:Infinity,
          meta:{ keepUntilReload:true },
          enable:!!BannerMessageId,
      }
  })

  }

// Header ticker: only Status = 'Active' banners not yet past EndDate
// (GetBannerMessage @ActiveOnly). The admin screens use useBannerMessage().
export const useActiveBanners = () =>
  useApiQuery({
    queryKey: [...queryKeys.BannerData.list(), "active"],
    url: "/sync/v2",
    method: "POST",
    source: "BannerData",
    payload: {
      configKeys: ["BannerData"],
      params: { BannerData: { ActiveOnly: "1" } },
    },
    options: {
      staleTime: Infinity,
      gcTime: Infinity,
      meta: { keepUntilReload: true },
    },
  });

export const getMessageType = (MessageTypeId=null) => {
    const query = queryKeys.BannerDataType.all;
  
    const payload = buildSyncPayload({
      configKey: "BannerDataType",
      ...(MessageTypeId && {
       params:{
        MessageTypeId:MessageTypeId
       }})
    });
    return useApiQuery({
      queryKey: query,
      url: "/sync/v2",
      method: "POST",
      payload: payload,
      source: "BannerDataType",
      options: {
        staleTime: 0,
        enabled: true,
      },
    });
  };
  