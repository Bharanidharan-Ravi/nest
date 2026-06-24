import {
  buildOptionsResolver,
  sumHHMM,
} from "../../../app/shared/utilities/utilities";
const makeAtLeastOneValidator = (fieldLabel) => (value, formData, context) => {
  if (!context?.isEdit) {
    // Not in edit mode ? skip validation
    return true;
  }
 if(formData?.Status?.value?.name==="InQueue"){
  return true
 }
  // In edit mode ? check if all fields are empty
  const allEmpty =
    !formData?.Client &&
    !formData?.Web &&
    !formData?.Functional &&
    !formData?.Technical;

  if (allEmpty) {
    return `${fieldLabel} is required`;
  }

  return true;
};
const statusOptions = [
  { label: "Active", value: { id: 1, name: "Active" } },
  { label: "InActive", value: { id: 17, name: "InActive" } },
  { label: "Hold", value: { id: 14, name: "Hold" } },
  { label: "InQueue", value: { id: 18, name: "InQueue" } },
  { label: "Need Confirmation", value: { id: 10, name: "Need Confirmation" } },
];

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
    initValueResolver: ({ context }) =>
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
    optionsResolver: buildOptionsResolver(
      "LabelMaster", // 1. listKey
      "Id", // 2. idKey
      "Title", // 3. labelKey
    ),
    apiKey: "labelId",

    initValueResolver: ({ context }) => {
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
    optionsResolver: buildOptionsResolver(
      "RepoList", // 1. listKey
      "Repo_Id", // 2. idKey
      "Title", // 3. labelKey
    ),
    required: true,
    dataType: "string",

    apiKey: "RepoId",

    // 🔥 Disable if repoId OR projid is in the URL/Edit Data
    disableWhen: (context) =>
      Boolean(
        context?.params?.repoId ||
        context?.params?.projId ||
        context?.entityData?.repoId,
      ),
    forceSubmit: true,
    // 🔥 Smart Initial Value (Looks up Repo ID via Project Master)
    initValueResolver: ({ context, masterData, formData }) => {
      // 1. Check if we have an explicit Repo ID first
      let targetRepoId = null;

      const projectId =
        formData?.project?.value?.id ||
        context?.params?.projId ||
        context?.entityData?.Project_Id;

      if (projectId) {
        const project = masterData?.ProjectList?.find(
          (p) => p.Id === projectId,
        );
        if (project) targetRepoId = project.Repo_Id;
      }

      // 2. If no explicit Repo ID, but we have a Project ID, look inside Project Master!
      if (!targetRepoId) {
        targetRepoId = context?.params?.repoId || context?.entityData?.repoId;
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
    optionsResolver: buildOptionsResolver(
      "ProjectList", // 1. listKey
      "Id", // 2. idKey
      "Project_Name", // 3. labelKey

      // 4. Custom filterFn (Grabbing context and formData!)
      (project, { context, formData }) => {
        // Step A: Determine the targetId using your cascading fallback
        const targetId =
          context?.params?.projId ||
          context?.entityData?.project ||
          context?.params?.repoId ||
          context?.entityData?.repoId ||
          formData?.repository?.value?.id;

        // Step B: If no targetId is found anywhere, keep all projects
        if (!targetId) return true;

        // Step C: If a targetId exists, only keep projects that match it
        return project.Id === targetId || project.Repo_Id === targetId;
      },
    ),
    required: true,
    dataType: "string",
    // Disable field if Project ID exists
    disableWhen: (context) =>
      Boolean(context?.params?.projid || context?.entityData?.project),
    forceSubmit: true,
    apiKey: "Project_Id",
    // 🔥 Disable if projid is passed (locking the specific project)

    // 🔥 Smart Initial Value (Sets project if projid exists)
    initValueResolver: ({ context, masterData, formData }) => {
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
    label: "Rasie ticket to ",
    name: "Rasieticket",
    type: "priority", // Your custom type
    ui: "mui", // Tells your engine to look outside MUI
    required: false,
    dataType: "boolean",
    apiKey: "RaiseToClient",
    initValueResolver: ({ context }) => {
      if (context.isEdit) {
        return context.entityData?.raiseToClient ?? false; // fallback to false if null
      }
      return !context?.isViewer ? false : true;
    },
    disableWhen: (context) => {
      // return context.isEdit
    },
    visibleWhen: (formData, context) => {
      return !context?.isViewer;
    },
  },

  {
    label: "Priority",
    name: "priority",
    type: "priority", // Your custom type
    ui: "mui", // Tells your engine to look outside MUI
    required: true,
    dataType: "string",
    apiKey: "Priority",
    initValueResolver: ({ context }) => {
      return context.isEdit ? context.entityData?.priority : "";
    }, // Default to Medium if creating
    visibleWhen: () => true,
  },

  {
    label: "Owner",
    name: "assignedTo",
    type: "select",
    ui: "mui",
    optionsResolver: buildOptionsResolver(
      "EmployeeList",
      "UserID",
      "UserName",
      (user) => user.Status === "Active", // 👈 Simple 1-condition filter
    ),
    initValueResolver: ({ context, masterData }) => {
      // ✅ 1. Check if we are editing and actually have the ID
      if (context.isEdit && context.entityData?.assignedTo) {
        // ✅ 2. Return the constructed object immediately
        return {
          label: context.entityData.assginedName || "Unknown",
          value: {
            id: context.entityData.assignedTo,
            name: context.entityData.assginedName || "Unknown",
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
    // visibleWhen: () => true,
    visibleWhen: (formData, context) => {
      if (!context.isViewer) {
        return true;
      }
      if (context.isViewer) {
        return false;
      }
      return true;
    },
  },
  {
    label: "Assignees",
    name: "assignees",
    type: "select",
    ui: "mui",
    multiple: true,
    required: false,
    dataType: "string",
    optionsResolver: buildOptionsResolver(
      "EmployeeList",
      "UserID",
      "UserName",
      // This is your custom filterFn. Notice it grabs `formData` from the second argument!
      (user, { formData }) => {
        // 1. Check if they are Active
        if (user.Status !== "Active") return false;
        // 2. Check if they are already selected in the "assginedTo" field
        const targetId = formData?.assginedTo?.value?.id;
        if (targetId && user.UserID === targetId) {
          return false; // Exclude them if they match!
        }

        // 3. Keep everyone else
        return true;
      },
    ),
    initValueResolver: ({ context, formData }) => {
      if (
        context.isEdit &&
        context.entityData &&
        Array.isArray(context.entityData.multiAssignees)
      ) {
        const filter = context.entityData.multiAssignees
          .filter(
            (assignee) =>
              assignee.Assignee_Type !== "Main Assignee" &&
              assignee.StreamStatus !== 17, // 🔥 Added this condition to ignore Inactive status
          )
          .map((assignee) => ({
            label: assignee.Assignee_Name,
            value: {
              id: assignee.Assignee_Id,
              name: assignee.Assignee_Name,
            },
          }));

        return filter;
      }

      // Return an empty array (or null) if there's no data, so the form field starts empty
      return [];
    },
    apiKey: "resourceIds",
    // visibleWhen: () => true,
    visibleWhen: (formData, context) => {
      if (!context.isViewer) {
        return true;
      }
      if (context.isViewer) {
        return false;
      }
      return true;
    },
  },
  {
    label: "Due Date",
    name: "dueDate",
    type: "date",
    ui: "mui",
    initValueResolver: ({ context }) =>
      context.isEdit ? context.entityData?.dueDate : "",
    required: false,
    dataType: "string",
    apiKey: "Due_Date",

    // pattern: "^[A-Za-z0-9 ]+$",
    // errorMessage: "Only alphanumeric allowed",

    visibleWhen: (formData, context) => {
      if (!context.isViewer) {
        return true;
      }
      if (context.isViewer) {
        return false;
      }
      return true;
    },
    customValidator: (value, data, context) => {
      if (context?.isEdit) {
        return true;
      }
      
      if (!value) return true;
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

  // {
  //   label: "Estimated Hours",
  //   name: "estimateHours",
  //   type: "flexHours",
  //   ui: "mui",
  //   required: true,
  //   dataType: "string",
  //   apiKey: "Hours",
  //   initValueResolver: ({ context }) =>
  //     context.isEdit ? context.entityData?.estimateHours : "",
  //   // pattern: "^[A-Za-z0-9 ]+$",
  //   // errorMessage: "Only alphanumeric allowed",
  //   visibleWhen: () => true,
  // },

  {
    label: "Estimated Hours",
    name: "estimateHours",
    type: "flexHours",
    ui: "mui",
    required: false,
    dataType: "string",
    apiKey: "Hours",
    initValueResolver: ({ context }) =>
      context.isEdit ? context.entityData?.estimateHours : "",
    disabled: true,
    forceSubmit: true,
    effectDependencies: ["Client", "Web", "Technical", "Functional"],
    effectResolver: (formData) => {
      const client = formData.Client;
      const web = formData.Web;
      const tech = formData.Technical;
      const func = formData.Functional;
      const hasAnyValue = client || web || tech || func;
      if (!hasAnyValue) {
        return ""; // or null depending on your system
      }
      return sumHHMM(client, web, tech, func);
    },
    // effectResolver: (formData) => {
    //   return sumHHMM(formData.Client, formData.Development, formData.Testing);
    // },
    visibleWhen: (formData, context) => {
      if (!context.isViewer) {
        return true;
      }
      if (context.isViewer) {
        return false;
      }
      return true;
    },
    // customValidator: (value, formData) => {
    //   const hasSubFields = formData?.Client || formData?.Development || formData?.Testing
    //   if (!hasSubFields) {
    //     if (!value) return "Estimated hours is required"
    //     return true
    //   }

    //   const expected = sumHHMM(
    //     formData.Client,
    //     formData.Development,
    //     formData.Testing
    //   )
    //   if (value !== expected) {
    //     return `Estimated hours is auto-calculated(${expected})from Client,Dev &Testing-manual edit not allowed.`
    //   }
    //   return true
    // }
  },
  //   {
  //   name: "showClient",
  //   label: "Client",
  //   type: "toggleButton",
  //   colSpan: 1,
  // },

  {
    label: "Client Hours",
    name: "Client",
    type: "flexHours",
    ui: "mui",
    required: false,
    dataType: "string",
    apiKey: "Client",
    colSpan: 2,
    disableWhen: (context) => {
      // Disable if entityData.webTime exists AND user is NOT admin
      const hasWebTime = context?.entityData?.clientTime!= null; // safer check
      const notAdmin = !context?.isAdmin;
      return hasWebTime && notAdmin;
    },
    forceSubmit: true,
    initValueResolver: ({ context }) =>
      context.isEdit ? context.entityData?.clientTime : "",
    visibleWhen: (formData, context) => {
      if (context.isViewer) return false;
      if (context.isEdit) return true;
      return true;
    },
    customValidator: makeAtLeastOneValidator("Client"),
  },
  {
    label: "Func Hours",
    name: "Functional",
    type: "flexHours",
    ui: "mui",
    required: false,
    dataType: "string",
    apiKey: "Functional",
    colSpan: 2,
    disableWhen: (context) => {
      // Disable if entityData.webTime exists AND user is NOT admin
      const hasWebTime = context?.entityData?.functionalTime != null; // safer check
      const notAdmin = !context?.isAdmin;
      return hasWebTime && notAdmin;
    },  forceSubmit: true,
    initValueResolver: ({ context }) =>
      context.isEdit ? context.entityData?.functionalTime : "",
    visibleWhen: (formData, context) => {
      if (context.isViewer) return false;
      if (context.isEdit) return true;
      return true;
    },
    customValidator: makeAtLeastOneValidator("Functional"),
  },
  // {
  //   name: "showDevelopment",
  //   label: "Dev",
  //   type: "toggleButton",
  //   colSpan: 1,
  // },
  {
    label: "Web Hours",
    name: "Web",
    type: "flexHours",
    ui: "mui",
    required: false,
    dataType: "string",
    apiKey: "Web",
    colSpan: 2,
    disableWhen: (context) => {
      // Disable if entityData.webTime exists AND user is NOT admin
      const hasWebTime = context?.entityData?. webTime != null; // safer check
      const notAdmin = !context?.isAdmin;
      return hasWebTime && notAdmin;
    },  forceSubmit: true,
    initValueResolver: ({ context }) =>
      context.isEdit ? context.entityData?.webTime : "",
    visibleWhen: (formData, context) => {
      if (context.isViewer) return false;
      if (context.isEdit) return true;
      return true;
    },
    customValidator: makeAtLeastOneValidator("Web"),
  },
  {
    label: "Tech Hours",
    name: "Technical",
    type: "flexHours",
    ui: "mui",
    required: false,
    dataType: "string",
    apiKey: "Technical",
    colSpan: 2,
    
    disableWhen: (context) => {
      // Disable if entityData.webTime exists AND user is NOT admin
      const hasWebTime = context?.entityData?.technicalTime != null; // safer check
      const notAdmin = !context?.isAdmin;
      return hasWebTime && notAdmin;
    },  forceSubmit: true,
    initValueResolver: ({ context }) =>
      context.isEdit ? context.entityData?.technicalTime : "",
    visibleWhen: (formData, context) => {
      if (context.isViewer) return false;
      if (context.isEdit) return true;
      return true;
    },
    customValidator: makeAtLeastOneValidator("Technical"),
  },

  {
    name: "TicketOverallPercentage",
    label: "Overall Ticket Progress (%)",
    type: "battery", // Or "number" depending on your registry
    ui: "mui",
    apiKey: "TicketOverallPercentage", // Matches your updated PostWorkStreamDto
    colSpan: 3,
    hidden: true,
    initValueResolver: () => false,
    options: {
      step: 10,
      max: 100,
      height: "25px",
      width: "12px",
      fontSize: "14px",
    },
    groupName: "Ticket Status Update", // 👈 This triggers the Header
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
    initValueResolver: ({ context }) =>
      context.isEdit ? context.entityData?.description : "",
    apiKey: "Description",
    customValidator:(value)=>{
      console.log("value",value);
      
      const stripped=value?.replace(/<[^>]*>/g,"").trim();
      if(!stripped){
        return "Description is required";
      }
      return true
    }
  },
  {
    name: "Status",
    label: "Ticket Status",
    type: "select",
    ui: "mui",
    apiKey: "Status",
    options: statusOptions,
    required: true,
    optionsResolver: ({ context }) => {
      return context?.isEdit
        ? statusOptions // Edit => show all including InActive
        : statusOptions.filter((opt) => opt.value.id !== 17  && opt.value.id !== 10); // Create => hide InActive
    },
    initValueResolver: ({ context }) => {
      console.log("initValueResolver called");
      console.log("context:", context);
    
      if (!context.isEdit || !context.entityData) {
        console.log("No edit mode or no entityData → returning default Active");
        console.log("return value:", statusOptions[0]);
        return statusOptions[0]; // default Active
      }
    
      const apiStatus = context.entityData.statusId;
      console.log("apiStatus from entityData:", apiStatus);
      console.log("all statusotions:", statusOptions.map(o=>({label:o.label,id:o.value?.id})));
      const matchedOption =
        statusOptions.find((opt) => opt.value.id === Number(apiStatus)) ||
        statusOptions[0];
    
      console.log("matchedOption:", matchedOption);
    
      return matchedOption;
    },
    visibleWhen: (formData, context) => {
      return !context?.isViewer;
    },
  },
];
