// core/master/masterSignalRUpdater.js

import { queryClient } from "../api/queryClient";
import { queryKeys } from "../query/queryKeys";
import { masterKeys } from "./masterKeys";

export const updateMasterCache = (type, updatedItem) => {
  const keyMap = {
    Repo: masterKeys.repo(),
    Project: masterKeys.project(),
    Employee: masterKeys.employee(),
    Label: masterKeys.label(),
  };

  const queryKey = keyMap[type];

  if (!queryKey) return;

  queryClient.setQueryData(queryKey, (oldData) => {
    if (!oldData) return oldData;

    return oldData.map((item) =>
      item.id === updatedItem.id ? updatedItem : item
    );
  });
};

export const addRepoToCache = (repo) => {
  queryClient.setQueryData(
    queryKeys.repo.list(),
    (old = []) => {
      const exists = old.some(r => r.Repo_Id === repo.Repo_Id);
      if (exists) return old; // 🔥 prevent duplicate
      return [...old, repo];
    }
  );
};
