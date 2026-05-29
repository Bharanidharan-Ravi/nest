// export const CustomerConfig = () => [
  
//     {
//       label: "Customer Name",
//       name: "CustomerName",
//       type: "text",
//       ui: "mui",
//       required: false,
//       dataType: "string",
//       apiKey: "CustomerName",
//       initValueResolver: (context) =>
//         context.isEdit ? context.entityData?.UserName : "",
//     },

//     {
//         label: "Mail Id",
//         name: "MailId",
//         type: "text",
//         ui: "mui",
//         required: false,
//         dataType: "string",
//         apiKey: "MailId",
//         initValueResolver: (context) =>
//           context.isEdit ? context.entityData?.MailId : "",
//       },
   
//       {
//         label: "PhoneNumber",
//         name: "PhoneNumber",
//         type: "text",
//         ui: "mui",
//         required: false,
//         dataType: "string",
//         apiKey: "PhoneNumber",
//         initValueResolver: (context) =>
//           context.isEdit ? context.entityData?.PhoneNumber : "",
//       },
   
//     {
//         label: "Login Username",
//         name: "UserName",
//         type: "text",
//         ui: "mui",
//         required: false,
//         dataType: "string",
//         apiKey: "UserName",
        
//         initValueResolver: (context) =>
//           context.isEdit ? context.entityData?.WGUserName : "",
//       },
   
//       {
//         label: "Password",
//         name: "Password",
//         type: "text",
//         ui: "mui",
//         required: false,
//         dataType: "string",
//         apiKey: "Password",
       
//       },
   
     
//       {
//         label: "Status",
//         name: "Status",
//         type: "select",
//         ui: "mui",
//         required: false,
//         dataType: "string",
//         apiKey: "Status",
//         options: [
//             { label: "Active", value: { id: "Active", name: "Active" } },
//             { label: "Inactive", value: { id: "Inactive", name: "Inactive" } },
//           ],
//           visibleWhen: (formData, context) => context?.isEdit,
//           initValueResolver: ({ context }) => {
//             return context.isEdit ? (context.entityData?.Status ?? "") : "";
//           },
//       },
//       {
//         name: "Repo_Id",
//         dataType: "string",
//         apiKey: "Repo_Id",
//         initValueResolver: (context) =>context.params?.repoId ?? "",
//       },
//       {
//         name: "RepoKey",
//         required: false,
//         dataType: "string",
//         apiKey: "RepoKey",
//         initValueResolver: (context) =>context.params?.editRepoKey ?? "",
//       },
//       {
//         name: "Role",
//         required: false,
//         dataType: "number",
//         defaultValue:"3",
//         required: false,
//         apiKey: "Role",
       
//       },
     
   
   
//   ];
export const CustomerConfig = () => [
  {
    label: "Customer Name",
    name: "CustomerName",
    type: "text",
    ui: "mui",
    required: false,
    dataType: "string",
    apiKey: "CustomerName",
    initValueResolver: ({context}) => {
      const value = context.isEdit ? context.entityData?.UserName : "";
      return value;
    },
  },

  {
    label: "Mail Id",
    name: "MailId",
    type: "text",
    ui: "mui",
    required: false,
    dataType: "string",
    apiKey: "MailId",
    initValueResolver: ({context})=> {
      const value = context.isEdit ? context.entityData?.MailId : "";
      return value;
    },
  },

  {
    label: "PhoneNumber",
    name: "PhoneNumber",
    type: "text",
    ui: "mui",
    required: false,
    dataType: "string",
    apiKey: "PhoneNumber",
    initValueResolver: ({context}) => {
      const value = context.isEdit ? context.entityData?.PhoneNumber : "";
      return value;
    },
  },

  {
    label: "Login Username",
    name: "UserName",
    type: "text",
    ui: "mui",
    required: false,
    dataType: "string",
    apiKey: "UserName",
    initValueResolver: ({context})=> {
      const value = context.isEdit ? context.entityData?.WGUserName : "";
      return value;
    },
    visibleWhen: (formData, context) => !context?.isEdit,
  },

  {
    label: "Password",
    name: "Password",
    type: "text",
    ui: "mui",
    required: false,
    dataType: "string",
    apiKey: "Password",
    visibleWhen: (formData, context) => !context?.isEdit,
  },

  {
    label: "Status",
    name: "Status",
    type: "select",
    ui: "mui",
    required: true,
    dataType: "string",
   
    apiKey: "Status",
    options: [
      { label: "Active", value: { id: "Active", name: "Active" } },
      { label: "Inactive", value: { id: "Inactive", name: "Inactive" } },
    ],
    visibleWhen: (formData, context) => context?.isEdit,
    initValueResolver: (context ) => {
      return context.isEdit ? (context.entityData?.Status ?? "") : "";
    },
  },

  {
    name: "Repo_Id",
    dataType: "string",
    apiKey: "Repo_Id",
    initValueResolver: ({context}) => {
      const value = context.repoId ?? "";
      return value;
    },
  },

  {
    name: "Role",
    required: false,
    dataType: "number",
    defaultValue: "3",
    apiKey: "Role",
    initValueResolver: ({context}) => {
      return context.params?.Role ?? "3"; // Default to "3" if Role is not provided
    },
  },

];