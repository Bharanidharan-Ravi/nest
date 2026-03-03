import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { GoIssueClosed, GoIssueOpened } from "react-icons/go";

dayjs.extend(relativeTime);

const RepoCardList = ({ item }) => {
  const statusIcon =
    item.status === "Active" ? (
      <GoIssueOpened className="text-green-500" />
    ) : item.status === "Inactive" ? (
      <GoIssueClosed className="text-red-500" />
    ) : null;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center">
        {statusIcon && <span className="mr-2">{statusIcon}</span>}

        <h6 className="text-ghBlue font-semibold text-sm m-0">#{item.key}</h6>
        <span className="mx-1">.</span>
        <h3 className="text-ghBlue font-semibold text-sm m-0">{item.title}</h3>
      </div>
      {/* <p className="text-ghMuted text-sm">{item.owner}</p> */}
      <p className="text-xs text-ghMuted ">
        Updated: {dayjs(item.updatedAt).fromNow()}
      </p>
    </div>
  );
};

export default RepoCardList;
