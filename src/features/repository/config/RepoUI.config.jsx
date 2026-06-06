import dayjs from "dayjs";
import relativeTime from 'dayjs/plugin/relativeTime';
import RepoCardList from "../Components/RepoCard";

dayjs.extend(relativeTime);

export const RepoUIConfig = {
  data: [],
  columns: [
    { key: "title", label: "Title" },
    { key: "status", label: "Status" },
    { key: "priority", label: "Priority" },
  ],
  filters: [
    {
      key: "status",
      options: [
        { label: "All", value: "" },
        { label: "Active", value: "Active" },
        { label: "Inactive", value: "Inactive" },
      ],
    },
  ],
  cardRenderer: (item) => (
    <div className="border p-3 rounded">
      <h3>{item.title}</h3>
      <p>{item.status}</p>
    </div>
  ),
};

export const repoListConfig = {
  defaultView: "card",
  pageSize:100,
  enableSearch: true,
  enableTabs: true, // 👈 required
  enableSort: true,
  // allowViewSwitch: true,
  filters: [
    {
      key: "status",
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
  columns: [
    { key: "title", label: "Title" },
    { key: "author", label: "Author" },
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
  cardRenderer: (item) => <RepoCardList item={item} />
};





export const CustomerData = {
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
      label: "UserName",
      render: (item) => <div className="h-30">{item.UserName}</div>,
    },
    {
      key: "MailId",
      label: "MailId",
      render: (item) => <div className="h-30">{item.MailId}</div>,
    },
    {
      key: "PhoneNumber",
      label: "PhoneNumber",
      render: (item) => <div className="h-30">{item.PhoneNumber}</div>,
    },
    // {
    //   key: "RepoKey",
    //   label: "RepoKey",
    //   render: (item) => <div className="h-30">{item.RepoKey}</div>,
    // },

    // {
    //   key: "Status",
    //   label: "Status",
    //   render: (item) => <div className="h-30">{item.Status}</div>,
    // },
    
    {
      key: "WGUserName",
      label: "Login Username",
      render: (item) => <div className="h-30">{item.WGUserName}</div>,
    },
    
  ],
};
