import { masterKeys } from "../master/masterKeys";

// 🔥 Centralized master config keys
const keys = ["RepoList", "ProjectList", "EmployeeList", "LabelMaster"];
// 🔥 Normalize helper (safe + case-insensitive)
const normalize = (val) => {
  if (val === null || val === undefined) return "";
  return String(val).trim().toLowerCase();
};
const getValueCaseInsensitive = (obj, key) => {
  console.log("tste",obj, key);
  
  const actualKey = Object.keys(obj).find(
    k => k.toLowerCase() === key.toLowerCase()
  );
  return actualKey ? obj[actualKey] : undefined;
};

export const handleRealtimeMessage = (queryClient, message) => {
  const { entity, action, payload, keyField } = message;

  //   if (!entity || !action || !payload || !keyField) {
  //     console.warn("Invalid realtime message:", message);
  //     return;
  //   }
  console.log("message :", message);
  queryClient.setQueryData(masterKeys.multi(keys), (oldData) => {
    console.log("oldData :", oldData);

    if (!oldData) return oldData;
    const updateList = (list) => {
      if (!Array.isArray(list)) return [];

      const match = (x) =>
        normalize(getValueCaseInsensitive(x, keyField))=== normalize(payload[keyField]);
      

      if (action === "Create") {
        console.log("match :", payload[keyField], list,match, list.some(match));
        if (list.some(match)) return list;
        return [payload, ...list];
      }

      if (action === "Update") {
        return list.map((x) => (match(x) ? payload : x));
      }

      if (action === "Delete") {
        return list.filter((x) => !match(x));
      }

      return list;
    };

    switch (entity) {
      case "RepoList":
        return {
          ...oldData,
          RepoList: updateList(oldData.RepoList),
        };

      case "Project":
        return {
          ...oldData,
          ProjectList: updateList(oldData.ProjectList),
        };

      case "Ticket":
        return {
          ...oldData,
          TicketList: updateList(oldData.TicketList),
        };

      case "Employee":
        return {
          ...oldData,
          EmployeeList: updateList(oldData.EmployeeList),
        };

      case "Label":
        return {
          ...oldData,
          LabelList: updateList(oldData.LabelList),
        };

      default:
        return oldData;
    }
  });
};
