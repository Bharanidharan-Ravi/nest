// core/master/masterSignalRUpdater.js

import { queryClient } from "../api/queryClient";
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
