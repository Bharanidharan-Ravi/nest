import dayjs from "dayjs";

export const HolidayDataTable = {
    syncUrl: false,
    defaultView: "table",
    enableSearch: false,
    enableSelection: false,
    enableTabs: false,
    enableEdit: true,
    enableSort: false,
    enableFooter: false,
    infinite: true,
    columns: [
        {
            key: "HolidayDate",
            label: "Date",
            render: (item) => (
                <div className={`h-30 ${item.status === 'past' ? 'text-gray-400' : 'text-gray-900'}`}>
                    {item.HolidayDate ? dayjs(item.HolidayDate).format("DD/MM/YYYY") : "-"}
                </div>
            ),
        },
        {
            key: "Day",
            label: "Day",
            render: (item) => (
                <div className={`h-30 font-medium ${item.status === 'past' ? 'text-gray-400' : 'text-gray-900'}`}>{item.Day}
                </div>
            ),
        },
        {
            key: "HolidayName",
            label: "Holiday Name",
            render: (item) => (
                <div className="h-30 flex items-center gap-2">
                    <span className={item.status === 'past' ? 'text-gray-400' : 'text-gray-900'}>
                        {item.HolidayName}
                    </span>

                    {item.status === 'today' && (
                        <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                            Holiday
                        </span>
                    )}

                    {item.status === 'next' && (
                        <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                            Upcoming
                        </span>
                    )}
                </div>
            ),
        },
    ],
};