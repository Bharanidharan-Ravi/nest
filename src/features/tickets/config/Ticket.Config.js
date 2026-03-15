export const TicketFieldConfig = () => [
  /* --------------------------------------------------
     Repository Title
  -------------------------------------------------- */
  {
    label: "Ticket",
    name: "title",
    type: "text",
    ui: "mui",

    required: true,
    dataType: "string",

    apiKey: "Title",

    // pattern: "^[A-Za-z0-9 ]+$",
    // errorMessage: "Only alphanumeric allowed",
    initValueResolver: (context) =>
      context.isEdit ? context.entityData?.title : "",
    visibleWhen: () => true,
  },
  {
    label: "Label",
    name: "label",
    type: "select",
    ui: "mui",
    multiple: true,
    required: false,
    dataType: "string",
    optionsResolver: (masterData) =>
      masterData?.LabelMaster?.map((label) => ({
        label: label.Title,
        value: {
          id: label.Id,
          name: label.Title,
        },
      })) || [],
    apiKey: "labelId",

    initValueResolver: (context) => {
      // ✅ Corrected: Only map if we ARE editing and the data actually exists
      if (
        context.isEdit &&
        context.entityData &&
        Array.isArray(context.entityData.label)
      ) {
        return context.entityData.label.map((l) => ({
          label: l.LABEL_TITLE,
          value: {
            id: l.LABEL_ID,
            name: l.LABEL_TITLE,
          },
        }));
      }

      // Return an empty array (or null) if there's no data, so the form field starts empty
      return [];
    },

    // pattern: "^[A-Za-z0-9 ]+$",
    // errorMessage: "Only alphanumeric allowed",

    visibleWhen: () => true,
  },
  {
    label: "Repository",
    name: "repository",
    type: "select",
    ui: "mui",
    optionsResolver: (masterData) =>
      masterData?.RepoList?.map((repo) => ({
        label: repo.Title,
        value: {
          id: repo.Repo_Id,
          name: repo.Title,
        },
      })) || [],
    required: true,
    dataType: "string",

    apiKey: "RepoId",

    // 🔥 Disable if repoId OR projid is in the URL/Edit Data
    disableWhen: (context) =>
      Boolean(
        context?.params?.repoId ||
        context?.params?.projId ||
        context?.entityData?.RepoId,
      ),

    // 🔥 Smart Initial Value (Looks up Repo ID via Project Master)
    initValueResolver: (context, masterData) => {
      // 1. Check if we have an explicit Repo ID first
      let targetRepoId = context?.isEdit
        ? context?.entityData?.RepoId
        : context?.params?.repoId;
      // const targetId =
      //   context?.params?.projId ||
      //   context?.entityData?.Project_Id ||
      //   context?.params?.repoId ||
      //   context?.entityData?.RepoId;

      // 2. If no explicit Repo ID, but we have a Project ID, look inside Project Master!
      if (!targetRepoId) {
        const targetProjId =
          context?.params?.projId || context?.entityData?.Project_Id;

        if (targetProjId) {
          const project = masterData?.ProjectList?.find(
            (p) => p.Id === targetProjId,
          );
          // ⚠️ IMPORTANT: Change 'Repo_Id' below to the exact key your Project uses for the repository
          targetRepoId = project?.Repo_Id;
        }
      }

      // If we still don't have a Repo ID, leave blank
      if (!targetRepoId) return null;

      // 3. Find the exact repo object
      const repo = masterData?.RepoList?.find(
        (r) => r.Repo_Id === targetRepoId,
      );
      if (!repo) return null;

      return {
        label: repo.Title,
        value: {
          id: repo.Repo_Id,
          name: repo.Title,
        },
      };
    },

    visibleWhen: () => true,
  },
  {
    label: "Project",
    name: "project",
    type: "select",
    ui: "mui",
    optionsResolver: (masterData, context) => {
      let projects = masterData?.ProjectList || [];

      // Look for a Project ID first, then fall back to a Repo ID
      // (Checks both URL params and existing edit data)
      const targetId =
        context?.params?.projId ||
        context?.entityData?.project ||
        context?.params?.repoId ||
        context?.entityData?.RepoId;

      if (targetId) {
        // Filter: match if targetId is either the Project's own ID OR its linked Repo_Id
        projects = projects.filter(
          (p) => p.Id === targetId || p.Repo_Id === targetId,
        );
      }

      return projects.map((project) => ({
        label: project.Project_Name,
        value: {
          id: project.Id,
          name: project.Project_Name,
        },
      }));
    },
    // optionsResolver: (masterData) =>
    //   masterData?.ProjectList?.map((project) => ({
    //     label: project.Project_Name,
    //     value: {
    //       id: project.Id,
    //       name: project.Project_Name,
    //     },
    //   })) || [],
    required: true,
    dataType: "string",
    // Disable field if Project ID exists
    disableWhen: (context) =>
      Boolean(context?.params?.projid || context?.entityData?.project),

    apiKey: "Project_Id",
    // 🔥 Disable if projid is passed (locking the specific project)
    disableWhen: (context) =>
      Boolean(context?.params?.projId || context?.entityData?.project),

    // 🔥 Smart Initial Value (Sets project if projid exists)
    initValueResolver: (context, masterData) => {
      const targetProjId =
        context?.params?.projId || context?.entityData?.project;

      if (!targetProjId) return null;

      const project = masterData?.ProjectList?.find(
        (p) => p.Id === targetProjId,
      );
      if (!project) return null;

      return {
        label: project.Project_Name,
        value: {
          id: project.Id,
          name: project.Project_Name,
        },
      };
    },

    visibleWhen: () => true,
  },
  {
    label: "Assigned-to",
    name: "assginedTo",
    type: "select",
    ui: "mui",
    optionsResolver: (masterData) =>
      masterData?.EmployeeList?.map((emp) => ({
        label: emp.UserName,
        value: {
          id: emp.UserID,
          name: emp.UserName,
        },
      })) || [],
    initValueResolver: (context, masterData) => {
      // ✅ 1. Check if we are editing and actually have the ID
      if (context.isEdit && context.entityData?.Assignee_Id) {
        // ✅ 2. Return the constructed object immediately
        return {
          label: context.entityData.assginedTo || "Unknown",
          value: {
            id: context.entityData.Assignee_Id,
            name: context.entityData.assginedTo || "Unknown",
          },
        };
      }

      // ✅ 3. Always return null if not editing, so the dropdown starts empty
      return null;
    },
    // required: true,
    dataType: "string",
    multiple: false,
    apiKey: "Assignee_Id",
    // pattern: "^[A-Za-z0-9 ]+$",
    // errorMessage: "Only alphanumeric allowed",
    visibleWhen: () => true,
  },
  {
    label: "Assignees",
    name: "assignees",
    type: "select",
    ui: "mui",
    multiple: true,
    required: false,
    dataType: "string",
    optionsResolver: (masterData) =>
      masterData?.EmployeeList?.map((emp) => ({
        label: emp.UserName,
        value: {
          id: emp.UserID,
          name: emp.UserName,
        },
      })) || [],
    initValueResolver: (context) => {
      // ✅ Corrected: Only map if we ARE editing and the data actually exists
      if (
        context.isEdit &&
        context.entityData &&
        Array.isArray(context.entityData.multiAssignees)
      ) {
        return context.entityData.multiAssignees
          .filter((assignee) => assignee.Assignee_Type !== "Main Assignee")
          .map((assignee) => ({
            label: assignee.Assignee_Name,
            value: {
              id: assignee.Assignee_Id,
              name: assignee.Assignee_Name,
            },
          }));
      }

      // Return an empty array (or null) if there's no data, so the form field starts empty
      return [];
    },
    apiKey: "resourceIds",
    visibleWhen: () => true,
  },
  {
    label: "Due Date",
    name: "dueDate",
    type: "date",
    ui: "mui",
    initValueResolver: (context) =>
      context.isEdit ? context.entityData?.DueDate : "",
    required: true,
    dataType: "string",
    apiKey: "Due_Date",

    // pattern: "^[A-Za-z0-9 ]+$",
    // errorMessage: "Only alphanumeric allowed",

    visibleWhen: () => true,
    customValidator: (value) => {
      if (!value) return "Due Date is required";
      const dueDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dueDate < today) {
        return "Due Date cannot be in the past";
      }
      return true;
    },
  },
  {
    name: "repoKey",
    apiKey: "RepoKey",
    hidden: true,
    defaultValue: null,
    dataType: "string",
  },

  {
    label: "Estimated Hours",
    name: "estimateHours",
    type: "flexHours",
    ui: "mui",
    required: true,
    dataType: "string",
    apiKey: "Hours",
    initValueResolver: (context) =>
      context.isEdit ? context.entityData?.estimateHours : "",
    // pattern: "^[A-Za-z0-9 ]+$",
    // errorMessage: "Only alphanumeric allowed",
    visibleWhen: () => true,
  },
  {
    label: "Priority",
    name: "priority",
    type: "priority", // Your custom type
    ui: "mui", // Tells your engine to look outside MUI
    required: true,
    dataType: "string",
    apiKey: "Priority",
    initValueResolver: (context) =>
      context.isEdit ? context.entityData?.Priority : "Medium", // Default to Medium if creating
    visibleWhen: () => true,
  },

  /* --------------------------------------------------
     Description
  -------------------------------------------------- */
  {
    label: "Description",
    name: "description",
    type: "adEditor",
    ui: "editor",

    required: true,
    dataType: "string",
    initValueResolver: (context) =>
      context.isEdit ? context.entityData?.description : "",
    apiKey: "Description",
  },
];
