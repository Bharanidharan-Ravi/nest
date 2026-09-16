import { ListProvider } from "../../../packages/ui-List/components/ListProvider";
import { ListLayout } from "../../../packages/ui-List/components/ListLayout";
import { getEmployeeList } from "../hooks/useEmployeeList";
import { useSmartNavigation } from "../../../core/navigation/useSmartNavigation";
import { EmployeedataTable } from "../config/EmployeeUI";
import { ROUTE_KEYS } from "../../../core/routing/paths";
import { readUserFromSession, useCurrentUser } from "../../../core/auth/useCurrentUser";

const EmployeePage = () => {
  const user = readUserFromSession();
  const { goTo } = useSmartNavigation();
  const { data } = getEmployeeList();
  const {isAdmin} = useCurrentUser();
  console.log("user",user);
  
  const normalizeLabel = (Emp) => {
    // Parse the Attachment_JSON string into an array of objects
    const attachments = Emp.Attachment_JSON
      ? JSON.parse(Emp.Attachment_JSON)
      : [];
      const canEdit = isAdmin || String(Emp.UserID) === String(user?.userId);

    return {
      id: Emp.UserID,
      UserName: Emp.UserName,
      AvatarPath: Emp?.PreviewUrl,
      Team: Emp.Team,
      Role: Emp.Role,
      Specialization: Emp.Specialization,
      Status: Emp.Status,
      CreatedBy: Emp.CreatedBy,
      CreatedAt: Emp.CreatedAt,
      Email: Emp.Email,
      PhoneNumber: Emp.PhoneNumber,
      DoB: Emp.DoB,
      canEdit: canEdit,
    };
  };

  const Employee = Array.isArray(data) ? data?.map(normalizeLabel) : [];

  const listConfigWithNav = {
    ...EmployeedataTable,
    enableEdit: true,
    isEditDisabled: (item) => !isAdmin && String(item?.id) !== String(user?.userId),
    onEditClick: (item) => {
      const allowed = isAdmin || String(item?.id) === String(user?.userId);
      if (!allowed) return;
      goTo(ROUTE_KEYS.EMPLOYEE_EDIT, { employeeId: item.id });
    },

    onSelectionChange: (item, isChecked) => {
      console.log(
        `Employee ${item.id} ${isChecked ? "selected" : "deselected"}`,
      );
    },
  };

  return (
    <>
      <div className="flex justify-between items-center mb-3 flex-none">
        <h2>EmployeeData</h2>

     {isAdmin && (
        <button
          onClick={() => goTo(ROUTE_KEYS.EMPLOYEE_CREATE)}
          className="bg-brand-yellow text-white px-4 py-2 rounded-md font-medium hover:bg-yellow-500 transition-colors"
        >
          Add Employee
        </button>
     )}
      </div>

      <div className="flex-1 min-h-0">
        <ListProvider config={listConfigWithNav} data={Employee}>
          <ListLayout />
        </ListProvider>
      </div>
    </>
  );
};

export default EmployeePage;
