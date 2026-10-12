import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { GoIssueClosed, GoIssueOpened } from "react-icons/go";
import { formatDate } from "../../../app/shared/utils/dateFormat";

dayjs.extend(relativeTime);

const Bannerlist = ({ item }) => {
  const statusIcon =
    item.status === "Active" ? (
      <GoIssueOpened className="text-green-500" />
    ) : item.status === "Inactive" ? (
      <GoIssueClosed className="text-red-500" />
    ) : null;

  return (
    <div className={`flex flex-col gap-2 ${
      item.ToClient ? "border-l-4 border-orange-300 pl-2":""}`}>
      <div className="flex items-center gap-2">
        {statusIcon && <span className="flex-shrink-0">{statusIcon}</span>}

        <h6 className="text-ghBlue font-semibold text-sm m-0">{item.Type_Name}</h6>
        <span className="text-ghMuted">·</span>
        <h3 className="text-ghBlue font-semibold text-sm m-0">{item.MessageText}</h3>
      </div>

      <p className="flex items-center gap-2 text-ghMuted text-xs m-0">
        <span>{formatDate(item.StartDate)}</span>
        <span className="text-ghMuted">-</span>
        <span>{formatDate(item.EndDate)}</span>
      </p>
    </div>
  );
};

export default Bannerlist;