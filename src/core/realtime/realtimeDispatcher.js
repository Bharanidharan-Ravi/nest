import { masterKeys } from "../master/masterKeys";
import { queryKeys } from "../query/queryKeys";

// 🔥 Centralized master config keys
const keys = ["RepoList", "ProjectList", "EmployeeList", "LabelMaster"];

// 🔥 Normalize helper (safe + case-insensitive)
const normalize = (val) => {
  if (val === null || val === undefined) return "";
  return String(val).trim().toLowerCase();
};

const getValueCaseInsensitive = (obj, key) => {
  const actualKey = Object.keys(obj).find(
    (k) => k.toLowerCase() === key.toLowerCase(),
  );

  return actualKey ? obj[actualKey] : undefined;
};

// 🔥 NEW: Helper to force the incoming payload keys to match the casing of existing data
const syncKeyCasing = (sourceObj, referenceObj) => {
  if (!referenceObj) return sourceObj;
  const synced = {};
  Object.keys(sourceObj).forEach((key) => {
    const refKey = Object.keys(referenceObj).find(
      (k) => k.toLowerCase() === key.toLowerCase(),
    );
    // Use the matching key from reference (e.g. Repo_Id), otherwise fallback to original
    synced[refKey || key] = sourceObj[key];
  });
  return synced;
};

export const handleRealtimeMessage = (queryClient, message) => {
  // const { entity, action, payload, keyField, issueId } = message;
  const entity = message.Entity ?? message.entity;
  const action = message.Action ?? message.action;
  const payload = message.Payload ?? message.payload;
  const keyField = message.KeyField ?? message.keyField;
  const issueId = message.IssueId ?? message.issueId;
  console.log("Received realtime message:", message);

  if (!entity || !action || !payload || !keyField) {
    console.warn("Invalid realtime message:", message);
    return;
  }

  queryClient.setQueryData(masterKeys.multi(keys), (oldData) => {
    if (!oldData) return oldData;
console.log("oldData masterKeys.multi(keys):", oldData);

    const updateList = (list) => {
      if (!Array.isArray(list)) return [];

      // 1. Safely extract the target value case-insensitively from the payload
      const targetVal = normalize(getValueCaseInsensitive(payload, keyField));

      const match = (x) =>
        normalize(getValueCaseInsensitive(x, keyField)) === targetVal;

      // 2. Normalize payload casing (camelCase -> PascalCase) based on the first item in the list
      const formattedPayload =
        list.length > 0 ? syncKeyCasing(payload, list[0]) : payload;
console.log("formattedPayload:", formattedPayload);

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
  if (entity === "ThreadsList" && issueId) {
    // Make sure queryKeys is imported at the top of your file!
    queryClient.setQueryData(queryKeys.ticket.thread(issueId), (oldData) => {
      console.log("oldData thread BEFORE :", oldData);

      // 1. Defensively grab the existing data array. If nothing exists, it's an empty array.
      let currentList = [];
      if (
        oldData &&
        oldData.ThreadsList &&
        Array.isArray(oldData.ThreadsList.Data)
      ) {
        currentList = oldData.ThreadsList.Data;
      }

      // 2. Setup matching logic using your existing helpers
      const targetVal = normalize(getValueCaseInsensitive(payload, keyField));
      const match = (x) =>
        normalize(getValueCaseInsensitive(x, keyField)) === targetVal;

      // Fix casing so the new item matches the existing list structure
      const formattedPayload =
        currentList.length > 0
          ? syncKeyCasing(payload, currentList[0])
          : payload;

      // 3. Create a brand new array to maintain immutability
      let updatedDataList = [...currentList];

      // 4. Handle the specific actions
      if (action === "Create") {
        if (!currentList.some(match)) {
          updatedDataList = [formattedPayload, ...currentList]; // Add new item to front
        }
      } else if (action === "Update") {
        updatedDataList = currentList.map((x) =>
          match(x) ? { ...x, ...formattedPayload } : x,
        );
      } else if (action === "Delete") {
        updatedDataList = currentList.filter((x) => !match(x));
      }

      // 🔥 5. BULLETPROOF SORTING (Newest First)
      updatedDataList.sort((a, b) => {
        // Find the date properties safely
        const dateStringA = getValueCaseInsensitive(a, "createdAt");
        const dateStringB = getValueCaseInsensitive(b, "createdAt");

        // Convert to numerical timestamps, fallback to 0 if invalid
        const timeA = dateStringA ? new Date(dateStringA).getTime() : 0;
        const timeB = dateStringB ? new Date(dateStringB).getTime() : 0;

        // Descending order (newest first)
        return timeA - timeB;
      });

      console.log("UPDATED LIST AFTER SORTING:", updatedDataList);

      // 6. Return the constructed state matching the EXACT structure your page expects
      return {
        ...(oldData || {}),
        ThreadsList: {
          ...(oldData?.ThreadsList || {}),
          Data: updatedDataList,
        },
      };
    });
  }
};
