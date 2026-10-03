import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import {
  FiEdit2,
  FiAlertCircle,
  FiLoader,
  FiRefreshCw,
  FiCheckCircle,
  FiXCircle,
  FiSlash,
  FiList,
  FiSearch,
  FiPlus,
  FiX,
  FiChevronDown,
  FiChevronRight,
  FiArrowUp,
  FiArrowDown,
  FiMinus,
  FiTrash2,
  FiSend,
  FiPaperclip,
  FiFile,
  FiClock,
} from "react-icons/fi";
import {
  ISSUE_LOGGER_STATUS_OPTIONS,
  ISSUE_LOGGER_PRIORITY_OPTIONS,
} from "../../config/IssueLoggerField.config";
import { queryKeys } from "../../../../core/query/queryKeys";
import { executeApi } from "../../../../core/api/executor";
import AttachmentPreviewModal from "./AttachmentPreviewModal";
import { parseActivities, toHoursText } from "./issueLog.utils";
import EntityFormPage from "../../../../packages/crud/pages/EntityFormPage";
import { ThreadFieldConfig } from "../../config/Thread.config";
import { ThreadFormConfig, completeAndCloseAction } from "../../config/ThreadForm.config";
import { stripHtml, HtmlRenderer } from "../../../../app/shared/utilities/utilities";



const escapeHtml = (text = "") =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const isImageFile = (name = "") => /\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(name);

// Drafts keep the description as plain text and attachments as a separate list;
// on submit both are folded into the same HTML shape the rich editor used to
// produce (<img> / file-attachment links), which extractAttachments and the
// backend's temp-file handling already understand.
const buildFilesHtml = (tempFiles) =>
  tempFiles
    .map((f) => {
      const name = escapeHtml(f.FileName || f.PublicUrl.split("/").pop());
      return isImageFile(f.FileName || f.PublicUrl)
        ? `<p><img src="${f.PublicUrl}" alt="${name}"></p>`
        : `<p><a data-type="file-attachment" href="${f.PublicUrl}" filename="${name}">${name}</a></p>`;
    })
    .join("");

const buildDescriptionHtml = (text, tempFiles) =>
  `<p>${escapeHtml(text.trim()).replace(/\n/g, "<br>")}</p>` + buildFilesHtml(tempFiles);

const uploadTempFile = async (file) => {
  const formDataPayload = new FormData();
  formDataPayload.append("files", file);
  const tempData = await executeApi({
    url: "Attachment/tempUpload",
    method: "POST",
    payload: formDataPayload,
    config: { headers: { "Content-Type": "multipart/form-data" } },
  });
  return { FileName: file.name, ...tempData };
};

const cleanupTempFiles = (Delete, temps) => {
  if (!temps?.length) return;
  executeApi({ url: "Attachment/tempCleanUp", method: "POST", payload: { Delete, temps } }).catch(() => {});
};

// Accent per row kind, matching the row: amber for new issues, sky for edits.
const ATTACHMENT_EDITOR_TONES = {
  amber: { chip: "border-amber-200", picker: "border-amber-300 text-amber-700 hover:bg-amber-50" },
  sky: { chip: "border-sky-200", picker: "border-sky-300 text-sky-700 hover:bg-sky-50" },
};

