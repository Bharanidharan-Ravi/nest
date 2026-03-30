// modules/repository/repository.form.config.js

export const RepoFieldConfig = () => [
  /* --------------------------------------------------
     Repository Title
  -------------------------------------------------- */
  {
    label: "Repository",
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
  

  /* --------------------------------------------------
     Repository Users (Group Multi)
  -------------------------------------------------- */
  {
    label: "Repository User",
    name: "credentials",
    type: "group",
    isMulti: true,
    ui: "mui",
    apiKey: "userLists",

    fields: [
      {
        label: "Mail Id",
        name: "mailId",
        apiKey: "MailId",
        dataType: "string",
        required: false,
      },
      {
        label: "UserName",
        name: "userName",
        apiKey: "UserName",
        dataType: "string",
        required: false,
      },
      {
        label: "password",
        name: "password",
        apiKey: "Password",
        dataType: "string",
        required: false,
        customValidator: (value) =>
          value?.length >= 4 || "Password must be minimum 4 characters",
      },
      {
        label: "Phone Number",
        name: "phoneNumber",
        apiKey: "PhoneNumber",
        dataType: "string",
        pattern: "^[0-9]{10}$",
        errorMessage: "Enter valid 10 digit number",
      },

      /* Hidden default role */
      {
        key: "role",
        apiKey: "Role",
        hidden: true,
        defaultValue: 3,
        dataType: "number",
      },

      /* Hidden UserId (for edit) */
      {
        key: "userId",
        apiKey: "UserId",
        hidden: true,
        defaultValue: null,
        dataType: "string",
      },
    ],
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

  /* --------------------------------------------------
     Owner Selection (Example multi-map)
     One input → Owner1 + Owner2
  -------------------------------------------------- */
  // {
  //   label: "Primary Owner",
  //   name: "owner",
  //   type: "select",
  //   masterKey: "EmployeeList",

  //   apiKey: "Owner1",
  //   mapTo: ["Owner1", "Owner2"],
  //   ui: "mui",
  //   options: [
  //     { label: "Alice", value: "Alice1" },
  //     { label: "Bob", value: "Bob1" },
  //     { label: "Charlie", value: "Charlie" },
  //   ],
  //   dataType: "string",
  // },

  /* --------------------------------------------------
     Status with transform
     UI gives number
     Backend expects string
  -------------------------------------------------- */
  // {
  //   label: "Status",
  //   name: "status",
  //   type: "select",

  //   dataType: "string",
  //   apiKey: "Status",

  //   transform: (value) => (value === 1 ? "Active" : "Inactive"),
  // },

  /* --------------------------------------------------
     Hidden Default Field (Auto Inject)
  -------------------------------------------------- */
  // {
  //   name: "repoKey",
  //   apiKey: "RepoKey",
  //   hidden: true,
  //   defaultValue: null,
  //   dataType: "string",
  // },


// export const RepoFieldConfig = () => {
//   const RepoFields = [
//     {
//       label: "Repository",
//       name: "title",
//       type: "text",
//       required: true,
//       ApiValue: "Title",
//       ui: "mui",
//     },
//     {
//       label: "Repository User",
//       name: "credentials",
//       type: "group",
//       isMulti: true,
//       ApiValue: "userLists",
//       fields: [
//         { label: "Mail Id", key: "mailId" },
//         { label: "UserName", key: "userName" },
//         { label: "Password", key: "password" },
//         { label: "Phone Number", key: "phoneNumber" },
//       ],
//       ui: "mui",
//     },
//     {
//       label: "Description",
//       name: "description",
//       type: "CommentBar",
//       required: true,
//       ApiValue: "Description",
//     }, ];
//   return { RepoFields };
// };
