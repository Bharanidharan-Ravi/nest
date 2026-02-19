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

    apiKey: "Title",
    masterKey: "RepoList",

    // 🔥 Build dropdown options
    optionsResolver: (masterData) =>
      masterData?.RepoList?.map((repo) => ({
        label: repo.Title,
        value: {
          id: repo.Repo_Id,
          name: repo.Title,
        },
      })) || [],

    // 🔥 Disable when repoId param exists
    disableWhen: (context) => Boolean(context?.params?.repoId),

    // 🔥 Initial value when repoId param exists
    initValueResolver: (context, masterData) => {
      const repoId = context?.params?.repoId;
      if (!repoId) return null;

      const repo = masterData?.RepoList?.find((r) => r.Repo_Id === repoId);
      // console.log("repoId:", repoId, "repo:", repo);

      if (!repo) return null;

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

    visibleWhen: () => true,
  },
  {
    label: "Responsible",
    name: "responsible",
    type: "select",
    ui: "mui",

    required: true,
    dataType: "string",

    apiKey: "Title",
    masterKey: "RepoList",

    // 🔥 Build dropdown options
    optionsResolver: (masterData) =>
      masterData?.EmployeeList?.map((user) => ({
        label: user.UserName,
        value: {
          id: user.UserID,
          name: user.UserName,
        },
      })) || [],

  },
  //    {
  //     label: "Repository",
  //     name: "title",
  //     type: "text",
  //     ui: "mui",

  //     required: true,
  //     dataType: "string",

  //     apiKey: "Title",

  //     pattern: "^[A-Za-z0-9 ]+$",
  //     errorMessage: "Only alphanumeric allowed",

  //     visibleWhen: () => true,
  //   }, {
  //     label: "Repository",
  //     name: "title",
  //     type: "text",
  //     ui: "mui",

  //     required: true,
  //     dataType: "string",

  //     apiKey: "Title",

  //     pattern: "^[A-Za-z0-9 ]+$",
  //     errorMessage: "Only alphanumeric allowed",

  //     visibleWhen: () => true,
  //   },
];
