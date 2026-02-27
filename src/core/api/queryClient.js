import { QueryClient } from "@tanstack/react-query"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
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
