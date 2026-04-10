import { buildOptionsResolver } from "../../../app/shared/utilities/utilities";

export const ProjFieldConfig = () => [
  /* --------------------------------------------------
     Repository Title
  -------------------------------------------------- */
  {
    label: "Repository",
    name: "Repo",
    type: "select",
    ui: "mui",

    required: true,
    dataType: "string",

    apiKey: "Repo_Id",
    masterKey: "RepoList",

    // 🔥 Build dropdown options
    optionsResolver: buildOptionsResolver(
      "RepoList", // 1. listKey
      "Repo_Id", // 2. idKey
      "Title", // 3. labelKey
    ),

    // 🔥 Disable when repoId param exists
    disableWhen: (context) =>
      Boolean(context?.params?.repoId || context?.entityData?.Repo_Id),
    forceSubmit: true, // 🔥 Ensure this field is always submitted, even when disabled
    // 🔥 Smart initial value resolver
    initValueResolver: ({ context, masterData }) => {
      // 1. Get the ID from entityData if editing, otherwise get it from the URL params
      const targetRepoId = context?.isEdit
        ? context?.entityData?.Repo_Id
        : context?.params?.repoId;

      // If neither exists, leave the dropdown empty
      if (!targetRepoId) return null;

      // 2. Find the exact repo object in your master data list
      const repo = masterData?.RepoList?.find(
        (r) => r.Repo_Id === targetRepoId,
      );

      if (!repo) return null;

      // 3. Return the exact object structure MUI expects
      return {
        label: repo.Title,
        value: {
          id: repo.Repo_Id,
          name: repo.Title,
        },
      };
    },
  },
  {
    label: "Project Title",
    name: "title",
    type: "text",
    ui: "mui",

    required: true,
    dataType: "string",

    apiKey: "Title",

    pattern: "^[A-Za-z0-9 ]+$",
    errorMessage: "Only alphanumeric allowed",
    initValueResolver: ({ context }) =>
      context.isEdit ? context.entityData?.Project_Name : "",
    visibleWhen: () => true,
  },
  {
    label: "Responsible",
    name: "responsible",
    type: "select",
    ui: "mui",
    required: true,
    dataType: "string",

    apiKey: "Responsible",
    masterKey: "RepoList",
    // colSpan:,
    // 🔥 Build dropdown options
    optionsResolver: ({ masterData }) =>
      masterData?.EmployeeList?.map((user) => ({
        label: user.UserName,
        value: {
          id: user.UserID,
          name: user.UserName,
        },
      })) || [],
    initValueResolver: ({ context, masterData }) => {
      if (context.isEdit && context.entityData?.EmployeeName) {
        const empId = context.entityData?.Responsible;
        if (!empId) return null;

        const emp = masterData?.EmployeeList?.find((e) => e.UserID === empId);
        if (!emp) return null;

        return {
          label: emp.UserName,
          value: {
            id: emp.UserID,
            name: emp.UserName,
          },
        };
      }
      return "";
    },
  },
  {
    label: "Start Date",
    name: "startDate",
    type: "date",
    ui: "mui",

    required: true,
    dataType: "string",
    colSpan: 3,
    apiKey: "StartDate",
    initValueResolver: ({ context }) =>
      context.isEdit ? context.entityData?.StartDate : "",
    customValidator: (value, data) => {
      if (!value) return null;
      const startDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (startDate < today) {
        return "Start Date cannot be in the past";
      }
      if (data.dueDate) {
        const dueDate = new Date(data.dueDate);
        if (startDate > dueDate) {
          return "Start Date cannot be after Due Date";
        }
      }
      return true;
    },
  },
  {
    label: "Due Date",
    name: "dueDate",
    type: "date",
    ui: "mui",

    required: true,
    dataType: "string",
    colSpan: 3,
    apiKey: "DueDate",
    initValueResolver: ({ context }) =>
      context.isEdit ? context.entityData?.DueDate : "",
    customValidator: (value, data) => {
      if (!value || !data.startDate) return null;
      const startDate = new Date(data.startDate);
      const dueDate = new Date(value);
      if (dueDate < startDate) {
        return "Due Date cannot be before Start Date";
      }
      return true;
    },
  },
  {
    label: "Description",
    name: "description",
    type: "adEditor",
    ui: "editor",

    required: true,
    dataType: "string",

    apiKey: "Description",
    initValueResolver: ({ context }) => {
      if (!context.isEdit || !context.entityData) return "";

      return (
        context.entityData.HtmlDesc || context.entityData.Description || ""
      );
    },
    visibleWhen: () => true,
  },
];
