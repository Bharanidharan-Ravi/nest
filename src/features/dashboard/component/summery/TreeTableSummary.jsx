import React, { useMemo, useState, useEffect } from "react";
import dayjs from "dayjs";
import { useList } from "../../../../packages/ui-List/context/ListContext"; 

// Lightweight inline SVG icons to replace the missing react-icons dependency
const Icon = ({ name, className = "", size = 16 }) => {
  const icons = {
    Layers: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
    Maximize2: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>,
    Minimize2: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>,
    Clock: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    ChevronDown: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
    ChevronRight: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
    Folder: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
    Briefcase: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
    Calendar: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
  };
  return <span className={`inline-flex items-center justify-center ${className}`}>{icons[name]}</span>;
};

// 1. Battery Component
const BatteryProgress = ({ percent }) => {
  const p = Math.min(Math.max(parseInt(percent || 0), 0), 100);
  const steps = 10;
  const filled = Math.round((p / 100) * steps);
  
  return (
    <div className="flex items-center justify-center gap-2">
      <div className="flex gap-[2px] border border-gray-200 p-[2px] rounded-[4px] bg-white shadow-sm">
        {[...Array(steps)].map((_, i) => (
          <div key={i} className={`w-1.5 h-3 rounded-[0.5px] ${i < filled ? 'bg-indigo-600' : 'bg-gray-100'}`} />
        ))}
      </div>
      <span className="text-[11px] font-bold text-gray-700 w-8 text-right">{p}%</span>
    </div>
  );
};

