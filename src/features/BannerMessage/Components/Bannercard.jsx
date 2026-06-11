import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { GoIssueClosed, GoIssueOpened } from "react-icons/go";

dayjs.extend(relativeTime);

const Bannerlist = ({ item }) => {
  const statusIcon =
    item.status === "Active" ? (
      <GoIssueOpened className="text-green-500" />
    ) : item.status === "Inactive" ? (
      <GoIssueClosed className="text-red-500" />
    ) : null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {statusIcon && <span className="flex-shrink-0">{statusIcon}</span>}

        <h6 className="text-ghBlue font-semibold text-sm m-0">{item.Type_Name}</h6>
        <span className="text-ghMuted">·</span>
        <h3 className="text-ghBlue font-semibold text-sm m-0">{item.MessageText}</h3>
      </div>

      <p className="flex items-center gap-2 text-ghMuted text-xs m-0">
        <span>{dayjs(item.StartDate).format("DD/MM/YYYY")}</span>
        <span className="text-ghMuted">-</span>
        <span>{dayjs(item.EndDate).format("DD/MM/YYYY")}</span>
      </p>
    </div>
  );
};

export default Bannerlist;