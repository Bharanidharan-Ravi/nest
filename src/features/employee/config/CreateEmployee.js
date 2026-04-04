

export const EmployeeConfig = () => [


  // {
  //   label: "Attachment",
  //   name: "Attachment",
  //   type: "adAttach",
  //   ui: "mui",
  //   required: false,
  //   dataType: "string",
  //   // customComponent:FileAttachmentInput,
  //   apiKey: "temp",
  //   fullWidth:true,
  // },
  


  {
    label: "CreatedFor",
    name: "CreatedFor",
    type: "text",
    ui: "mui",
    required: false,
    hidden: true,
    defaultValue: "Employee",
    dataType: "string",
    apiKey: "CreatedFor",

  },
  {
    label: "Employee",
    name: "Employee",
    type: "group",
    View: false,
    isMulti: false,
    ui: "mui",
    apiKey: "Employee",
    fields: [
      {
        label: "Employee Name",
        name: "EmployeeName",
        type: "text",
        ui: "mui",
        required: true,
        dataType: "string",
        apiKey: "EmployeeName",
      },

      {
        label: "Team",
        name: "Team",
        type: "text",
        ui: "mui",
        required: false,
        dataType: "string",
        apiKey: "Team",
      },

      {
        label: "Role",
        name: "Role",
        type: "text",
        ui: "mui",
        defaultValue: 2,
        required: false,
        dataType: "number",
        apiKey: "Role",
      },

      {
        label: "Specialization",
        name: "Specialization",
        type: "text",
        ui: "mui",
        required: false,
        dataType: "string",
        apiKey: "Specialization",

      },
      {
        label: "Email",
        name: "Email",
        type: "text",
        ui: "mui",
        required: false,
        dataType: "string",
        apiKey: "Email",
      },
      {
        label: "PhoneNumber",
        name: "PhoneNumber",
        type: "text",
        ui: "mui",
        required: false,
        dataType: "string",
        apiKey: "PhoneNumber",
      },
      
      
    ]
  },

  {
    label: "User Login",
    name: "credentials",
    type: "group",
    View: false,
    isMulti: false,
    ui: "mui",
    apiKey: "Login",
    fields: [

      {
        label: "UserName",
        name: "UserName",
        type: "text",
        apiKey: "UserName",
        dataType: "string",
        required: true,
      },
      {
        label: "password",
        name: "Password",
        type: "text",
        apiKey: "Password",
        dataType: "string",
        required: true,
        customValidator: (value) =>
          value?.length >= 4 || "Password must be minimum 4 characters",
      },
      {
        label: "Role",
        name: "Role",
        type: "text",
        ui: "mui",
        required: false,
        dataType: "number",
        apiKey: "Role",
      },
      {
        label: "DBName",
        name: "DBName",
        type: "text",
        ui: "mui",
        hidden: true,
        defaultValue: "WG_APP",
        dataType: "string",
        apiKey: "DBName",
      },
    ],
  },

]