export function TimesheetSummary() {
  const { data } = useList();
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [expandedTickets, setExpandedTickets] = useState(new Set());

  // 2. Data Parsing, Time Summation & History Grouping
  const treeData = useMemo(() => {
    if (!data) return { totalValue: 0, repos: {} };
    const tree = { totalValue: 0, repos: {} };
    
    // Sort chronologically (newest first) to ensure 'latest' is correct
    const sortedData = [...data].sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

    sortedData.forEach((item) => {
      const repoName = item.repoName || "Unassigned";
      const projectName = item.projectName || "Unassigned";
      const ticketId = item.ticketId || item.issueId || item.id || `unknown-${Math.random()}`;
      
      // Parse "HH:MM" string into decimal hours
      let hours = 0;
      if (item.ConsumeTime && typeof item.ConsumeTime === 'string') {
          const parts = item.ConsumeTime.split(':');
          hours = parseInt(parts[0] || 0, 10) + (parseInt(parts[1] || 0, 10) / 60);
      } else if (typeof item.ConsumeTime === 'number') {
          hours = item.ConsumeTime;
      }

      if (!tree.repos[repoName]) tree.repos[repoName] = { val: 0, projects: {} };
      if (!tree.repos[repoName].projects[projectName]) tree.repos[repoName].projects[projectName] = { val: 0, tickets: {} };
      if (!tree.repos[repoName].projects[projectName].tickets[ticketId]) {
          tree.repos[repoName].projects[projectName].tickets[ticketId] = {
              val: 0,
              latest: item,
              history: []
          };
      }
      
      tree.totalValue += hours;
      tree.repos[repoName].val += hours;
      tree.repos[repoName].projects[projectName].val += hours;
      tree.repos[repoName].projects[projectName].tickets[ticketId].val += hours;
      tree.repos[repoName].projects[projectName].tickets[ticketId].history.push(item);
    });
    return tree;
  }, [data]);
console.log("treeData :", treeData, data);

  // Expand all repos by default
  useEffect(() => {
    if (treeData?.repos) {
      setExpandedGroups(new Set(Object.keys(treeData.repos).map(r => `repo_${r}`)));
    }
  }, [treeData]);

  // 3. Expand / Collapse Logic
  const toggleAll = (expand) => {
    if (expand) {
      setExpandedGroups(new Set(Object.keys(treeData.repos).map(r => `repo_${r}`)));
    } else {
      setExpandedGroups(new Set());
    }
  };

  const toggleGroup = (id) => {
    const newSet = new Set(expandedGroups);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setExpandedGroups(newSet);
  };

  const toggleTicket = (id) => {
    const newSet = new Set(expandedTickets);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setExpandedTickets(newSet);
  };

  const formatHours = (val) => `${Math.floor(val)}h ${Math.round((val % 1) * 60)}m`;

  // UI State Checks for Highlighting
  const totalReposCount = Object.keys(treeData.repos).length;
  const isAllExpanded = totalReposCount > 0 && expandedGroups.size >= totalReposCount;
  const isAllCollapsed = expandedGroups.size === 0;

  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 shadow-sm mt-4 overflow-hidden">
      
      {/* --- HEADER: Expand Controls & Overall Total --- */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/80">
         <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wider flex items-center gap-2">
            <Icon name="Layers" className="text-indigo-600" /> Weekly Activity Breakdown
         </h4>
         <div className="flex items-center gap-3">
            <div className="flex bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
                <button 
                  onClick={() => toggleAll(true)} 
                  className={`px-3 py-1.5 text-xs font-semibold border-r border-gray-200 transition-colors flex items-center gap-1 ${isAllExpanded ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'}`}
                >
                    <Icon name="Maximize2" /> Expand
                </button>
                <button 
                  onClick={() => toggleAll(false)} 
                  className={`px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1 ${isAllCollapsed ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'}`}
                >
                    <Icon name="Minimize2" /> Collapse
                </button>
            </div>
            <div className="font-bold text-gray-900 bg-white px-4 py-1.5 rounded-md border border-gray-200 shadow-sm flex items-center gap-2 text-sm">
                <Icon name="Clock" className="text-indigo-500" /> {formatHours(treeData.totalValue)}
            </div>
         </div>
      </div>

      {/* --- BODY --- */}
      {Object.entries(treeData.repos).map(([repoName, repoData]) => {
        const isRepoOpen = expandedGroups.has(`repo_${repoName}`);
        return (
            <div key={repoName} className="border-b border-gray-200 last:border-b-0 bg-white">
            
            {/* Repo Header */}
            <div className="flex justify-between items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors" 
                onClick={() => toggleGroup(`repo_${repoName}`)}>
                <div className="flex items-center gap-2 font-bold text-indigo-900 uppercase text-xs tracking-wider">
                {isRepoOpen ? <Icon name="ChevronDown" className="text-gray-400" size={16}/> : <Icon name="ChevronRight" className="text-gray-400" size={16}/>}
                <Icon name="Folder" className="text-amber-500" size={16}/> {repoName}
                </div>
                <div className="font-bold text-gray-700 text-xs">{formatHours(repoData.val)}</div>
            </div>

            {/* Projects Container */}
            {isRepoOpen && Object.entries(repoData.projects).map(([projName, projData]) => (
                <div key={projName} className="border-t border-gray-100 bg-white">
                
                {/* Project Header */}
                <div className="flex justify-between items-center px-10 py-3 bg-indigo-50/30">
                    <div className="flex items-center gap-2 font-semibold text-indigo-700 text-xs">
                    <Icon name="Briefcase" className="text-blue-500" /> {projName}
                    </div>
                </div>

                {/* Tickets Table */}
                <div className="px-10 pb-4">
                    <table className="w-full table-fixed">
                    <thead className="text-[10px] text-gray-400 uppercase tracking-widest border-b border-gray-100">
                        <tr>
                        <th className="text-left py-2 pb-3 w-[40%] font-semibold pl-2">Ticket</th>
                        <th className="text-center py-2 pb-3 w-[15%] font-semibold">Total Time</th>
                        <th className="text-center py-2 pb-3 w-[20%] font-semibold">Progress</th>
                        <th className="text-left py-2 pb-3 w-[25%] font-semibold pl-4">Latest Summary</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(projData.tickets).map(([ticketId, ticketGroup], idx) => {
                            const t = ticketGroup.latest;
                            console.log("ticketGroup :", projData);
                            
                            const hasHistory = ticketGroup.history.length > 0;
                            const isExpanded = expandedTickets.has(ticketId);

                            return (
                                <React.Fragment key={ticketId}>
                                    <tr className="group border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="py-3 pr-4 pl-2">
                                            <div className="flex items-center gap-1.5">
                                                {/* Expand/Collapse Chevron for History */}
                                                <div className="w-4 flex justify-center">
                                                    {hasHistory && (
                                                        <button 
                                                            onClick={() => toggleTicket(ticketId)} 
                                                            className="text-gray-400 hover:text-indigo-600 p-0.5 rounded hover:bg-gray-200 transition-colors"
                                                        >
                                                            {isExpanded ? <Icon name="ChevronDown" size={14} /> : <Icon name="ChevronRight" size={14} />}
                                                        </button>
                                                    )}
                                                </div>
                                                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/70 border border-indigo-100 px-1.5 py-0.5 rounded shadow-sm">
                                                    #{t.ticketKey}
                                                </span>
                                                <span className="text-[13px] font-medium text-gray-800 truncate" title={t.TicketName}>
                                                    {t.TicketName}
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1 font-medium ml-6">
                                                <Icon name="Calendar" /> {dayjs(t.updatedAt).format('DD MMM YYYY, HH:mm')}
                                            </div>
                                        </td>
                                        <td className="py-3 text-center text-[13px] font-bold text-gray-700">
                                            {formatHours(ticketGroup.val)}
                                        </td>
                                        <td className="py-3">
                                            <BatteryProgress percent={t.overallPercentage || t.CompletionPct || 0} />
                                        </td>
                                        <td className="py-3 pl-4 text-xs text-gray-500 truncate" title={t.CurrentStatusSummary || t.Comment}>
                                            {t.CurrentStatusSummary || t.Comment ? (
                                                <span className="font-medium text-gray-600">{t.CurrentStatusSummary || t.Comment}</span>
                                            ) : (
                                                <span className="text-gray-300 italic">No update provided</span>
                                            )}
                                        </td>
                                    </tr>

                                    {/* --- HISTORY TIMELINE DROPDOWN --- */}
                                    {isExpanded && hasHistory && (
                                        <tr className="bg-slate-50/40">
                                            <td colSpan="4" className="p-0 border-b border-gray-100">
                                                <div className="pl-16 pr-8 py-4">
                                                    <div className="relative border-l-2 border-slate-200 ml-3 space-y-6 pb-2 pt-1">
                                                        {ticketGroup.history.map((log, i) => (
                                                            <div key={i} className="relative pl-6">
                                                                {/* Timeline Dot */}
                                                                <div className="absolute w-3 h-3 bg-slate-300 rounded-full border-2 border-white -left-[7px] top-1 shadow-sm" />
                                                                
                                                                <div className="flex flex-col gap-1.5">
                                                                    {/* Meta Header */}
                                                                    <div className="flex items-center gap-3 text-xs flex-wrap">
                                                                        <span className="font-bold text-gray-800">
                                                                            {log.CreatedByName || log.employeeName}
                                                                        </span>
                                                                        <span className="font-semibold text-gray-500 border border-gray-200 rounded px-1.5 bg-white">
                                                                            {log.overallPercentage || log.CompletionPct || 0}%
                                                                        </span>
                                                                        {log.threadStatusName && (
                                                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold text-slate-600 bg-slate-200/70 uppercase tracking-wide">
                                                                                {log.threadStatusName}
                                                                            </span>
                                                                        )}
                                                                        <span className="text-gray-400 font-medium">
                                                                            {dayjs(log.updatedAt).format('MMM D, hh:mm A')}
                                                                        </span>
                                                                    </div>
                                                                    
                                                                    {/* Log Summary */}
                                                                    <div className="text-[13px] text-gray-600 leading-relaxed max-w-4xl">
                                                                        {log.Comment || log.CurrentStatusSummary || <span className="italic text-gray-400">No update provided</span>}
                                                                    </div>

                                                                    {/* Logged Time for this specific entry */}
                                                                    {log.ConsumeTime && (
                                                                        <div className="text-[11px] font-medium text-indigo-500 mt-0.5">
                                                                            Logged Time: {log.ConsumeTime} hr
                                                                        </div>
                                                                    )}
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
            ))}
            </div>
        );
      })}
    </div>
  );
}