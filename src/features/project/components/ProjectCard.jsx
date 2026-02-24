import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PauseCircleFilledIcon from "@mui/icons-material/PauseCircleFilled";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';

dayjs.extend(relativeTime);

export default function ProjectCard({ item }) {
  const displayDate = item.UpdatedAt || item.createdAt;
  const displayUser = item.UpdatedBy || item.CreatedBy || "System";
  
  const getInitials = (name) => {
    if (!name) return "U"; 
    const parts = name.trim().split(" ");
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };
    // 3. Mock progress value (Replace with item.progress when your API has it)
    // const progress = item.progress || Math.floor(Math.random() * 60) + 20; 
  return (
    <div className="flex flex-col gap-3 pt-1">
      {/* ROW 1: Status Icon + Key + Title */}
      <div className="flex items-start gap-3">
        <div className="mt-0.5" title={`Status: ${item.status}`}>
          {item.status === "Active" ? (
            <CheckCircleIcon className="text-green-500" fontSize="small" />
          ) : (
            <PauseCircleFilledIcon className="text-gray-400" fontSize="small" />
          )}
        </div>
        
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-medium text-gray-500 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded">
              {item.key || "NO-KEY"}
            </span>
            <h3 className="text-gray-900 font-semibold text-base m-0 leading-tight">
              {item.title}
            </h3>
          </div>
        </div>
      </div>

      {/* ROW 2: User Avatar & Name */}
      <div className="flex items-center gap-2 text-sm text-gray-600 pl-[30px]">
        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
          {getInitials(item.owner)}
        </div>
        <span className="font-medium">{item.owner || "Unassigned"}</span>
      </div>

      {/* ROW 3: FOOTER */}
      <div className="flex items-center justify-between mt-1 pt-3 border-t border-gray-100 pl-1 pr-1">
        <p className="text-xs text-gray-500 m-0">
          Updated <span className="font-medium">{dayjs(displayDate).fromNow()}</span> by {displayUser}
        </p>

        {/* <div className="flex items-center gap-1 text-xs font-medium text-brand-yellow bg-yellow-50 border border-yellow-200 px-2 py-1 rounded-full cursor-pointer hover:bg-yellow-100 transition-colors">
           <ConfirmationNumberOutlinedIcon style={{ fontSize: '14px' }} />
           <span>Active Tickets</span>
        </div> */}
      </div>
      
        {/* 🔥 ROW 4: The Thin Progress Bar */}
        {/* Uses negative margins (-mx-3 -mb-3) to stretch exactly to the edges of the ListCard container's padding */}
        {/* <div className="h-1 w-[calc(100%+24px)] -ml-3 -mb-3 mt-2 bg-gray-100 rounded-b-md overflow-hidden">
          <div 
            className="h-full bg-green-500 transition-all duration-500" 
            style={{ width: `${progress}%` }} 
          />
        </div> */}
    </div>
  );
}