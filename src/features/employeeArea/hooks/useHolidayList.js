import { executeApi } from "../../../core/api/executor"; 
import { queryKeys } from "../../../core/query/queryKeys";
import { useApiQuery } from "../../../core/query/useApiQuery";
import { buildSyncPayload } from "../../../core/sync/buildSyncPayload"; 

export const fetchHolidayList = (config = {}, holidayId = null) => {
    const payload = buildSyncPayload({
        configKey: "HolidayList",
        ...(holidayId && {idKey: "Id", idValue: holidayId}),
    });

    return executeApi({
        url:"/sync/v2",
        method:"POST",
        payload: payload,
        config,
    });
};

export const getHolidayList = (holidayId = null, overrideOptions = {}) => {
    const query = holidayId ? queryKeys.holiday.list(holidayId) : queryKeys.holiday.all;

    return useApiQuery({
        queryKey: query,
        queryFn: (config) => fetchHolidayList(config, holidayId),
        source: "HolidayList",
        options:{
            staleTime: 0,
            enabled: true,
            ...overrideOptions,
        },
    });
};