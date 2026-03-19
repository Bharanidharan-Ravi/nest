import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

// Import some clean icons
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PauseCircleFilledIcon from "@mui/icons-material/PauseCircleFilled";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined";
import ProjectCard from "../components/ProjectCard";

// Activate the relative time plugin so we get "2 hours ago", "a month ago", etc.
dayjs.extend(relativeTime);

export const ProjUIConfig = {
  defaultView: "card",
  pageSize: 10,
  infinite: true,
  enableSearch: true,
  enableTabs: true, // 👈 required
  enableSort: true,
  enableSelection: true,
  enableEdit: true,
  // allowViewSwitch: true,
  filters: [
    {
      key: "employee",
      options: [
        { label: "All", value: "" },
        { label: "Active", value: "Active" },
        { label: "Inactive", value: "Inactive" },
      ],
    },
  ],
  defaultSort: {
    field: "UpdatedAt", // default field
    order: "desc", // default newest
  },

  sortFields: [
    { key: "CreatedAt", label: "Created on" },
    { key: "UpdatedAt", label: "Last updated" },
  ],

  sortOrders: [
    { key: "desc", label: "Newest" },
    { key: "asc", label: "Oldest" },
  ],

  tabConfig: [
    {
      key: "open",
      label: "Open",
      field: "status",
      // Exclude OnHold(13), Closed(14), Cancelled(15), Inactive(16)
      // Anything NOT in this list will be treated as an Open/Active ticket
      excludeValues: [13, 14, 15, 16],
    },
    {
      key: "closed",
      label: "Closed",
      field: "status",
      // Specifically include these IDs for the Closed tab
      filterValue: [13, 14, 15, 16],
    },
  ],
  cardRenderer: (item) => <ProjectCard item={item} />,
};
