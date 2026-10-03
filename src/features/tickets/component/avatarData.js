// Data every SmartAvatar needs: the employee rows, the repo client users and
// the presence lookup.
//
// A ticket list renders hundreds of avatars. Each one used to open its own
// React Query subscriptions (master data, presence) on mount, which was a big
// part of the cost of opening a list. AvatarDataProvider subscribes once (in
// MainLayout) and the avatars read it from context.

import { createContext, useContext, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMasterData } from "../../../core/master/masterCall/useMasterData";
import { useCurrentUser } from "../../../core/auth/useCurrentUser";
import { usePresenceLookup } from "../../messenger/hooks/useUserStatus";

export const AvatarDataContext = createContext(null);

export function useAvatarDataSource() {
  const { isViewer } = useCurrentUser();
  const queryClient = useQueryClient();
  const { data: masterData } = useMasterData();
  const presenceLookup = usePresenceLookup();
  const employees = isViewer ? undefined : masterData?.EmployeeList;

  return useMemo(
    () => ({
      employees,
      presenceLookup,
      // Read on demand (only avatars with no employee match need it)
      getRepos: () =>
        queryClient
          .getQueriesData({ queryKey: ["master"] })
          .find(([, data]) => data?.RepoList)?.[1]?.RepoList,
    }),
    [employees, presenceLookup, queryClient],
  );
}

export const useAvatarData = () => useContext(AvatarDataContext);
