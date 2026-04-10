export const EmployeeConfig = () => [
  {
    label: "Attachment",
    name: "Attachment",
    type: "adAttach",
    ui: "mui",
    required: false,
    dataType: "string",
    // customComponent:FileAttachmentInput,
    apiKey: "temp",
    fullWidth: true,
    // Attachment field
    initValueResolver: ({ context }) =>
      context.isEdit ? context.entityData?.PreviewUrl : "",
  },

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
    // initValueResolver: (context) =>
    //   context.isEdit ? context.entityData?.CreatedFor : "",
  },
  {
    label: "Employee",
    name: "Employee",
    type: "group",
    View: false,
    isMulti: false,
    ui: "mui",
    apiKey: "Employee",
    // initValueResolver: (context) =>
    //   context.isEdit ? context.entityData?.CreatedFor : "",

    fields: [
      {
        label: "Employee Name",
        name: "EmployeeName",
        type: "text",
        ui: "mui",
        required: true,
        dataType: "string",
        apiKey: "EmployeeName",
        initValueResolver: ({ context }) => {
          return context.isEdit ? (context.entityData?.UserName ?? "") : "";
        },
      },

     {
        label: "Team",
        name: "Team",
        type: "select",
        ui: "mui",
        required: false,
        dataType: "string",
        apiKey: "Team",
        // 1. ALWAYS provide the full list of teams from masterData
        optionsResolver: ({ context }) => {
          return (context?.data?.TeamMaster || []).map((team) => ({
            label: team.TeamName,
            value: {
              id: team.TeamId,
              name: team.TeamName,
            },
          }));
        },
        // 2. Just return the Team ID so MUI knows which option to highlight
        initValueResolver: ({ context }) => {
         if (!context?.isEdit) return ""; 

          const teamId = context?.entityData?.Team; // e.g., "2"
          if (!teamId) return "";

          // 🔥 Find the matching team in your master data
          const team = context?.data?.TeamMaster?.find(
            (t) => String(t.TeamId) === String(teamId)
          );

          // Return the exact same structure as optionsResolver
          if (team) {
            return {
              label: team.TeamName,
              value: {
                id: team.TeamId,
                name: team.TeamName,
              },
            };
          }

          return teamId; // Fallback just in case it's not found in masterData
        },
      },
      {
        label: "Role",
        name: "Role",
        type: "text",
        ui: "mui",
        hidden: true,
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
        initValueResolver: ({ context }) => {
          return context.isEdit
            ? (context.entityData?.Specialization ?? "")
            : "";
        },
      },
        {
        label: "DoB",
        name: "DoB",
        type: "date",
        ui: "mui",
        required: false,
        dataType: "string",
        apiKey: "DoB",
        initValueResolver: ({ context }) => {
          return context.isEdit
            ? (context.entityData?.DoB ?? "")
            : "";
        },
      },
      {
        label: "Email",
        name: "Email",
        type: "text",
        ui: "mui",
        required: false,
        dataType: "string",
        apiKey: "Email",
        initValueResolver: ({ context }) => {
          return context.isEdit ? (context.entityData?.Email ?? "") : "";
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
        initValueResolver: ({ context }) => {
          return context.isEdit ? (context.entityData?.PhoneNumber ?? "") : "";
        },
      },
    ],
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
        initValueResolver: ({ context }) => {
          return context.isEdit ? (context.entityData?.LoginName ?? "") : "";
        },
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
        visibleWhen: (formData, context) => !context?.isEdit,
      },
      {
        label: "Role",
        name: "Role",
        type: "text",
        ui: "mui",
        hidden: true,
        defaultValue: 2,
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
      {
        name: "status",
        label: "Label Status",
        type: "select",
        ui: "mui",
        apiKey: "Status",
        // options: statusOptions,
        required: true,
        options: [
          { label: "Active", value: { id: "Active", name: "Active" } },
          { label: "Inactive", value: { id: "Inactive", name: "Inactive" } },
        ],
        visibleWhen: (formData, context) => context?.isEdit,
        initValueResolver: ({ context }) => {
          return context.isEdit ? (context.entityData?.Status ?? "") : "";
        },
      },
    ],
  },
];
