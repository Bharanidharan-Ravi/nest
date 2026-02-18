import { QueryClient } from "@tanstack/react-query"
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 0,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
})
// const persister = createSyncStoragePersister({
//   storage: window.sessionStorage,
// });

// persistQueryClient({
//   queryClient,
//   persister,
// });


// import { QueryClient } from "@tanstack/react-query"

// export const queryClient = new QueryClient({
//   defaultOptions: {
//     queries: {
//       refetchOnWindowFocus: false,
//       retry: 1,
//       staleTime: 5 * 60 * 1000
//     }
//   }
// })
