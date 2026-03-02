
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
    multiple:true, 
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

    // pattern: "^[A-Za-z0-9 ]+$",
    // errorMessage: "Only alphanumeric allowed",

    visibleWhen: () => true,
  },
  {
    label: "Project",
    name: "project",
    type: "select",
    ui: "mui",
    optionsResolver: (masterData) =>
      masterData?.ProjectList?.map((project) => ({
        label: project.Project_Name,
        value: {
          id: project.Id,
          name: project.Project_Name,
        },
      })) || [],
    required: true,
    dataType: "string",

    apiKey: "Project_Id",

    // pattern: "^[A-Za-z0-9 ]+$",
    // errorMessage: "Only alphanumeric allowed",

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
    multiple:false, 
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
