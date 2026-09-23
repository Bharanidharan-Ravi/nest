import { useApiQuery } from "../../../core/query/useApiQuery";
import { queryKeys } from "../../../core/query/queryKeys";

export const useTicketFeedbacks = (ticketId, enabled = true) => {
    return useApiQuery({
        queryKey: queryKeys.ticket.feedbacks(ticketId),
        url: "/sync/v2",
        method: "POST",
        payload:{
            ConfigKeys:["TicketFeedback"],
            Params:{
                TicketFeedback:{
                    TicketId: ticketId,
                },
            },
        },
        options:{
            enabled: Boolean(ticketId) && enabled,
            select: (res) => {
                const block = 
                 res?.Res?.TicketFeedback ||
                 res?.data?.Res?.TicketFeedback ||
                 res?.data?.TicketFeedback ||
                 res?.TicketFeedback;

                 const list = block?.Data ?? block ?? [];
                 return Array.isArray(list) ? list : [];
            },
            staleTime: 1000 * 30,
        },
    });
};