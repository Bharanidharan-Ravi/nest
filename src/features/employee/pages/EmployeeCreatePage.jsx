import EntityFormPage from "../../../packages/crud/pages/EntityFormPage";
import { EmployeeFormConfig } from "../config/EmployeeForm";
import { useParams }      from "react-router-dom"

const EmployeeCreate = () => {

  // const params = useParams()
  // const isEdit = !!params.EmployeeId

  // const { data: labelListWrapper } = useLabelData(
  //   isEdit ? params.EmployeeId : null
  // )







  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="mb-6 pb-2 border-b border-ghBorder">
        <h2 className="text-2xl font-semibold text-ghText">
          Create Employee
        </h2>
      </div>

      <EntityFormPage 
      mode="Create" 
      config={EmployeeFormConfig} 
      module="Employee" />
    </div>
  );
};

export default EmployeeCreate;
