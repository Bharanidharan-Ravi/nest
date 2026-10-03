
import { useQueryClient } from "@tanstack/react-query";
import { executeApi } from "../../../core/api/executor";
import { useApiQuery } from "../../../core/query/useApiQuery";
import { queryKeys } from "../../../core/query/queryKeys";
import { buildSyncPayload } from "../../../core/sync/buildSyncPayload";

export const usePolicy = (enabled = true) => {
    const queryClient = useQueryClient();

    const query = useApiQuery({
        queryKey: queryKeys.policy.latest(),
        url: "/sync/v2",
        method: "POST",
        payload: buildSyncPayload({ configKey: "CompanyPolicy" }),
        source: "CompanyPolicy",
        options: { enabled },
    });

    const latestPolicy = Array.isArray(query.data) && query.data.length > 0
        ? query.data[0]
        : null;

    const uploadPolicy = async (file) => {
        const formData = new FormData();
        formData.append("files", file);

        const tempResponse = await executeApi({
            url: "/Attachment/tempUpload",
            method: "POST",
            payload: formData,
            config: {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            }
        });

        console.log("Temp upload Response", tempResponse);

     

        if (tempResponse) {
          const formattedTempData = {
            Delete: "single",
            temps: [
                {
            FileName: tempResponse.FileName,
            PublicUrl: tempResponse.PublicUrl,
            LocalPath: tempResponse.LocalPath,
                }
            ]
          };

            await executeApi({
                url: "/EmployeeArea/policy/upload",
                method: "POST",
                payload: { temp: formattedTempData },
            });

            queryClient.invalidateQueries({ queryKey: queryKeys.policy.all });
        }
    };

    return {
        ...query,
        policyData: latestPolicy,
        uploadPolicy,
    };
};
