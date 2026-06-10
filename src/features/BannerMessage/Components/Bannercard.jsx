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
    <div className="flex flex-col gap-1">
      <div className="flex items-center">
        {statusIcon && <span className="mr-2">{statusIcon}</span>}

        <h6 className="text-ghBlue font-semibold text-sm m-0">{item.Type_Name}</h6>
        <span className="mx-1">.</span>
        <h3 className="text-ghBlue font-semibold text-sm m-0">{item.MessageText}</h3>
      </div>
      {/* <p className="text-ghMuted text-sm">{item.owner}</p> */}
      <p className="flex items-center">
        
        <div>{dayjs(item.StartDate).format("DD/MM/YYYY")}</div><span>-</span><div>{dayjs(item.EndDate).format("DD/MM/YYYY")}</div>
      </p>
    </div>
  );
};

export default Bannerlist;
