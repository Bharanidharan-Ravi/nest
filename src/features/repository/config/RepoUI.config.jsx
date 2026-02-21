export const RepoUIConfig = {
    data: [],
    columns: [
        { key: "title", label: "Title" },
        { key: "status", label: "Status" },
        { key: "priority", label: "Priority" }
    ],
    filters: [
    {
      key: "status",
      options: [
        { label: "All", value: "" },
        { label: "Active", value: "Active" },
        { label: "Inactive", value: "Inactive" }
      ]
    }
  ],
    cardRenderer: (item) => (
        <div className="border p-3 rounded">
            <h3>{item.title}</h3>
            <p>{item.status}</p>
        </div>
    )

}