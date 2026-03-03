import { calcHHMM } from "../../../app/shared/utilities/utilities";

export const ThreadFieldConfig = (ticketId) => [
  {
    label: "Description",
    name: "description",
    type: "adEditor",
    ui: "editor",
    required: true,
    dataType: "string",
    apiKey: "CommentText",
  },

 {
    name: "issueId",
    apiKey: "Issue_Id",
    hidden: true,
    defaultValue: ticketId,
    dataType: "string",
  },
  {
    label: "From-time (24h Format)",
    name: "fromTime",
    type: "time",
    ui: "mui",
    required: true,
    dataType: "dateTime",
    apiKey: "From_Time",
    // errorMessage: "Only alphanumeric allowed", 
  
  },
  {
    label: "To-time (24h Format)",
    name: "toTime",
    type: "time",
    ui: "mui",
    required: true,
    dataType: "dateTime",
    apiKey: "To_Time",
    errorMessage: "To-time cannot be earlier than From-time", 
  },

  {
    name: "hours",
    apiKey: "Hours",
    hidden: false,
    dataType: "string",
    defaultValue: null,
    effectResolver: (formData) => {
      const hours = calcHHMM(formData.fromTime, formData.toTime);
      return hours;
    },
    effectDependencies: ["fromTime", "toTime"], 
    },

  //   {
  //   label: "Calculated Hours",
  //   name: "calculatedHours",
  //   type: "text",
  //   ui: "mui", 
  //   required: false,
  //   dataType: "string",
  //   apiKey: "Hours",
  //   defaultValue: null, 
  //   readOnly: true,
  //   effectResolver: (formData) => {
  //     const hours = calcHHMM(formData.fromTime, formData.toTime);
  //     return hours;
  //   },
  //   effectDependencies: ["fromTime", "toTime"],
  // },
];