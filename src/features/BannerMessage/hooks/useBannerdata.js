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
              BannerMessageId,
              FromDate,
              ToDate,
          }
      },
      options:{
          staleTime:10*60*1000,
          enable:!!BannerMessageId,
      }
  })

  }

export const getMessageType = () => {
    const query = queryKeys.BannerDataType.all;
  
    const payload = buildSyncPayload({
      configKey: "BannerDataType",
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
  