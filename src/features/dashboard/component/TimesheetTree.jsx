
import { useState, useMemo, useEffect, useRef } from "react";
import { FaProjectDiagram, FaComment } from "react-icons/fa";
import { FaAngleDown } from 'react-icons/fa';
import { RiGitRepositoryCommitsFill } from "react-icons/ri";
import { IoTicketSharp } from "react-icons/io5";
import { useList } from "../../../packages/ui-List/context/ListContext";
import BatteryCompletionIndicator from "../../../app/shared/Component/BatteryCompletionIndicator/BatteryCompletionIndicator";

const COLORS = [
    "#1D9E75",
    "#378ADD",
    "#D85A30",
    "#7F77DD",
    "#D4537F"
];

const STATUS_COLOURS = {
    Closed: "#1D9E75",
    New: "#378ADD",
    Open: "#BA7517",
    Default: "#888780",
};

const toMins = (t) => {
    if (!t && t !== 0) return 0;
    if (typeof t === "number") return Math.round(t * 60);
    if (typeof t === "string" && t.includes(":")) {
        const [h, m] = t.split(":").map(Number);
        return h * 60 + (m || 0);
    } return Math.round(parseFloat(t) * 60);
};

const fmtH = (m) => {
    if (!m && m !== 0) return "00:00hm"
    const h = Math.floor(m / 60)
    const mn = m % 60;
    return `${String(h).padStart(2, "0")}:${String(mn).padStart(2, "0")}hm`;
};

const GUIDE_COLOR = "#3B82F680";
const Guide = () => (
    <div className="w-5 flex-shrink-0 self-stretch flex justify-center">
        {/* small inline style for 1.5px width; Tailwind doesn't include fractional px utilities by default */}
        <div style={{ width: 1.5, background: GUIDE_COLOR, borderRadius: 1 }} />
    </div>
);

function buildTree(rows) {
    const tree = {};
    rows.forEach((r) => {
        const repo = r.Repository_Name || r.repository_name || r.repoName || "Unknown Repo";
        const repoKey = r.RepoKey || r.repoKey || "";
        const proj = r.projectName || r.project_name || r.projName || "Unknown Project";
        // const projkey=r.ticketKey||"";
        const tno = r.ticketKey || r.ticketId || r.TicketNo || r.ticketNo || "ticketNo";
        const ticketNm = r.title || r.TicketName || r.ticketName || tno;
        const mins = toMins(r.ConsumeTime ?? r.consumeTime);
        const status = r.ThreadStatusName || r.threadStatusName || "";
        const employee = r.EmployeeName || r.employeeName || "";
        const startTime = r.StartTime || r.startTime || null;
        const endTime = r.EndTime || r.endTime || null;
        const threadId = r.threadId || r.ThreadId || r.id;
        const percentage = r.overallPercentage ?? null;
        const statusSummary = r.StatusSummary || r.statusSummary || "";
        const currentstatusSummary = r.currentStatusSummary || r.CurrentStatusSummary || r.statusSummary || "";
        // const LABEL_TITLE=r.LABEL_TITLE||"";
        const label = r.label || []
        if (!tree[repo]) tree[repo] = { key: repoKey || "", projects: {}, mins: 0 };
        if (!tree[repo].projects[proj]) tree[repo].projects[proj] = { tickets: {}, mins: 0 };

        if (!tree[repo].projects[proj].tickets[tno])
            tree[repo].projects[proj].tickets[tno] = {
                name: ticketNm || "", threads: [], mins: 0, status: status || "",
                percentage: percentage, statusSummary: statusSummary, currentstatusSummary: currentstatusSummary, label: label,
                tno: tno

            };

        if (threadId) {
            tree[repo].projects[proj].tickets[tno].threads.push({
                id: threadId,
                mins,
                status,
                employee,
                startTime,
                endTime,
                comment: r.Comment || r.comment || "",
                displayComment: r.displayComment || r.DisplayComment || "",
            });
            tree[repo].projects[proj].tickets[tno].label = label;
            tree[repo].projects[proj].tickets[tno].status = status;
            tree[repo].projects[proj].tickets[tno].percentage = percentage;
            tree[repo].projects[proj].tickets[tno].statusSummary = statusSummary;
            tree[repo].projects[proj].tickets[tno].currentstatusSummary = currentstatusSummary;
            tree[repo].projects[proj].tickets[tno].mins += mins;
            tree[repo].projects[proj].mins += mins;
            tree[repo].mins += mins;
        }
    });
    return tree;
}

