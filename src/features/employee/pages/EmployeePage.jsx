import { ListProvider } from "../../../packages/ui-List/components/ListProvider"
import { ListLayout }   from "../../../packages/ui-List/components/ListLayout"
import { getEmployeeList } from "../hooks/useEmployeeList"
import { useSmartNavigation } from "../../../core/navigation/useSmartNavigation"
import { EmployeedataTable } from "../config/EmployeeUI"
import { ROUTE_KEYS }    from "../../../core/routing/paths"
import { readUserFromSession } from "../../../core/auth/useCurrentUser"

const EmployeePage=()=>{
  const user = readUserFromSession();
  const { goTo } = useSmartNavigation()


const { data: EmployeeList, isLoading, isError, error } = getEmployeeList();
  
  // Log the whole state so you know exactly what React Query is doing
  console.log("Query State:", { isLoading, isError, error, EmployeeList });


const normalizeLabel = (Emp) => {
  // Parse the Attachment_JSON string into an array of objects
  const attachments = Emp.Attachment_JSON ? JSON.parse(Emp.Attachment_JSON) : [];

    return {
    UserID:Emp.UserID,
    UserName:Emp.UserName,
    AvatarPath:Emp?.PreviewUrl,
    Team:Emp.Team,
    Role:Emp.Role,
    Specialization:Emp.Specialization,
    Status:Emp.Status,
    CreatedBy:Emp.CreatedBy,
    CreatedAt:Emp.CreatedAt,
    Email:Emp.Email,
    PhoneNumber:Emp.PhoneNumber,
    DoB:Emp.DoB,

    }
  }

  const Employee = Array.isArray(EmployeeList)
    ? EmployeeList?.map(normalizeLabel)
    : []
    return (
        <>
          <div className="flex justify-between items-center mb-3 flex-none">
            <h2>EmployeeData</h2>
    
            <button
              onClick={() => goTo(ROUTE_KEYS.EMPLOYEE_CREATE)}
              className="bg-brand-yellow text-white px-4 py-2 rounded-md font-medium hover:bg-yellow-500 transition-colors"
            >
              Add Employee
            </button>
          </div>
    
          <div className="flex-1 min-h-0">
            <ListProvider config={EmployeedataTable} data={Employee}>
              <ListLayout />
            </ListProvider>
          </div>
        </>
      )
}

export default EmployeePage
