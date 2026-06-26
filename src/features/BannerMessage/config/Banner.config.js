export const BannerFieldConfig=()=>[
    {
        label: "MessageText",
        name: "MessageText",
        type: "text",
        ui: "mui",
    
        required: false,
        dataType: "string",
        apiKey: "MessageText",
    
        initValueResolver: ({context}) =>
          context.isEdit ? context.entityData?.MessageText ?? "" : "",
      },
      // {
      //   label: "MessageType",
      //   name: "MessageType",
      //   type: "select",
      //   ui: "mui",
    
      //   required: false,
      //   dataType: "string",
      //   apiKey: "MessageTypeId",
       
      //   initValueResolver: ({context}) =>
      //     context.isEdit ? context.entityData?.MessageTypeId ?? "" : "",
      // },

      {
        label: "StartDate",
        name: "StartDate",
        type: "date",
        ui: "mui",
        initValueResolver: ({ context }) =>
          context.isEdit ? context.entityData?.StartDate : "",
        required: false,
        dataType: "string",
        apiKey: "StartDate",
    
        // pattern: "^[A-Za-z0-9 ]+$",
        // errorMessage: "Only alphanumeric allowed",
    
        visibleWhen: (formData, context) => {
          if (!context.isViewer) {
            return true;
          }
          if (context.isViewer ) {
            return false;
          }
          return true;
        },
        customValidator: (value, data, context) => {
          if (context?.isEdit) {
            return true;
          }
          if (!value) return true;
          const StartDate = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (StartDate < today) {
            return "start date cant be in past";
          }
          return true;
        },
      },
      {
        label: "EndDate",
        name: "EndDate",
        type: "date",
        ui: "mui",
        initValueResolver: ({ context }) =>
          context.isEdit ? context.entityData?.EndDate : "",
        required: false,
        dataType: "string",
        apiKey: "EndDate",
    
        // pattern: "^[A-Za-z0-9 ]+$",
        // errorMessage: "Only alphanumeric allowed",
    
        visibleWhen: (formData, context) => {
          if (!context.isViewer) {
            return true;
          }
          if (context.isViewer ) {
            return false;
          }
          return true;
        },
        customValidator: (value, data, context) => {
          if (context?.isEdit) {
            return true;
          }
          if (!value) return true;
          const EndDate = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (EndDate < today) {
            return "start date cant be in past";
          }
          const StartDate=data?.StartDate?new Date(data.StartDate):null;
          if(StartDate&&EndDate<StartDate){
            return"End date cant be before start date"
          }
          return true;
        },
      },
      
]