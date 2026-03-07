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

const sortListByCreatedAt = (list, direction = "desc") => {
  if (!Array.isArray(list)) return [];

  return [...list].sort((a, b) => {
    const dateStringA = getValueCaseInsensitive(a, "UpdatedAt");
    const dateStringB = getValueCaseInsensitive(b, "UpdatedAt");

    const timeA = dateStringA ? new Date(dateStringA).getTime() : 0;
    const timeB = dateStringB ? new Date(dateStringB).getTime() : 0;

    if (direction === "asc") {
      return timeA - timeB; // Ascending (Oldest first)
    }
    return timeB - timeA; // Descending (Newest first - Default)
  });
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
      console.log("list :", list);

      if (!Array.isArray(list)) return [];

      // 1. Safely extract the target value case-insensitively from the payload
      const targetVal = normalize(getValueCaseInsensitive(payload, keyField));

      const match = (x) =>
        normalize(getValueCaseInsensitive(x, keyField)) === targetVal;

      // 2. Normalize payload casing (camelCase -> PascalCase) based on the first item in the list
      const formattedPayload =
        list.length > 0 ? syncKeyCasing(payload, list[0]) : payload;
      console.log("formattedPayload:", formattedPayload);

      // if (action === "Create") {
      //   if (list.some(match)) return list;
      //   // Insert the formatted payload so the UI doesn't break
      //   return [formattedPayload, ...list];
      // }

      // if (action === "Update") {
      //   return list.map((x) => (match(x) ? { ...x, ...formattedPayload } : x));
      // }

      // if (action === "Delete") {
      //   return list.filter((x) => !match(x));
      // }
      let updatedList = [...list];

      // Handle Actions
      if (action === "Create") {
        if (!list.some(match)) {
          updatedList = [formattedPayload, ...list];
        }
      } else if (action === "Update") {
        updatedList = list.map((x) =>
          match(x) ? { ...x, ...formattedPayload } : x,
        );
      } else if (action === "Delete") {
        updatedList = list.filter((x) => !match(x));
      }

      // 🔥 Sort DESCENDING (Newest first) for all master lists
      return sortListByCreatedAt(updatedList, "desc");
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
      updatedDataList = sortListByCreatedAt(updatedDataList, "asc");
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
  if (entity === "Ticket") {
    // Make sure queryKeys is imported at the top of your file!
    queryClient.setQueriesData(
      { queryKey: queryKeys.ticket.list() },
      (oldData) => {
        console.log("oldData ticket BEFORE :", oldData);

        // 1. Defensively grab the existing data array. If nothing exists, it's an empty array.
        let currentList = [];
        if (Array.isArray(oldData)) {
          currentList = oldData;
        } else if (
          oldData?.TicketsList?.Data &&
          Array.isArray(oldData.TicketsList.Data)
        ) {
          currentList = oldData.TicketsList.Data;
        } else if (oldData?.Data && Array.isArray(oldData.Data)) {
          currentList = oldData.Data;
        }
        console.log("currentList :", currentList);

        // 2. Setup matching logic using your existing helpers
        const targetVal = normalize(getValueCaseInsensitive(payload, keyField));
        const match = (x) =>
          normalize(getValueCaseInsensitive(x, keyField)) === targetVal;

        // Fix casing so the new item matches the existing list structure
        const formattedPayload =
          currentList.length > 0
            ? syncKeyCasing(payload, currentList[0])
            : payload;
        let updatedDataList = [...currentList];
        console.log(
          "targetVal :",
          targetVal,
          "formattedPayload :",
          formattedPayload,
        );

        // 3. Handle the specific actions
        if (action === "Create") {
          if (!currentList.some(match)) {
            // 🔥 SMART SCOPE CHECK FOR CREATE:
            // Because this updates ALL cached lists, we don't want to accidentally push a
            // 'Project B' ticket into the cached list for 'Project A'.
            // We check the first item in the list to see what project this list belongs to.
            if (currentList.length > 0) {
              const sampleTicket = currentList[0];

              const sampleProject = normalize(
                getValueCaseInsensitive(sampleTicket, "project") ||
                  getValueCaseInsensitive(sampleTicket, "projectId"),
              );
              const payloadProject = normalize(
                getValueCaseInsensitive(payload, "project") ||
                  getValueCaseInsensitive(payload, "projectId"),
              );

              // If this cached list is for a specific project, and it doesn't match our new ticket, skip it!
              if (
                sampleProject &&
                payloadProject &&
                sampleProject !== payloadProject
              ) {
                return oldData;
              }
            }
            console.log("sampleTicket :", currentList);
            updatedDataList = [formattedPayload, ...currentList]; // Add new ticket to top
          }
        } else if (action === "Update") {
          updatedDataList = currentList.map((x) =>
            match(x) ? { ...x, ...formattedPayload } : x,
          );
        } else if (action === "Delete") {
          updatedDataList = currentList.filter((x) => !match(x));
        }
console.log("updatedDataList :", updatedDataList);

        // 4. Sort Tickets (Newest First)
        updatedDataList = sortListByCreatedAt(updatedDataList, "desc");
        console.log("UPDATED TICKET LIST AFTER SORTING:", updatedDataList);

        // 5. Return the data exactly in the structure it originally came in
        if (Array.isArray(oldData)) {
          return updatedDataList;
        } else if (oldData?.TicketsList?.Data) {
          return {
            ...oldData,
            TicketsList: { ...oldData.TicketsList, Data: updatedDataList },
          };
        } else {
          return { ...oldData, Data: updatedDataList };
        }
      },
    );
  }
};
