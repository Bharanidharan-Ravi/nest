import React from "react";
import { FaCalendarAlt, FaEdit } from "react-icons/fa";
import { formatDate, HtmlRenderer } from "../../../../app/shared/utilities/utilities";
import { ROUTE_KEYS } from "../../../../core/routing/paths";

const ParentTicketHeader = ({
  parentTicket,
  timeStats,
  mainAssignee,
  isStuck,
  sentinelRef,
  goTo,
}) => {
  if (!parentTicket) return null;

  return (
    <>
      <div ref={sentinelRef} className="absolute top-0 h-[1px] w-full invisible" />

      <div
        className={`sticky top-0 z-30 w-full transition-all duration-300 ${
          isStuck
            ? "py-4 px-4 sm:px-6 bg-gray-100/90 backdrop-blur-xl border-b border-gray-200/60 shadow-sm"
            : "py-4 px-4 sm:px-6 bg-white border-transparent"
        }`}
      >
        <div className="flex justify-between items-start w-full">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h3 className="text-2xl text-gray-900 font-bold tracking-tight">
                {parentTicket.Title}
                <span className="text-gray-400 font-light ml-2">
                  #{parentTicket.Issue_Code}
                </span>
              </h3>

              {parentTicket?.labels?.length > 0 && (
                <div className="flex gap-1.5 mt-1">
                  {parentTicket.labels.map((label) => (
                    <span
                      key={label.LABEL_ID}
                      className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full shadow-sm text-white"
                      style={{ backgroundColor: label.LABEL_COLOR }}
                    >
                      {label.LABEL_TITLE}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="text-sm text-gray-500 flex items-center gap-2">
              <span className="font-medium">{parentTicket.Repo_Name}</span>
              <span className="opacity-40">•</span>
              <span>{parentTicket.Project_Name}</span>
              {mainAssignee && (
                <>
                  <span className="opacity-40">•</span>
                  <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100 shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                      Owner:
                    </span>
                    <span className="text-xs font-bold">
                      {mainAssignee.Assignee_Name}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-white border border-gray-200 shadow-sm px-3 py-1.5 rounded-lg text-xs text-gray-600">
                <FaCalendarAlt className="text-blue-500" size={13} />
                <span className="font-medium">
                  Due: {formatDate(parentTicket.Due_Date)}
                </span>
              </div>
              <button
                onClick={() =>
                  goTo(ROUTE_KEYS.TICKET_EDIT, { ticketId: parentTicket.Issue_Id })
                }
                className=" text-gray-500 hover:text-blue-600  hover:bg-gray-50  rounded-lg transition-all"
                title="Edit Ticket"
              >
                <FaEdit size={20} />
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs font-medium bg-gray-50/80 border border-gray-200/60 shadow-sm rounded-lg px-3 py-1">
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold leading-none mb-0.5">
                  Estimated
                </span>
                <span className="text-gray-700 leading-none">
                  {parentTicket.Hours || "00:00"}
                </span>
              </div>
              <div className="w-px h-5 bg-gray-300"></div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold leading-none mb-0.5">
                  Total Logged
                </span>
                <span className="text-blue-600 leading-none">{timeStats.total}</span>
              </div>
              <div className="w-px h-5 bg-gray-300"></div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold leading-none mb-0.5">
                  My Hours
                </span>
                <span className="text-brand-yellow drop-shadow-sm leading-none">
                  {timeStats.mine}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8 mt-2 px-4 sm:px-6 relative">
        <div className="bg-gray-50 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-3xl p-6 text-sm text-gray-800 leading-relaxed">
          <HtmlRenderer html={parentTicket.HtmlDesc || parentTicket.Description} />
        </div>
      </div>
    </>
  );
};

export default ParentTicketHeader;