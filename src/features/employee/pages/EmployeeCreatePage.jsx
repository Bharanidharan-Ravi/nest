import EntityFormPage from "../../../packages/crud/pages/EntityFormPage";
import { EmployeeFormConfig } from "../config/EmployeeForm";
import { useParams }      from "react-router-dom"
import { getEmployeeList, getTeamMaster } from "../hooks/useEmployeeList";
import { useMasterData } from "../../../core/master/masterCall/useMasterData";

const EmployeeCreate = () => {

  const params = useParams();

  const isEdit = !!params.employeeId

  const { data: EmployeeListWrapper } = getEmployeeList(
    isEdit ? params.employeeId : null
  )

  const config = ["TeamMaster"];
  const {data} = useMasterData(config);
  
  const entityData =
    isEdit && Array.isArray(EmployeeListWrapper)
      ? EmployeeListWrapper.find((emp) => emp.UserID === params.employeeId) || null
      : null;

    const dynamicConfig = {
      ...EmployeeFormConfig,
      // PUT /api/label/{id} on edit, POST /api/label on create
      api: isEdit ? `Employee/update/${params.employeeId}` : EmployeeFormConfig.api,
      // fields: isEdit
      //   ? [...EmployeeFormConfig.fields, statusField]  // status only on edit
      //   : EmployeeFormConfig.fields,
    }

    return (
      <div>
        <h2>{isEdit ? "Edit Employee" : "Create Employee"}</h2>
        <EntityFormPage
          mode={isEdit ? "Update" : "Create"}
          config={dynamicConfig}
          context={{ params, isEdit, entityData, data }}
          module="Employee"
        />
      </div>
    )
  }
  
export default EmployeeCreate;