const LINE = "1.5px solid var(--color-border-tertiary)"; // used inline where needed

const Chevron = ({ open }) => (
    <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        // rotation depends on open; apply inline style for transform
        style={{
            flexShrink: 0,
            transition: "transform 0.2s ease",
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
        }}
    > <polyline
            points="9 18 15 12 9 6"
            stroke="var(--color-text-secondary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const Row = ({ icon, label, right, badge, onToggle, open, color, arrowType = "Chevron" }) => {
    // arrowType as component name isn't directly usable; original used <arrowType />, keep Chevron only
    return (
        <div
            onClick={onToggle}
            className={
                "flex items-center gap-2 px-3 py-2 rounded-[6px] select-none min-h-[32px] " +
                (onToggle ? "cursor-pointer hover:bg-slate-100" : "cursor-default")
            }
        >
            {onToggle && <Chevron open={open} />}
            <span className="text-sm flex-shrink-0 w-5 text-center">{icon}</span>
            <span className="text-[13px] flex-1 text-slate-900 leading-[1.4] min-w-0">{label}</span>
            {badge && (
                <span
                    className="text-[11px] px-2 rounded-[4px] font-semibold flex-shrink-0"
                    // background and color depend on STATUS_COLOURS: use inline style to create translucent bg from hex
                    style={{
                        background: (STATUS_COLOURS[badge] || "#888") + "22",
                        color: STATUS_COLOURS[badge] || "var(--color-text-primary)",
                    }}
                >
                    {badge}
                </span>
            )}
            <span
                className="text-[13px] font-medium min-w-[40px] text-right"
                style={{ color: color || "var(--color-text-secondary)" }}
            >
                {right}
            </span>
        </div>
    );
};


