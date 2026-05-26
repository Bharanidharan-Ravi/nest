import React, { useMemo, useState } from "react";
import { FiChevronDown, FiChevronRight, FiClock, FiCalendar } from "react-icons/fi";
import dayjs from "dayjs";
import { useList } from "../../../../packages/ui-List/context/ListContext";

export function TimesheetSummary() {
  const { data } = useList();

  // 1. ALL HOOKS MUST GO FIRST
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [expandedRows, setExpandedRows] = useState(new Set());

  // 🔥 BESPOKE ENGINE: Hardcoded for WGNest Timesheets
  const treeData = useMemo(() => {
    // Safety check INSIDE the hook
    if (!data || data.length === 0) {
        return { totalValue: 0, repos: {} };
    }

    const tree = { totalValue: 0, repos: {} };

    // Sort data chronologically first so the "latest item" is actually the latest
    const sortedData = [...data].sort((a, b) => new Date(b.updatedAt || b.planDate) - new Date(a.updatedAt || a.planDate));

    sortedData.forEach((item) => {
      const repoName = item.repoName || "Unknown Repository";
      const projectName = item.projectName || item.project || "Unknown Project";
      const ticketId = item.id || item.issueId;
      const hours = parseFloat(item.ConsumeTime) || 0;

      // 1. Initialize Repo
      if (!tree.repos[repoName]) {
        tree.repos[repoName] = { val: 0, projects: {} };
      }
      
      // 2. Initialize Project
      if (!tree.repos[repoName].projects[projectName]) {
        tree.repos[repoName].projects[projectName] = { val: 0, tickets: {} };
      }
      
      // 3. Initialize Ticket (Aggregated)
      if (!tree.repos[repoName].projects[projectName].tickets[ticketId]) {
        tree.repos[repoName].projects[projectName].tickets[ticketId] = {
           val: 0, 
           latestItem: item, // Store the most recent entry for status/progress
           logs: [] // Array to hold the individual date entries
        };
      }

      // 4. Aggregate Hours
      tree.totalValue += hours;
      tree.repos[repoName].val += hours;
      tree.repos[repoName].projects[projectName].val += hours;
      tree.repos[repoName].projects[projectName].tickets[ticketId].val += hours;
      
      // 5. Push the specific log entry for the date breakdown
      tree.repos[repoName].projects[projectName].tickets[ticketId].logs.push(item);
    });

    return tree;
  }, [data]);

  // 2. NOW WE CAN SAFELY RETURN EARLY
  if (!data || data.length === 0) return null;

  // --- Render Helpers ---
  const toggleGroup = (id) => {
    const newSet = new Set(expandedGroups);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setExpandedGroups(newSet);
  };

  const toggleRow = (id) => {
    const newSet = new Set(expandedRows);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setExpandedRows(newSet);
  };

  const formatHours = (val) => {
    const h = Math.floor(val);
    const m = Math.round((val % 1) * 60);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} hr`;
  };

  return (
    <div className="w-full bg-white border-t border-gray-200">
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
         <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Weekly Activity Breakdown</h4>
         <div className="font-bold text-brand-purple flex items-center gap-2">
            <FiClock /> {formatHours(treeData.totalValue)}
         </div>
      </div>

      <div className="flex flex-col text-sm">
        {Object.entries(treeData.repos).map(([repoName, repoData]) => {
          const isRepoOpen = expandedGroups.has(`repo_${repoName}`);
          
          return (
            <div key={`repo_${repoName}`} className="border-b border-gray-100 last:border-0">
              {/* LEVEL 1: REPOSITORY */}
              <div 
                className="flex justify-between items-center p-3 px-4 hover:bg-gray-50 cursor-pointer group"
                onClick={() => toggleGroup(`repo_${repoName}`)}
              >
                <div className="flex items-center gap-2 font-semibold text-gray-800">
                  <span className="text-gray-400 group-hover:text-gray-600 transition-colors">
                     {isRepoOpen ? <FiChevronDown /> : <FiChevronRight />}
                  </span>
                  <span className="text-gray-500 mr-1">📁</span> {repoName}
                </div>
                <div className="font-semibold text-gray-700">{formatHours(repoData.val)}</div>
              </div>

              {/* LEVEL 2: PROJECTS */}
              {isRepoOpen && Object.entries(repoData.projects).map(([projectName, projectData]) => {
                const projId = `proj_${repoName}_${projectName}`;
                const isProjOpen = expandedGroups.has(projId);

                return (
                  <div key={projId} className="bg-gray-50/50">
                    <div 
                      className="flex justify-between items-center p-2.5 pl-10 pr-4 hover:bg-gray-100 cursor-pointer group"
                      onClick={() => toggleGroup(projId)}
                    >
                      <div className="flex items-center gap-2 font-medium text-gray-700">
                        <span className="text-gray-400">
                           {isProjOpen ? <FiChevronDown /> : <FiChevronRight />}
                        </span>
                        <span className="text-gray-400 mr-1">💼</span> {projectName}
                      </div>
                      <div className="font-medium text-gray-600">{formatHours(projectData.val)}</div>
                    </div>

                    {/* LEVEL 3: TICKETS (The Table) */}
                    {isProjOpen && (
                      <div className="pl-16 pr-4 py-2 bg-white">
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                           <table className="w-full text-left border-collapse">
                             <thead className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                               <tr>
                                 <th className="p-3 font-semibold w-8"></th>
                                 <th className="p-3 font-semibold">Ticket</th>
                                 <th className="p-3 font-semibold w-24 text-right">Total Time</th>
                                 <th className="p-3 font-semibold w-32">Status</th>
                                 <th className="p-3 font-semibold w-40">Progress</th>
                                 <th className="p-3 font-semibold w-1/3">Latest Summary</th>
                               </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-100">
                               {Object.entries(projectData.tickets).map(([ticketId, ticketData]) => {
                                 const latest = ticketData.latestItem;
                                 const isRowExpanded = expandedRows.has(ticketId);
                                 const percent = parseInt(latest.TicketOverallPercentage || 0, 10);
                                 const status = latest.threadStatusName || "Open";
                                 const hasMultipleLogs = ticketData.logs.length > 1;
                                 
                                 return (
                                   <React.Fragment key={ticketId}>
                                     {/* AGGREGATED TICKET ROW */}
                                     <tr 
                                        className={`hover:bg-gray-50/50 transition-colors ${hasMultipleLogs ? 'cursor-pointer' : ''}`}
                                        onClick={() => hasMultipleLogs && toggleRow(ticketId)}
                                     >
                                       <td className="p-3 text-gray-400">
                                          {hasMultipleLogs && (isRowExpanded ? <FiChevronDown /> : <FiChevronRight />)}
                                       </td>
                                       <td className="p-3">
                                         <div className="flex items-center gap-2">
                                           <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded border border-emerald-200 whitespace-nowrap">
                                              #{latest.ticketKey || latest.id}
                                           </span>
                                           <span className="font-medium text-gray-800 line-clamp-1" title={latest.TicketName || latest.title}>
                                              {latest.TicketName || latest.title}
                                           </span>
                                         </div>
                                       </td>
                                       <td className="p-3 text-right font-bold text-brand-purple">
                                         {formatHours(ticketData.val)}
                                       </td>
                                       <td className="p-3">
                                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700">
                                            {status}
                                          </span>
                                       </td>
                                       <td className="p-3">
                                          <div className="flex items-center gap-2">
                                            <div className="flex gap-[1px]">
                                              {[...Array(10)].map((_, i) => (
                                                <div key={i} className={`h-3 w-1.5 rounded-sm ${i < (percent / 10) ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                                              ))}
                                            </div>
                                            <span className="text-xs font-bold text-gray-600">{percent}%</span>
                                          </div>
                                       </td>
                                       <td className="p-3 text-gray-600 text-sm line-clamp-1">
                                          {latest.TicketStatusSummary || latest.LatestComment || <span className="text-gray-400 italic">No update provided</span>}
                                       </td>
                                     </tr>

                                     {/* LEVEL 4: DATE BREAKDOWN (Only shows if expanded and has multiple logs) */}
                                     {isRowExpanded && hasMultipleLogs && (
                                       <tr>
                                         <td colSpan="6" className="p-0 border-t-0">
                                           <div className="bg-slate-50 border-y border-slate-200 pl-12 pr-4 py-3 shadow-inner">
                                              <div className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1.5">
                                                 <FiCalendar /> Daily Breakdown
                                              </div>
                                              <div className="flex flex-col gap-2">
                                                {ticketData.logs.map((log, idx) => (
                                                  <div key={idx} className="flex items-center gap-4 text-sm bg-white border border-slate-100 p-2 rounded-md">
                                                     <div className="w-24 font-semibold text-slate-700">
                                                        {dayjs(log.updatedAt || log.planDate).format('DD MMM YYYY')}
                                                     </div>
                                                     <div className="w-20 font-bold text-slate-600 text-right pr-4 border-r border-slate-100">
                                                        {formatHours(parseFloat(log.ConsumeTime) || 0)}
                                                     </div>
                                                     <div className="flex-1 text-slate-600 italic">
                                                        {log.TicketStatusSummary || log.LatestComment || "-"}
                                                     </div>
                                                  </div>
                                                ))}
                                              </div>
                                           </div>
                                         </td>
                                       </tr>
                                     )}
                                   </React.Fragment>
                                 );
                               })}
                             </tbody>
                           </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}