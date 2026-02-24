import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

// Import some clean icons
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PauseCircleFilledIcon from "@mui/icons-material/PauseCircleFilled";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import ProjectCard from "../components/ProjectCard";

// Activate the relative time plugin so we get "2 hours ago", "a month ago", etc.
dayjs.extend(relativeTime);


export const ProjUIConfig = {
  defaultView: "card",
  pageSize:10,
  enableSearch: true,
  enableTabs: true, // 👈 required
  enableSort: true,
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
    field: "updatedAt", // default field
    order: "desc", // default newest
  },

  sortFields: [
    { key: "createdAt", label: "Created on" },
    { key: "updatedAt", label: "Last updated" },
  ],

  sortOrders: [
    { key: "desc", label: "Newest" },
    { key: "asc", label: "Oldest" },
  ],

  tabConfig: [
    {
      key: "open", // UI key
      label: "Open", // What user sees
      field: "status",
      filterValue: "Active", // Actual DB value
    },
    {
      key: "closed",
      label: "Closed",
      field: "status",
      filterValue: "Inactive",
    },
  ],
 cardRenderer: (item) => <ProjectCard item={item} />,
};