const TicketNode = ({ tno, ticket, level = 0 }) => {
    const [open, setOpen] = useState(false);
    const [showAllThreads, setShowAllThreads] = useState(false);

    const allThreads = ticket.threads || [];
    const visibleThreads = showAllThreads ? allThreads : allThreads.slice(0, 5);
    const hiddenCount = Math.max(0, allThreads.length - 5);

    return (

        <tr className="border-b border-gray-100 hover:bg-gray-50">
            {/* Data row */}

            {/* Column 1: Icon */}
            <td className="py-2 px-3 w-8">
                <div className="flex items-center justify-center">
                    <Guide />
                </div>
            </td>

            {/* Column 2: Ticket Name */}
            <td className="py-2 px-3 w-48">
                <div className="flex items-center gap-3 truncate" title={ticket.name}>

                    <span
                        className="rounded-[6px] text-[11px] bg-gray-100 text-gray-700 min-w-[64px] text-center ">
                        {ticket.tno}
                    </span>
                    <span className="truncate text-sm font-medium">{ticket.name}{ticket.LABEL_TITLE}</span>
                    <span>{
                        ticket.label && ticket.label.length > 0 && (
                            <div className="flex flex-wrap gap-1 pl-6">
                                {ticket.label.map((lbl) => (
                                    <span key={lbl.LABEL_ID}
                                        className="text-[10px] px-1.5 py-0.5 rounded-full font-medium font-semibold border"
                                        style={{
                                            color: lbl.LABEL_COLOR,
                                            backgroundColor: lbl.LABEL_COLOR + "22",
                                            borderColor: lbl.LABEL_COLOR + "66",

                                        }}
                                    >
                                        {lbl.LABEL_TITLE}
                                    </span>
                                ))}
                            </div>
                        )
                    }
                    </span>
                </div>

            </td>
            <td className="py-2 px-3 w-16 text-center text-[12px] text-slate-500">

                {fmtH(ticket.mins)}

            </td>

            {/* Column 3: Percentage */}
            <td className="py-2 px-3 w-20 text-center text-xs">
                <BatteryCompletionIndicator
                    name={`pct_${ticket.no}`}
                    value={ticket.percentage ?? 0}
                    readOnly={true}
                    showPercent={true}
                    options={{
                        height: "12px",
                        width: "8px"
                    }} />
            </td>
            {/* Column 4: Status */}
            <td className="py-2 px-3 w-24">
                <div className="flex justify-center">
                    <div className="px-2 py-0.5 rounded-full text-[11px] bg-gray-100 text-gray-700 min-w-[64px] text-center">
                        {ticket.status}
                    </div>
                </div>
            </td>
            <td className="py-2 px-3 w-40 border-b border-gray-100 overflow-hidden"title={ticket.currentstatusSummary} style={{maxWidth:0}}>


                <span className="text-sm font-medium overflow-hidden"
                style={{
                    whiteSpace:"nowrap",
                    textOverflow:"ellipsis",
                    overflow:"hidden",
                    maxWidth:"100%",
                }}>{ticket.currentstatusSummary||"----------"}</span>

            </td>
            {/* Column 5: Time */}

        </tr>

    );
};
const TicketHeader = () => (
    <tr className="text-slate-500 border-b border-gray-200  ">
        <th className=" text-left text-sm font-semibold text-slate-700 py-2 px-3 w-8" ></th>
        <th className="text-left text-sm font-semibold text-slate-700 py-2 px-3 w-48">Ticket</th>
        <th className="text-center text-sm font-semibold text-slate-700 py-2 px-3 w-16">Hour</th>
        <th className="text-left text-sm font-semibold text-slate-700 py-2 px-3 w-20">Completed %</th>
        <th className="text-center text-sm font-semibold text-slate-700 py-2 px-3 w-24">Status</th>
        <th className="text-left text-sm font-semibold text-slate-700 py-2 px-3 w-40 border-b border-gray-100 overflow-hidden">CurrentStatus</th>


    </tr>
);
const ProjectNode = ({ name, proj }) => {
    const [open, setOpen] = useState(false);
    const [showAlltickets, setshowAlltickets] = useState(false);
    const tickets = Object.entries(proj.tickets);
    const visibletickets = showAlltickets ? tickets : tickets.slice(0, 5);
    const hiddenCount = tickets.length - 5;
    return (
        <div className="mb-1">
            <Row
                icon={<FaAngleDown size={20} color="gray" />}
                label={
                    <span style={{ fontSize: 14, fontWeight: 'bold' }}>{name}</span>
                }
                right={<span style={{ fontSize: 14, fontWeight: 'bold' }}>{fmtH(proj.mins)}</span>}
                open={open}
                onToggle={() => setOpen(p => !p)}
            />
            {open && (
                <div   className="ml-8 mt-1 pr-5"
                style={{ borderLeft: LINE }}>
                    <table className="border-collapse" style={{width:"100%",maxWidth:1500,tableLayout:"fixed"}}>
                        <thead>
                            <TicketHeader />
                        </thead>
                        <tbody>
                            {visibletickets.map(([tno, ticket]) => (
                                <TicketNode key={tno} tno={tno} ticket={ticket} />
                            ))}
                        </tbody>
                    </table>
                    {tickets.length > 5 && (
                        <div onClick={() => setshowAlltickets((p) => !p)} className="text-[13px] font-semibold text-sky-600 cursor-pointer py-1 select-none">
                            {showAlltickets ? "▲ Show less" : ` ▼ +${hiddenCount}more threads`}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const RepoNode = ({ name, repo, color, totalMins }) => {
    const [open, setOpen] = useState(true);
    const projects = Object.entries(repo.projects);

    return (
        // outer container uses some inline style for border color because color is dynamic
        <div
            className="mb-4 rounded-[8px] bg-white"
            style={{
                border: `1px solid ${color}40`
            }}
        >
            <div
                onClick={() => setOpen((p) => !p)}
                // background when open uses dynamic color => inline style; fallback uses slate-100
                className={
                    "flex items-center gap-3 px-4 py-3 rounded-[8px] min-h-[44px] cursor-pointer select-none"
                }
                onMouseEnter={(e) => {
                    const bg = open ? `${color}12` : `${color}04`;
                    e.currentTarget.style.background = bg;
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = open ? `${color}08 ` : "var(--color-background-secondary)";
                }}
                style={{
                    background: open ? `${color}08` : "var(--color-background-secondary)",
                    border: `1px solid ${color} 40`,
                }}
            >
                <Chevron open={open} />
                <span>
                    <FaAngleDown size={25} color="gray" />
                </span>
                {
                    repo.key && (
                        <span
                            className="text-[13px] px-2 rounded-[6px] font-semibold whitespace-nowrap"
                            style={{ background: color + "20", color }}
                        >
                            {repo.key}
                            {/* ticketKey */}
                        </span>
                    )
                }
                <span className="text-[16px] font-semibold" style={{ color }}>
                    {name}
                </span>

                <span className="text-[14px] font-semibold min-w-[48px] text-right  text-right" style={{ color, textAlign: 'right', marginLeft: "auto" }}>
                    {fmtH(repo.mins)}
                </span>
            </div >

            {open && (
                <div className="flex mt-2 pl-4">
                    {/* <div className="w-4 flex-shrink-0 flex flex-col items-center">
                        <div className="w-[1px] bg-slate-200 flex-1 mt-3" />
                    </div> */}
                    <div className="flex-1">
                        {projects.map(([projName, proj], i) => (
                            <ProjectNode key={projName} name={projName} proj={proj} isLast={i === projects.length - 1} />
                        ))}
                    </div>
                </div>
            )}
        </div >
    );
};

export default function TimesheetTree() {
    const { data } = useList();
    const tree = useMemo(() => buildTree(data), [data]);
    const total = useMemo(() => Object.values(tree).reduce((a, r) => a + r.mins, 0), [tree]);

    if (!Object.keys(tree).length)
        return (
            <p className="text-center text-slate-500 p-8 text-[14px]">
                No data available.
            </p>
        );

    return (
        <div className="p-5 text-[14px] leading-[1.5]">
            <div className="flex gap-4 flex-wrap mb-5 px-4 py-3" >
                <div className="px-4 py-3 border-r flex-shrink-0 flex flex-col justify-center bg-white border rounded-[8px]">
                    <div className="text-[15px] font-semibold text-slate-500 mb-1 overflow-hidden truncate whitespace-nowrap">
                        Total
                    </div>
                    <div className="text-[16px] font-semibold text-slate-900">
                        {fmtH(total)}
                    </div>
                </div>

                {/* <div className="w-[1px] self-stretch bg-slate-200" /> */}

                <div className="flex flex-1 overflow-x-auto gap-1">
                    {Object.entries(tree).map(([name, repo], i) => (
                        <div
                            key={name}
                            title={name}
                            className="px-4 py-3 border-r min-w-[80px] max-w-[140px] flex-[1_1_100px] flex flex-col justify-center cursor-default bg-white border rounded-[8px]"
                        >
                            <div className="text-[14px] font-semibold text-slate-500 mb-1 overflow-hidden truncate whitespace-nowrap">
                                {name}
                            </div>
                            <div className="text-[16px] font-semibold" style={{ color: COLORS[i % COLORS.length] }}>
                                {fmtH(repo.mins)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {Object.entries(tree).map(([repoName, repo], i) => (
                <RepoNode
                    key={repoName}
                    name={repoName}
                    repo={repo}
                    color={COLORS[i % COLORS.length]}
                />
            ))}
        </div>
    );
}