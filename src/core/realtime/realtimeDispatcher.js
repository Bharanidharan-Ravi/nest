import { masterKeys } from "../master/masterKeys";

// 🔥 Centralized master config keys
const MASTER_CONFIG_KEYS = [
  "RepoList",
  "ProjectList",
  "EmployeeList",
  "LabelList"
];

// 🔥 Normalize helper (safe + case-insensitive)
const normalize = (val) => {
  if (val === null || val === undefined) return "";
  return String(val).trim().toLowerCase();
};

export const handleRealtimeMessage = (queryClient, message) => {
  const { entity, action, payload, keyField } = message;

//   if (!entity || !action || !payload || !keyField) {
//     console.warn("Invalid realtime message:", message);
//     return;
//   }

  queryClient.setQueryData(
    masterKeys.multi(MASTER_CONFIG_KEYS),
    (oldData) => {
    console.log("Realtime message received:", message, oldData);

      if (!oldData) return oldData;
      const updateList = (list) => {
console.log("Old Data:", oldData, "List to Update:",list);

        if (!Array.isArray(list)) return [];

        const match = (x) =>
          normalize(x[keyField]) === normalize(payload[keyField]);

        if (action === "Create") {
            console.log("action :", action,list, payload, match);
            
          if (list.some(match)) return list;
          return [payload, ...list];
        }

        if (action === "Update") {
          return list.map((x) =>
            match(x) ? payload : x
          );
        }

        if (action === "Delete") {
          return list.filter((x) =>
            !match(x)
          );
        }

        return list;
      };

      switch (entity) {
        case "Repo":
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
    }
  );
};
