import { masterKeys } from "../master/masterKeys";

// 🔥 Centralized master config keys
const keys = ["RepoList", "ProjectList", "EmployeeList", "LabelMaster"];

// 🔥 Normalize helper (safe + case-insensitive)
const normalize = (val) => {
  if (val === null || val === undefined) return "";
  return String(val).trim().toLowerCase();
};

const getValueCaseInsensitive = (obj, key) => {
  const actualKey = Object.keys(obj).find(
    (k) => k.toLowerCase() === key.toLowerCase()
  );
  return actualKey ? obj[actualKey] : undefined;
};

// 🔥 NEW: Helper to force the incoming payload keys to match the casing of existing data
const syncKeyCasing = (sourceObj, referenceObj) => {
  if (!referenceObj) return sourceObj;
  const synced = {};
  Object.keys(sourceObj).forEach((key) => {
    const refKey = Object.keys(referenceObj).find(
      (k) => k.toLowerCase() === key.toLowerCase()
    );
    // Use the matching key from reference (e.g. Repo_Id), otherwise fallback to original
    synced[refKey || key] = sourceObj[key];
  });
  return synced;
};

export const handleRealtimeMessage = (queryClient, message) => {
  const { entity, action, payload, keyField } = message;

  if (!entity || !action || !payload || !keyField) {
    console.warn("Invalid realtime message:", message);
    return;
  }

  queryClient.setQueryData(masterKeys.multi(keys), (oldData) => {
    if (!oldData) return oldData;

    const updateList = (list) => {
      if (!Array.isArray(list)) return [];

      // 1. Safely extract the target value case-insensitively from the payload
      const targetVal = normalize(getValueCaseInsensitive(payload, keyField));

      const match = (x) =>
        normalize(getValueCaseInsensitive(x, keyField)) === targetVal;

      // 2. Normalize payload casing (camelCase -> PascalCase) based on the first item in the list
      const formattedPayload =
        list.length > 0 ? syncKeyCasing(payload, list[0]) : payload;

      if (action === "Create") {
        if (list.some(match)) return list;
        // Insert the formatted payload so the UI doesn't break
        return [formattedPayload, ...list];
      }

      if (action === "Update") {
        return list.map((x) => (match(x) ? { ...x, ...formattedPayload } : x));
      }

      if (action === "Delete") {
        return list.filter((x) => !match(x));
      }

      return list;
    };

    switch (entity) {
      case "RepoList":
        return { ...oldData, RepoList: updateList(oldData.RepoList) };
      case "Project":
        return { ...oldData, ProjectList: updateList(oldData.ProjectList) };
      case "Ticket":
        return { ...oldData, TicketList: updateList(oldData.TicketList) };
      case "Employee":
        return { ...oldData, EmployeeList: updateList(oldData.EmployeeList) };
      case "Label":
        return { ...oldData, LabelList: updateList(oldData.LabelList) };
      default:
        return oldData;
    }
  });
};