import "./ThreadListCard.css";
import { HtmlRenderer } from "../../../../app/shared/utilities/utilities";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

const getInitials = (name) => {
  if (!name) return "";
  const nameParts = name.split(" ");
  const initials = nameParts.map((part) => part[0].toUpperCase()).join("");
  return initials;
};

function formatDateRange(fromTime, toTime) {
  const currentYear = dayjs().year(); // Get current year

  // Parse fromTime and toTime using dayjs
  const from = dayjs(fromTime);
  const to = dayjs(toTime);

  // Format the dates
  const formattedFrom = from.format(
    currentYear === from.year() ? "D MMM h:mm A" : "D MMM YYYY h:mm A",
  );
  const formattedTo = to.format(
    currentYear === to.year() ? "D MMM h:mm A" : "D MMM YYYY h:mm A",
  );

  return `${formattedFrom} - ${formattedTo}`;
}

const ThreadListCard = ({ item }) => {
  dayjs.extend(relativeTime);

  return (
    <div className="p-2 bg-white rounded-md ">
      <div className="flex items-start gap-3 text-sm text-gray-600 mb-2">
        <div
          className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center
         justify-center text-[12px] font-bold"
        >
          {getInitials(item.CreatedBy)}
        </div>

        <div>
          <div className="font-medium">{item.CreatedBy || "Unknown User"}</div>
          <div className="text-xs text-gray-500">
            <span>Created: {dayjs(item.createdAt).fromNow()}</span>
          </div>
        </div>
      </div>

      {/* Modern Box for Comment */}
      <div className=" p-4 rounded-lg border border-gray-200 mb-4">
        <HtmlRenderer html={item.description} />
      </div>

      <div className="flex justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div>{formatDateRange(item.fromTime, item.toTime)}</div>
          <strong>Total Working Hours:</strong>{" "}
          <span>{item.Hours || "N/A"}</span>
        </div>

        <div className="flex items-center gap-1">
          <strong>Updated:</strong>{" "}
          <span>{dayjs(item.UpdatedAt).fromNow()}</span>
        </div>
      </div>
    </div>
  );
};

export default ThreadListCard;
