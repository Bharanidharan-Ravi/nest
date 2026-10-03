export const HolidayConfig = () => [
    {
        label: "Date",
        name: "HolidayDate",
        type: "date",
        ui: "mui",
        required: true,
        dataType: "string",
        apiKey: "HolidayDate",
        initValueResolver: ({context}) => {
            return context.isEdit && context.entityData?.HolidayDate
            ? context.entityData.HolidayDate.split('T')[0]
            : "";
        },
        customValidator: (value, formData, context) => {
            if (!value || !context?.data) return true;
            const selectedDate = value.split('T')[0];
            const duplicate = context.data.find((h) => {
                const existingDate = h.HolidayDate ? h.HolidayDate.split('T')[0] : "";
                return existingDate === selectedDate;
            });

            if (duplicate) {
                if (context.isEdit && String(duplicate.Id) === String(context.entityData?.Id)) {
                    return true;
                }
                return "A holiday is already registered on this date";
            }
            return true;
        },
    },
    {
        label: "Holiday Name",
        name: "HolidayName",
        type:"text",
        ui:"mui",
        required: true,
        dataType: "string",
        apiKey: "HolidayName",
        initValueResolver: ({context}) => {
            return context.isEdit ? (context.entityData?.HolidayName ?? "") : "";
        },
    },
];