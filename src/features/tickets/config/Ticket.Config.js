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
        context?.entityData?.Project_Id ||
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
      Boolean(context?.params?.projid || context?.entityData?.Project_Id),

    apiKey: "Project_Id",
    // 🔥 Disable if projid is passed (locking the specific project)
    disableWhen: (context) =>
      Boolean(context?.params?.projId || context?.entityData?.Project_Id),

    // 🔥 Smart Initial Value (Sets project if projid exists)
    initValueResolver: (context, masterData) => {
      const targetProjId =
        context?.params?.projId || context?.entityData?.Project_Id;

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
    required: true,
    dataType: "string",
    multiple: false,
    apiKey: "Assignee_Id",
    // pattern: "^[A-Za-z0-9 ]+$",
    // errorMessage: "Only alphanumeric allowed",
    visibleWhen: () => true,
  },
  {
    label: "Due Date",
    name: "dueDate",
    type: "date",
    ui: "mui",
    required: true,
    dataType: "string",
    apiKey: "Due_Date",

    // pattern: "^[A-Za-z0-9 ]+$",
    // errorMessage: "Only alphanumeric allowed",

    visibleWhen: () => true,
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
    // pattern: "^[A-Za-z0-9 ]+$",
    // errorMessage: "Only alphanumeric allowed",
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

    apiKey: "Description",
  },
];