// File chips + "Add files" picker for a new or edited issue row.
// `files` is a list of { url, name }.
const AttachmentEditor = ({ files, uploadingCount, onAdd, onRemove, tone = "amber" }) => {
  const toneClass = ATTACHMENT_EDITOR_TONES[tone];
  return (
    <div className="flex flex-col gap-1.5">
      {files.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {files.map((f) => (
            <div
              key={f.url}
              className={`relative group w-10 h-10 rounded-md border ${toneClass.chip} bg-white overflow-hidden`}
              title={f.name}
            >
              {isImageFile(f.name || f.url) ? (
                <img src={f.url} alt={f.name} className="w-full h-full object-cover" />
              ) : (
                <span className="flex items-center justify-center w-full h-full text-slate-400">
                  <FiFile size={14} />
                </span>
              )}
              <button
                type="button"
                onClick={() => onRemove(f.url)}
                className="absolute top-0 right-0 p-0.5 rounded-bl-md bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Remove"
              >
                <FiX size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
      <label className={`inline-flex items-center gap-1 self-center px-2 py-1 rounded-lg border border-dashed ${toneClass.picker} bg-white text-[11px] font-medium transition-colors cursor-pointer`}>
        <FiPaperclip size={11} />
        {uploadingCount > 0 ? `Uploading ${uploadingCount}...` : "Add files"}
        <input
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          className="hidden"
          onChange={(e) => {
            onAdd(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
};

// The Description column shows whatever content the row carries; the list API
// sometimes returns it as "Html" (the rendered thread comment) instead of "Description".

const extractAttachments = (html = "") => {
  if (!html) return [];

  const doc = new DOMParser().parseFromString(html, "text/html");

  const attachments = [];

  // File attachments
  doc.querySelectorAll('a[data-type="file-attachment"]').forEach((a) => {
    const url = a.getAttribute("href") || a.getAttribute("src");

    if (url) {
      attachments.push({
        url,
        filename:
          a.getAttribute("filename") ||
          a.textContent.trim() ||
          "attachment",
        type: "file",
      });
    }
  });

  // Images
  doc.querySelectorAll("img").forEach((img) => {
    const url = img.getAttribute("src");

    if (url) {
      attachments.push({
        url,
        filename: url.split("/").pop() || "image",
        type: "image",
      });
    }
  });

  return attachments;
};

// Visual metadata for known status/priority values. Any option added
// to the *_OPTIONS lists in the field config without an entry here just
// falls back to a neutral style below, so the lists never need to be kept
// in sync by hand.
const STATUS_META = {
  Open: { badgeClass: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200/70", icon: FiAlertCircle, tileClass: "bg-red-50 text-red-500", ringClass: "hover:border-red-200", activeClass: "border-red-300 bg-red-50/40 ring-2 ring-red-100" },
  "In Progress": { badgeClass: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/70", icon: FiLoader, tileClass: "bg-amber-50 text-amber-500", ringClass: "hover:border-amber-200", activeClass: "border-amber-300 bg-amber-50/40 ring-2 ring-amber-100" },
  Retest: { badgeClass: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200/70", icon: FiRefreshCw, tileClass: "bg-blue-50 text-blue-500", ringClass: "hover:border-blue-200", activeClass: "border-blue-300 bg-blue-50/40 ring-2 ring-blue-100" },
  Passed: { badgeClass: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/70", icon: FiCheckCircle, tileClass: "bg-emerald-50 text-emerald-500", ringClass: "hover:border-emerald-200", activeClass: "border-emerald-300 bg-emerald-50/40 ring-2 ring-emerald-100" },
  Failed: { badgeClass: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200/70", icon: FiXCircle, tileClass: "bg-rose-50 text-rose-500", ringClass: "hover:border-rose-200", activeClass: "border-rose-300 bg-rose-50/40 ring-2 ring-rose-100" },
  "Not Required": { badgeClass: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200", icon: FiSlash, tileClass: "bg-slate-100 text-slate-400", ringClass: "hover:border-slate-300", activeClass: "border-slate-300 bg-slate-50 ring-2 ring-slate-100" },
  Closed: { badgeClass: "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200/70", icon: FiCheckCircle, tileClass: "bg-green-50 text-green-600", ringClass: "hover:border-green-200", activeClass: "border-green-300 bg-green-50/40 ring-2 ring-green-100" },
};
const DEFAULT_STATUS_META = { badgeClass: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200", icon: FiList, tileClass: "bg-slate-100 text-slate-400", ringClass: "hover:border-slate-200", activeClass: "border-slate-300 bg-slate-50 ring-2 ring-slate-100" };

const PRIORITY_META = {
  Low: { badgeClass: "bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-200", icon: FiArrowDown },
  Medium: { badgeClass: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200/70", icon: FiMinus },
  High: { badgeClass: "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200/70", icon: FiArrowUp },
  Critical: { badgeClass: "bg-red-600 text-white ring-1 ring-inset ring-red-600", icon: FiArrowUp },
};
const DEFAULT_PRIORITY_META = { badgeClass: "bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-200", icon: FiMinus };

const STATUS_SUMMARY_CARDS = ISSUE_LOGGER_STATUS_OPTIONS.map(({ label, value }) => {
  const key = value.id;
  const meta = STATUS_META[key] || DEFAULT_STATUS_META;
  return { key, label, icon: meta.icon, tileClass: meta.tileClass, ringClass: meta.ringClass, activeClass: meta.activeClass };
});

// One type scale for the whole tab, so weight carries meaning: bold for
// identifiers and counts, medium for the primary text of a row, normal and
// muted for secondary text, and small uppercase for column labels.
const TH_CLASS = "text-[10.5px] font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap";
const EMPTY_DASH = <span className="text-slate-300">—</span>;

const DRAFT_INPUT_CLASS =
  "px-2.5 py-1.5 text-xs placeholder:font-normal placeholder:text-slate-400 rounded-lg border border-amber-200 bg-white resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-amber-300/50 focus:border-amber-300";
const DRAFT_SELECT_CLASS =
  "text-xs font-medium rounded-lg border border-amber-200 bg-white px-2 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-300/50 cursor-pointer";
const EDIT_INPUT_CLASS =
  "px-2.5 py-1.5 text-xs placeholder:font-normal placeholder:text-slate-400 rounded-lg border border-sky-200 bg-white resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-sky-300/50 focus:border-sky-300";
const EDIT_SELECT_CLASS =
  "text-xs font-medium rounded-lg border border-sky-200 bg-white px-2 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-300/50 cursor-pointer";

const formatDateTime = (value) => (value ? dayjs(value).format("DD MMM YYYY, hh:mm A") : "—");

// The list proc sends "IssuelogId" plus the issue's ISSUEACTIVITY rows, whose
// JSON leaves out null fields. Editing an issue only adds an activity row (the
// IssueLog row keeps its values from creation), so each field comes from the
// latest activity that set it, falling back to the IssueLog row's own value.
// AttachmentsHtml gathers the issue's own files and those added with each edit.
// Hours are read as "HH:MM" text (older decimal values are converted).
const normalizeIssueLog = (row) => {
  const activities = parseActivities(row.Activities)
    .map((a) => ({ ...a, Hours: toHoursText(a.Hours) }))
    .sort((a, b) => a.ActivityId - b.ActivityId);
  const latest = (field) => {
    for (let i = activities.length - 1; i >= 0; i--) {
      const value = activities[i][field];
      if (value != null && value !== "") return value;
    }
    return undefined;
  };
  const html = row.Html ?? row.Description ?? "";
  return {
    ...row,
    IssueLogId: row.IssueLogId ?? row.IssuelogId,
    Html: html,
    AttachmentsHtml: [html, ...activities.map((a) => a.AttachmentsHtml)].filter(Boolean).join(""),
    Status: latest("Status") ?? row.Status,
    Priority: latest("Priority") ?? row.Priority,
    Remarks: latest("Remarks") ?? row.Remarks,
    Hours: latest("Hours") ?? toHoursText(row.Hours),
    UpdatedAt: row.UpdatedAt ?? activities[activities.length - 1]?.ChangedAt,
    Activities: activities,
  };
};

// Starts at one line and grows with its content, so short remarks stay
// compact in the table row while long ones never need an inner scrollbar.
const AutoGrowTextarea = ({ value, ...props }) => {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`;
  }, [value]);
  return <textarea ref={ref} value={value} {...props} />;
};

const StatusBadge = ({ value }) => {
  const meta = STATUS_META[value] || DEFAULT_STATUS_META;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${meta.badgeClass}`}>
      <Icon size={10} strokeWidth={2.5} />
      {value || "—"}
    </span>
  );
};

const PriorityBadge = ({ value }) => {
  if (!value) return EMPTY_DASH;
  const meta = PRIORITY_META[value] || DEFAULT_PRIORITY_META;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap ${meta.badgeClass}`}>
      <Icon size={10} strokeWidth={2.5} />
      {value}
    </span>
  );
};

// Small uppercase tag marking a row that is being created or edited inline.
const RowTag = ({ children, className }) => (
  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider ${className}`}>
    {children}
  </span>
);

// One dropdown for the merged status/retest value, used by both new and
// edited rows. Every option is always offered — the user picks it by hand.
const StatusSelect = ({ value, onChange, className }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)} className={className}>
    {ISSUE_LOGGER_STATUS_OPTIONS.map((s) => (
      <option key={s.value.id} value={s.value.id}>
        {s.label}
      </option>
    ))}
  </select>
);

const PrioritySelect = ({ value, onChange, className }) => (
  <select value={value || ""} onChange={(e) => onChange(e.target.value)} className={className}>
    {!value && (
      <option value="" disabled>
        Select
      </option>
    )}
    {ISSUE_LOGGER_PRIORITY_OPTIONS.map((p) => (
      <option key={p.value.id} value={p.value.id}>
        {p.label}
      </option>
    ))}
  </select>
);

const AttachmentsCell = ({ html, onPreview, empty = EMPTY_DASH }) => {
  const attachments = useMemo(() => extractAttachments(html), [html]);

  if (attachments.length === 0) return empty;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onPreview(attachments);
      }}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer"
      title={`View ${attachments.length > 1 ? `${attachments.length} attachments` : "attachment"}`}
    >
      <FiPaperclip size={12} />
      <span className="text-[11px] font-semibold leading-none tabular-nums">{attachments.length}</span>
    </button>
  );
};

// Table shape lives here as data, not markup: each entry drives one <th>/<td> pair,
// so adding, reordering, or hiding a column never touches the render tree below.
const buildColumns = ({ onPreview, onEdit, expandedId, onToggleExpand }) => [
    {
      key: "issueId",
      header: "Issue #",
      cellClassName: "whitespace-nowrap",
      render: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand(row.IssueLogId);
          }}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-slate-900 tabular-nums cursor-pointer"
        >
          {expandedId === row.IssueLogId ? (
            <FiChevronDown size={13} className="text-slate-500 shrink-0" />
          ) : (
            <FiChevronRight size={13} className="text-slate-300 shrink-0" />
          )}
          #{row.IssueNo ?? row.IssueLogId}
        </button>
      ),
    },
    {
      key: "description",
      header: "Description",
      headerClassName: "min-w-[220px]",
      cellClassName: "text-[12.5px] font-medium text-slate-800 max-w-[320px] truncate",
      title: (row) => stripHtml(row.Description),
      render: (row) => stripHtml(row.Description) || EMPTY_DASH,
    },
    {
      key: "status",
      header: "Status",
      cellClassName: "whitespace-nowrap",
      render: (row) => <StatusBadge value={row.Status} />,
    },
    {
      key: "priority",
      header: "Priority",
      cellClassName: "whitespace-nowrap",
      render: (row) => <PriorityBadge value={row.Priority} />,
    },
    {
      key: "remarks",
      header: "Remarks",
      headerClassName: "min-w-[200px]",
      cellClassName: "font-normal text-slate-500 max-w-[280px] truncate",
      title: (row) => row.Remarks,
      render: (row) => row.Remarks || EMPTY_DASH,
    },
    {
      key: "attachments",
      header: "Attachments",
      headerClassName: "text-center",
      cellClassName: "text-center whitespace-nowrap",
      render: (row) => <AttachmentsCell html={row.AttachmentsHtml} onPreview={onPreview} />,
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      cellClassName: "text-right whitespace-nowrap",
      render: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(row);
          }}
          className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
          title="Edit issue"
        >
          <FiEdit2 size={13} />
        </button>
      ),
    },
  ];

const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "?";

// Soft avatar colours, picked from the name so a person keeps the same one.
const AVATAR_CLASSES = [
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-indigo-100 text-indigo-700",
];
const avatarClass = (name = "") =>
  AVATAR_CLASSES[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % AVATAR_CLASSES.length];

// A value the activity repeated from the one before it is dimmed, so the
// fields that actually changed in each update stand out.
const ActivityValue = ({ value, previous, children }) => {
  if (value == null || value === "") return EMPTY_DASH;
  const unchanged = previous != null && String(previous) === String(value);
  return (
    <span className={unchanged ? "opacity-40" : ""} title={unchanged ? "Unchanged" : undefined}>
      {children}
    </span>
  );
};

// Issue history: one row per ISSUEACTIVITY entry, oldest first (the first is
// the issue being logged, then one per edit). Status and Priority repeat on
// every row (faded when unchanged); Remarks is the note written with that
// update and Attachments the files added with it, and a field an activity
// left empty shows as "—".
const ACTIVITY_COLUMNS = [
  {
    key: "step",
    header: "#",
    headerClassName: "w-10",
    cellClassName: "whitespace-nowrap",
    render: (a, { index }) => (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 tabular-nums">
        {index + 1}
      </span>
    ),
  },
  {
    key: "updatedBy",
    header: "Updated By",
    cellClassName: "whitespace-nowrap",
    render: (a, { isFirst, isLatest }) => (
      <div className="flex items-center gap-2">
        <span
          className={`flex items-center justify-center w-7 h-7 shrink-0 rounded-full text-[10px] font-bold ${avatarClass(a.EmployeeName)}`}
        >
          {initials(a.EmployeeName)}
        </span>
        <div className="flex flex-col leading-tight">
          <span className="text-xs font-semibold text-slate-800">{a.EmployeeName || "—"}</span>
          {(isFirst || isLatest) && (
            <span className={`text-[10px] font-medium ${isFirst ? "text-slate-400" : "text-sky-600"}`}>
              {isFirst ? "Logged the issue" : "Latest update"}
            </span>
          )}
        </div>
      </div>
    ),
  },
  {
    key: "status",
    header: "Status",
    cellClassName: "whitespace-nowrap",
    render: (a, { previous }) => (
      <ActivityValue value={a.Status} previous={previous.Status}>
        <StatusBadge value={a.Status} />
      </ActivityValue>
    ),
  },
  {
    key: "priority",
    header: "Priority",
    cellClassName: "whitespace-nowrap",
    render: (a, { previous }) => (
      <ActivityValue value={a.Priority} previous={previous.Priority}>
        <PriorityBadge value={a.Priority} />
      </ActivityValue>
    ),
  },
  {
    key: "hours",
    header: "Hours",
    cellClassName: "whitespace-nowrap font-semibold text-slate-700 tabular-nums",
    render: (a, { previous }) => (
      <ActivityValue value={a.Hours} previous={previous.Hours}>
        {a.Hours}
      </ActivityValue>
    ),
  },
  {
    key: "remarks",
    header: "Remarks",
    headerClassName: "min-w-[240px]",
    cellClassName: "font-normal text-slate-600 leading-relaxed whitespace-pre-wrap break-words max-w-[420px]",
    render: (a) => a.Remarks || EMPTY_DASH,
  },
  {
    key: "attachments",
    header: "Attachments",
    headerClassName: "text-center",
    cellClassName: "text-center whitespace-nowrap",
    render: (a, { onPreview }) => <AttachmentsCell html={a.AttachmentsHtml ?? ""} onPreview={onPreview} />,
  },
  {
    key: "updatedAt",
    header: "Updated On",
    headerClassName: "text-right",
    cellClassName: "text-right whitespace-nowrap tabular-nums",
    render: (a) =>
      a.ChangedAt ? (
        <div className="flex flex-col leading-tight">
          <span className="text-xs font-medium text-slate-700">{dayjs(a.ChangedAt).format("DD MMM YYYY")}</span>
          <span className="text-[10.5px] font-normal text-slate-400">{dayjs(a.ChangedAt).format("hh:mm A")}</span>
        </div>
      ) : (
        EMPTY_DASH
      ),
  },
];

const ExpandedIssueRow = ({ row, columnCount, onPreview }) => {
  const activities = row.Activities;
  // The value each field had before every activity, for dimming repeats.
  const previousValues = useMemo(() => {
    const current = {};
    return activities.map((a) => {
      const snapshot = { ...current };
      ["Status", "Priority", "Hours"].forEach((k) => {
        if (a[k] != null && a[k] !== "") current[k] = a[k];
      });
      return snapshot;
    });
  }, [activities]);

  return (
    <tr className="bg-slate-50/70 border-b border-slate-100">
      <td colSpan={columnCount} className="pl-10 pr-4 pb-4 pt-0.5">
        <div className="rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-slate-900 text-white">
                <FiClock size={12} />
              </span>
              <span className="text-xs font-bold text-slate-800">Activity History</span>
              <span className="px-1.5 py-0.5 rounded-md bg-white ring-1 ring-inset ring-slate-200 text-[10px] font-semibold text-slate-500 tabular-nums">
                {activities.length}
              </span>
            </div>
            {activities.length > 1 && (
              <span className="hidden sm:inline text-[10.5px] font-normal text-slate-400">
                Faded values are unchanged from the previous update
              </span>
            )}
          </div>

          {activities.length === 0 ? (
            <div className="flex flex-col items-center gap-1 py-8">
              <FiClock size={16} className="text-slate-300" />
              <span className="text-xs font-normal text-slate-400">No activity yet.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100">
                    {ACTIVITY_COLUMNS.map(({ key, header, headerClassName }) => (
                      <th key={key} className={`px-4 py-2 ${TH_CLASS} ${headerClassName || ""}`}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activities.map((activity, index) => {
                    const isLatest = index === activities.length - 1;
                    const context = { index, isFirst: index === 0, isLatest, previous: previousValues[index], onPreview };
                    return (
                      <tr
                        key={activity.ActivityId ?? index}
                        className={`align-middle transition-colors ${
                          isLatest && activities.length > 1
                            ? "bg-sky-50/40 shadow-[inset_3px_0_0_#0ea5e9]"
                            : "hover:bg-slate-50/60"
                        }`}
                      >
                        {ACTIVITY_COLUMNS.map(({ key, cellClassName, render }) => (
                          <td key={key} className={`px-4 py-2.5 ${cellClassName || ""}`}>
                            {render(activity, context)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
};

const IssueLogger = ({ ticketId, formContext, parentTicket, issueLogs }) => {
  const rows = useMemo(() => (Array.isArray(issueLogs) ? issueLogs.map(normalizeIssueLog) : []), [issueLogs]);
  const [preview, setPreview] = useState(null);
  const openPreview = (attachments, initialIndex = 0) => setPreview({ attachments, initialIndex });
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState("");
  // Draft rows for issues not yet saved: edited inline in the table itself
  // (no popup form) and only sent to the server with the thread form's Submit.
  const [draftIssues, setDraftIssues] = useState([]);
  // Existing rows being edited inline, keyed by IssueLogId. Several rows can be
  // edited at once; nothing is saved until the single Submit, which sends
  // the new drafts and every edited row together with the thread form. An edit
  // never changes the IssueLog row itself: each edited issue gets a new
  // ISSUEACTIVITY row (linked by its IssueLogId) on the thread that submit
  // creates. So an edit only holds the fields an activity carries: Status
  // (which also carries the retest result), Priority and Remarks, the remark
  // for this one update (it starts empty; earlier remarks stay in the history),
  // plus the files added with it, uploaded to temp storage like a new issue's.
  const [editDrafts, setEditDrafts] = useState({});

  // Apply a change to one new-issue row / one edited row, so the file helpers
  // below work on either. An edit that was already closed is left alone.
  const mapDraft = (id) => (fn) => setDraftIssues((prev) => prev.map((d) => (d.id === id ? fn(d) : d)));
  const mapEdit = (issueLogId) => (fn) =>
    setEditDrafts((prev) => (prev[issueLogId] ? { ...prev, [issueLogId]: fn(prev[issueLogId]) } : prev));

  const addDraftIssue = () => {
    setDraftIssues((prev) => [
      ...prev,
      {
        id: `draft-${Date.now()}-${prev.length}`,
        Description: "",
        Status: "Open",
        // No default: the priority must be picked by hand before submitting.
        Priority: "",
        Remarks: "",
        Hours: "",
        uploadingCount: 0,
        tempFiles: [],
      },
    ]);
  };

  const updateDraftIssue = (id, field, value) => mapDraft(id)((d) => ({ ...d, [field]: value }));

  // Each picked file is uploaded to temp storage on its own and tracked against
  // the row it was picked for (via mapRow), so issue #2's files never land in issue #1.
  const uploadRowFiles = (mapRow, fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    const bumpUploading = (delta) => mapRow((r) => ({ ...r, uploadingCount: r.uploadingCount + delta }));
    bumpUploading(files.length);
    files.forEach(async (file) => {
      try {
        const tempFile = await uploadTempFile(file);
        mapRow((r) => ({ ...r, tempFiles: [...r.tempFiles, tempFile] }));
      } catch {
        // A failed upload just doesn't show up in the list; the user can pick it again.
      } finally {
        bumpUploading(-1);
      }
    });
  };

  const deleteRowFile = (mapRow, deletedUrl) => {
    if (!deletedUrl?.includes("/UploadsTemp/")) return;
    mapRow((r) => {
      const fileToDelete = r.tempFiles.find((f) => f.PublicUrl === deletedUrl);
      if (fileToDelete) cleanupTempFiles("single", [fileToDelete]);
      return { ...r, tempFiles: r.tempFiles.filter((f) => f.PublicUrl !== deletedUrl) };
    });
  };

  const removeDraftIssue = (id) => {
    setDraftIssues((prev) => {
      const target = prev.find((d) => d.id === id);
      cleanupTempFiles("all", target?.tempFiles);
      return prev.filter((d) => d.id !== id);
    });
  };

  const handleStartEdit = (row) => {
    setEditDrafts((prev) =>
      prev[row.IssueLogId]
        ? prev
        : {
            ...prev,
            [row.IssueLogId]: {
              IssueLogId: row.IssueLogId,
              Status: row.Status,
              Priority: row.Priority || "",
              Remarks: "",
              uploadingCount: 0,
              tempFiles: [],
              original: {
                Status: row.Status,
                Priority: row.Priority || "",
              },
            },
          },
    );
  };

  const updateEditDraft = (issueLogId, field, value) => mapEdit(issueLogId)((d) => ({ ...d, [field]: value }));

  const cancelEdit = (issueLogId) => {
    setEditDrafts((prev) => {
      if (!prev[issueLogId]) return prev;
      const { [issueLogId]: removed, ...rest } = prev;
      cleanupTempFiles("all", removed.tempFiles);
      return rest;
    });
  };

  const editList = Object.values(editDrafts);
  const isEditChanged = (d) =>
    d.Status !== d.original.Status ||
    d.Priority !== d.original.Priority ||
    d.Remarks.trim() !== "" ||
    d.tempFiles.length > 0;
  const changedEdits = editList.filter(isEditChanged);

  // A new issue needs a description and a hand-picked priority.
  const isMissingDescription = draftIssues.some((d) => !d.Description.trim());
  const isMissingPriority = draftIssues.some((d) => !d.Priority);
  const hasInvalidDraft = isMissingDescription || isMissingPriority;
  const isUploading = [...draftIssues, ...editList].some((d) => d.uploadingCount > 0);
  const pendingCount = draftIssues.length + changedEdits.length;

  // The issue's Status / Priority after the edit, since its latest
  // ISSUEACTIVITY row is its current state, plus this update's remark and
  // files. An issue that never had a priority keeps none until one is picked.
  const buildEditItem = (d) => ({
    IssueLogId: d.IssueLogId,
    Status: d.Status,
    Priority: d.Priority || null,
    Remarks: d.Remarks.trim() || null,
    AttachmentsHtml: d.tempFiles.length > 0 ? buildFilesHtml(d.tempFiles) : null,
    temp: d.tempFiles.length > 0 ? { Delete: "all", temps: d.tempFiles } : null,
  });

  const buildDraftItem = (d) => ({
    Description: buildDescriptionHtml(d.Description, d.tempFiles),
    Status: d.Status,
    Priority: d.Priority,
    Remarks: d.Remarks || null,
    Hours: d.Hours || null,
    temp: d.tempFiles.length > 0 ? { Delete: "all", temps: d.tempFiles } : null,
  });

  // Drafts and edits sent with the thread form, so only those are cleared once
  // it succeeds (rows added or opened while the request was in flight stay on
  // screen). If it fails everything stays open so it can be resubmitted.
  const submittedRef = useRef({ draftIds: new Set(), editIds: new Set() });

  const canSubmit = pendingCount > 0 && !hasInvalidDraft && !isUploading;
  // With no new or edited issue, a general comment (text or files) can still be
  // submitted on its own; the backend posts it as a plain thread comment. Only
  // the form knows its value, so this is checked against its formData.
  const hasGeneralComment = (formData) => {
    const html = formData?.description || "";
    return Boolean(stripHtml(html).trim()) || /<img\b|data-type="file-attachment"/i.test(html);
  };
  const canSubmitWith = (formData) =>
    !hasInvalidDraft && !isUploading && (pendingCount > 0 || hasGeneralComment(formData));
  // With only existing rows open for edit (no new drafts), the button just saves
  // those changes instead of logging new issues, so it reads "Update".
  const isUpdateOnly = draftIssues.length === 0 && editList.length > 0;
  const submitHint = hasInvalidDraft
    ? isMissingDescription && isMissingPriority
      ? "Every new issue needs a description and a priority."
      : isMissingDescription
        ? "Every new issue needs a description."
        : "Every new issue needs a priority."
    : isUploading
      ? "Waiting for attachments to finish uploading..."
      : pendingCount === 0
        ? isUpdateOnly
          ? "Change a field above, or write a general comment below, to update."
          : "Add or edit an issue above, or write a general comment below, to submit."
        : isUpdateOnly
          ? `${changedEdits.length} edited issue(s) ready to update.`
          : `${draftIssues.length} new and ${changedEdits.length} edited issue(s) ready to submit.`;

  // One submit for everything pending, all with the thread form below the table
  // (POST /WorkStream), so the one thread it creates carries its hours,
  // assignees, notify flags and progress: new drafts as IssueLogs (a new
  // IssueLog row each) and edited rows as IssueLogUpdates (a new ISSUEACTIVITY
  // row each; the IssueLog row itself is left as it is).
  const submitWithIssues = (submitForm, overrides = {}, skipValidation) => {
    // Rows opened for edit but left unchanged are just closed, not sent.
    editList.filter((d) => !isEditChanged(d)).forEach((d) => cancelEdit(d.IssueLogId));
    submittedRef.current = {
      draftIds: new Set(draftIssues.map((d) => d.id)),
      editIds: new Set(changedEdits.map((d) => d.IssueLogId)),
    };
    submitForm(
      {
        ...overrides,
        IssueLogs: draftIssues.map(buildDraftItem),
        IssueLogUpdates: changedEdits.map(buildEditItem),
      },
      skipValidation,
    );
  };

  const handleSubmitAll = (submitForm, formData) => {
    if (!canSubmitWith(formData)) return;
    submitWithIssues(submitForm);
  };

  // The owner can close the ticket from here too, as on the Threads tab. Any
  // pending issues go with that same submit, so they still need to be valid.
  const isTerminalState = [15, 16, 17].includes(parentTicket?.statusId);
  const canClose = formContext?.userRole === "Owner" && !formContext?.isViewer && !isTerminalState;
  const closeAction = {
    ...completeAndCloseAction,
    onClick: ({ submitForm, ...rest }) => {
      if (hasInvalidDraft || isUploading) return;
      completeAndCloseAction.onClick({
        ...rest,
        submitForm: (overrides, skipValidation) => submitWithIssues(submitForm, overrides, skipValidation),
      });
    },
  };

  const handleThreadSubmitted = () => {
    const { draftIds, editIds } = submittedRef.current;
    setDraftIssues((prev) => prev.filter((d) => !draftIds.has(d.id)));
    setEditDrafts((prev) => Object.fromEntries(Object.entries(prev).filter(([, d]) => !editIds.has(d.IssueLogId))));
    submittedRef.current = { draftIds: new Set(), editIds: new Set() };
  };

  const threadFormConfig = {
    ...ThreadFormConfig,
    redirectTo: undefined,
    // The ticket itself is refetched too, so a close shows up in its status.
    invalidateKeys: [
      queryKeys.ticket.thread(ticketId),
      queryKeys.ticket.issueLog(ticketId),
      queryKeys.ticket.detail(ticketId),
    ],
    // The comment is optional here (even with hours entered): the backend writes
    // the thread as a "New issues" table and an "Updated issues" table (#, issue,
    // status, priority, remarks, attachments; a changed field shows old → new),
    // then "General comments" (this field, when filled). With no issue pending,
    // this field alone is posted as a normal thread comment.
    // Total Hours, though, is mandatory on every submit from this tab, comment
    // or not; "00:00" counts as empty, and the 5-minute minimum still applies.
    fields: ThreadFieldConfig(ticketId).map((f) => {
      if (f.name === "description") {
        return { ...f, label: "General Comments (optional)", requiredWhen: () => false };
      }
      if (f.name === "hours") {
        return {
          ...f,
          requiredWhen: () => true,
          customValidator: (value, formData, context) => {
            const result = f.customValidator(value, formData, context);
            if (result !== true) return result;
            return toHoursText(value) ? true : `${f.label} is required`;
          },
        };
      }
      return f;
    }),
    actions: ({ formData }) => {
      const submitAction = {
        label: `${isUpdateOnly ? "Update" : "Submit"}${pendingCount > 0 ? ` (${pendingCount})` : ""}`,
        icon: isUpdateOnly ? <FiRefreshCw size={13} /> : <FiSend size={13} />,
        onClick: ({ submitForm, formData: current }) => handleSubmitAll(submitForm, current),
      };
      if (canClose) {
        return [
          {
            type: "split-button",
            options: [
              { ...submitAction, subtext: "Save issues and comments", intent: "neutral" },
              closeAction,
            ],
          },
        ];
      }
      return [{ ...submitAction, className: canSubmitWith(formData) ? "" : "opacity-50 !cursor-not-allowed" }];
    },
  };


  const statusCounts = useMemo(
    () =>
      rows.reduce((acc, row) => {
        const status = row.Status || "Unknown";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {}),
    [rows],
  );

  const hasActiveFilters = Boolean(statusFilter || priorityFilter || search.trim());

  const clearFilters = () => {
    setStatusFilter(null);
    setPriorityFilter("");
    setSearch("");
  };

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter && (row.Status || "Unknown") !== statusFilter) return false;
      if (priorityFilter && row.Priority !== priorityFilter) return false;
      if (query) {
        const haystack = [
          `#${row.IssueNo ?? row.IssueLogId}`,
          stripHtml(row.Description),
          row.Remarks,
          row.Status,
          row.Priority,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [rows, statusFilter, priorityFilter, search]);

  const columns = useMemo(
    () =>
      buildColumns({
        onPreview: openPreview,
        onEdit: handleStartEdit,
        expandedId,
        onToggleExpand: (id) => setExpandedId((current) => (current === id ? null : id)),
      }),
    [expandedId],
  );

  return (
    <div className="w-full flex flex-col gap-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2">
        {[
          { key: null, label: "Total", icon: FiList, tileClass: "bg-slate-900 text-white", ringClass: "hover:border-slate-300", activeClass: "border-slate-400 ring-2 ring-slate-100", count: rows.length },
          ...STATUS_SUMMARY_CARDS.map((card) => ({ ...card, count: statusCounts[card.key] || 0 })),
        ].map(({ key, label, icon: Icon, tileClass, ringClass, activeClass, count }) => {
          const isActive = statusFilter === key;
          return (
            <button
              type="button"
              key={key ?? "total"}
              onClick={() => setStatusFilter((current) => (key === null || current === key ? null : key))}
              className={`group flex items-center gap-2.5 border bg-white rounded-xl px-2.5 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all text-left cursor-pointer ${
                isActive ? activeClass : `border-slate-200/80 ${ringClass} hover:shadow-sm`
              }`}
            >
              <span className={`flex items-center justify-center w-7 h-7 shrink-0 rounded-lg ${tileClass}`}>
                <Icon size={13} />
              </span>
              <div className="flex flex-col min-w-0 leading-tight">
                <span className={`text-base font-bold tabular-nums tracking-tight ${count === 0 ? "text-slate-300" : "text-slate-900"}`}>
                  {count}
                </span>
                <span className={`truncate text-[10.5px] ${isActive ? "font-semibold text-slate-700" : "font-normal text-slate-500"}`}>
                  {label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="border border-slate-200/80 bg-white rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex flex-col leading-tight">
            <span className="mt-0.5 text-xs font-normal text-slate-400">
              {hasActiveFilters
                ? `Showing ${filteredRows.length} of ${rows.length} issues`
                : `${rows.length} ${rows.length === 1 ? "issue" : "issues"} logged on this ticket`}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-full sm:w-64">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search issues, remarks..."
                className="w-full pl-8 pr-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-800/10 focus:border-slate-300 transition-colors"
              />
            </div>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-slate-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-800/10 cursor-pointer"
            >
              <option value="">All priorities</option>
              {ISSUE_LOGGER_PRIORITY_OPTIONS.map((p) => (
                <option key={p.value.id} value={p.value.id}>
                  {p.label}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-2 py-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <FiX size={12} /> Clear
              </button>
            )}

            <button
              type="button"
              onClick={addDraftIssue}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            >
              <FiPlus size={13} strokeWidth={2.5} />
              New Issue
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                {columns.map(({ key, header, headerClassName }) => (
                  <th key={key} className={`px-4 py-3 ${TH_CLASS} ${headerClassName || ""}`}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {draftIssues.map((draft) => (
                <tr key={draft.id} className="bg-amber-50/40 border-b border-amber-100 align-top">
                  <td className="px-4 py-3 whitespace-nowrap shadow-[inset_3px_0_0_#f59e0b]">
                    <RowTag className="bg-amber-100 text-amber-800">New</RowTag>
                  </td>
                  <td className="px-4 py-3 min-w-[280px] align-top">
                    <AutoGrowTextarea
                      value={draft.Description}
                      onChange={(e) => updateDraftIssue(draft.id, "Description", e.target.value)}
                      placeholder="Describe the issue"
                      rows={1}
                      className={`${DRAFT_INPUT_CLASS} w-full font-medium text-slate-800`}
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <StatusSelect
                      value={draft.Status}
                      onChange={(value) => updateDraftIssue(draft.id, "Status", value)}
                      className={DRAFT_SELECT_CLASS}
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <PrioritySelect
                      value={draft.Priority}
                      onChange={(value) => updateDraftIssue(draft.id, "Priority", value)}
                      className={`${DRAFT_SELECT_CLASS} ${draft.Priority ? "" : "!border-red-300"}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <AutoGrowTextarea
                      rows={1}
                      value={draft.Remarks}
                      onChange={(e) => updateDraftIssue(draft.id, "Remarks", e.target.value)}
                      placeholder="Optional"
                      className={`${DRAFT_INPUT_CLASS} w-full min-w-[180px] font-normal text-slate-600`}
                    />
                  </td>
                  <td className="px-4 py-3 min-w-[160px]">
                    <AttachmentEditor
                      files={draft.tempFiles.map((f) => ({ url: f.PublicUrl, name: f.FileName }))}
                      uploadingCount={draft.uploadingCount}
                      onAdd={(fileList) => uploadRowFiles(mapDraft(draft.id), fileList)}
                      onRemove={(url) => deleteRowFile(mapDraft(draft.id), url)}
                    />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => removeDraftIssue(draft.id)}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
                      title="Remove"
                    >
                      <FiTrash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
  
              {filteredRows.length === 0 && draftIssues.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="mb-1.5 w-12 h-12 rounded-2xl bg-slate-50 ring-1 ring-slate-100 flex items-center justify-center">
                        <FiList size={18} className="text-slate-400" />
                      </span>
                      <span className="text-sm font-semibold text-slate-700">
                        {rows.length === 0 ? "No issues logged yet" : "No issues match your filters"}
                      </span>
                      <span className="text-xs font-normal text-slate-400">
                        {rows.length === 0
                          ? "Use New Issue to log the first one for this ticket."
                          : "Try a different search, status or priority."}
                      </span>
                      {rows.length > 0 && hasActiveFilters && (
                        <button
                          type="button"
                          onClick={clearFilters}
                          className="mt-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                        >
                          Clear filters
                        </button>
                      )}
                      {rows.length === 0 && (
                        <button
                          type="button"
                          onClick={addDraftIssue}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                        >
                          <FiPlus size={12} strokeWidth={2.5} /> New Issue
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
  
              {filteredRows.map((row) => {
                const editDraft = editDrafts[row.IssueLogId];
                const isEditing = Boolean(editDraft);
  
                if (isEditing) {
                  return (
                    <tr key={row.IssueLogId} className="bg-sky-50/40 border-b border-sky-100 align-top">
                      <td className="px-4 py-3 whitespace-nowrap shadow-[inset_3px_0_0_#0ea5e9]">
                        <div className="flex flex-col items-start gap-1">
                          <span className="text-[12.5px] font-bold text-slate-900 tabular-nums">#{row.IssueNo ?? row.IssueLogId}</span>
                          <RowTag className="bg-sky-100 text-sky-800">Editing</RowTag>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[12.5px] font-medium text-slate-800 max-w-[320px] truncate" title={stripHtml(row.Description)}>
                        {stripHtml(row.Description) || EMPTY_DASH}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusSelect
                          value={editDraft.Status}
                          onChange={(value) => updateEditDraft(row.IssueLogId, "Status", value)}
                          className={EDIT_SELECT_CLASS}
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <PrioritySelect
                          value={editDraft.Priority}
                          onChange={(value) => updateEditDraft(row.IssueLogId, "Priority", value)}
                          className={EDIT_SELECT_CLASS}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <AutoGrowTextarea
                          rows={1}
                          value={editDraft.Remarks}
                          onChange={(e) => updateEditDraft(row.IssueLogId, "Remarks", e.target.value)}
                          placeholder="Add a remark for this update"
                          title={row.Remarks ? `Latest remark: ${row.Remarks}` : undefined}
                          className={`${EDIT_INPUT_CLASS} w-full min-w-[180px] font-normal text-slate-600`}
                        />
                      </td>
                      {/* Files already on the issue, then the picker for files added with this edit. */}
                      <td className="px-4 py-3 min-w-[160px]">
                        <div className="flex flex-col items-center gap-1.5">
                          <AttachmentsCell html={row.AttachmentsHtml} onPreview={openPreview} empty={null} />
                          <AttachmentEditor
                            tone="sky"
                            files={editDraft.tempFiles.map((f) => ({ url: f.PublicUrl, name: f.FileName }))}
                            uploadingCount={editDraft.uploadingCount}
                            onAdd={(fileList) => uploadRowFiles(mapEdit(row.IssueLogId), fileList)}
                            onRemove={(url) => deleteRowFile(mapEdit(row.IssueLogId), url)}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => cancelEdit(row.IssueLogId)}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
                          title="Discard changes"
                        >
                          <FiX size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                }
  
                return (
                  <React.Fragment key={row.IssueLogId}>
                    <tr
                      onClick={() => setExpandedId((current) => (current === row.IssueLogId ? null : row.IssueLogId))}
                      className={`border-b border-slate-100 last:border-0 align-middle transition-colors cursor-pointer ${
                        expandedId === row.IssueLogId ? "bg-slate-50/70" : "hover:bg-slate-50/60"
                      }`}
                    >
                      {columns.map(({ key, cellClassName, title, render }) => (
                        <td key={key} className={`px-4 py-3 ${cellClassName || ""}`} title={title?.(row)}>
                          {render(row)}
                        </td>
                      ))}
                    </tr>
                    {expandedId === row.IssueLogId && (
                      <ExpandedIssueRow row={row} columnCount={columns.length} onPreview={openPreview} />
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Thread form: the same fields as the Threads tab's reply form. New
          issues are submitted together with it and linked to the thread it creates. */}
      {/* <div className="border border-slate-200/80 bg-white rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden"> */}
        <div className="flex flex-wrap items-center justify-end gap-3 ">
          
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ring-1 ring-inset ${
              hasInvalidDraft
                ? "bg-red-50 text-red-700 ring-red-200/70"
                : canSubmit
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200/70"
                  : "bg-slate-50 text-slate-500 ring-slate-200"
            }`}
          >
            {hasInvalidDraft ? <FiAlertCircle size={12} /> : canSubmit ? <FiCheckCircle size={12} /> : <FiLoader size={12} className={isUploading ? "animate-spin" : ""} />}
            {submitHint}
          </span>
        </div>
        <EntityFormPage
          mode="Create"
          module="Issue Log"
          config={threadFormConfig}
          context={{
            ...formContext,
            parentTicket,
            isClosed: false,
          }}
          onSuccessCallback={handleThreadSubmitted}
        />
      {/* </div> */}

      {preview && (
        <AttachmentPreviewModal
          attachments={preview.attachments}
          initialIndex={preview.initialIndex}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
};

export default IssueLogger;
