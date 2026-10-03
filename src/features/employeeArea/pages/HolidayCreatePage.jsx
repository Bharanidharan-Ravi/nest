import EntityFormPage from "../../../packages/crud/pages/EntityFormPage";
import { HolidayFormConfig } from "../config/HolidayForm"; 
import {useParams} from "react-router-dom";
import { getHolidayList } from "../hooks/useHolidayList";
import { useCurrentUser } from "../../../core/auth/useCurrentUser";

const HolidayCreatePage = () => {
    const params = useParams();
    const {isAdmin} = useCurrentUser();
    const isEdit = !!params.holidayId;
    const { data} = getHolidayList(
        isEdit ? params.holidayId : null
    );

    const entityData = 
    isEdit && Array.isArray(data)
    ? data.find((h) => String(h.Id) === String(params.holidayId)) || null
    : null;

    const dynamicConfig = {
        ...HolidayFormConfig,
        api: isEdit ? `/employeearea/holiday/${params.holidayId}` : HolidayFormConfig.api,
    };

    return (
        <div className="p-4 md:p-6 bg-brand-gray-light h-full overflow-y-auto">
            <h2 className="mb-4">{isEdit ? "Edit Holiday" : "Create Holiday"}</h2>
            <EntityFormPage
             mode={isEdit ? "Update" : "Create"}
             config={dynamicConfig}
             context={{params, isEdit, entityData, data, isAdmin}}
             module="Holiday"
             />
        </div>
    )
}

export default HolidayCreatePage;
