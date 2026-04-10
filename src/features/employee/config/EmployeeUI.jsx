import dayjs from "dayjs";
import { HtmlRenderer } from "../../../app/shared/utilities/utilities";

export const EmployeedataTable = {
  syncUrl: false,
  defaultView: "table",
  enableSearch: false,
  enableSelection: false,
  enableTabs: true,
  enableEdit: true,
  theme: {
    extend: {
      height: {
        30: "30px",
      },
    },
  },
  enableSort: false,
  enableFooter: false,
  infinite: true,
  tabConfig: [
    {
      key: "active",
      label: "Active",
      field: "Status",
      filterValue: "Active",
    },
    {
      key: "inactive",
      label: "Inactive",
      field: "Status",
      filterValue: "Inactive",
    },
  ],

  columns: [
    {
      key: "UserName",
      label: "Employee",
      render: (item) => <div className="h-30">{item.UserName}</div>,
    },
    {
      key: "Specialization",
      label: "Specialization",
      render: (item) => <div className="h-30">{item.Specialization}</div>,
    },
    {
      key: "DoB",
      label: "DoB",
      render: (item) => <div className="h-30">{item.DoB ? dayjs(item.DoB).format("DD-MM-YYYY") : "-"}</div>,
    },
    {
      key: "Email",
      label: "Email",
      render: (item) => <div className="h-30">{item.Email}</div>,
    },
    {
      key: "EmaPhoneNumberil",
      label: "PhoneNumber",
      render: (item) => <div className="h-30">{item.PhoneNumber}</div>,
    },
    {
      key: "AvatarPath",
      label: "Avatar",
      render: (item) => {
        const relativepath = item?.AvatarPath;
        return (
          <div className="flex items-center justify-center h-30">
            {relativepath ? (
              <img
                className="h-10 W-10 rounded-full object-cover border"
                src={`${relativepath}`}
                alt="Avatar"
              />
            ) : (
              <img
                className="h-10 W-10 rounded-full object-cover border"
                src="default-avatar-path.jpg"
                alt="Default Avatar"
              />
            )}
          </div>
        );
      },
    },
  ],
};
