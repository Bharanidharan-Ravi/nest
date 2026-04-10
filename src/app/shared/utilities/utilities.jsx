import DOMPurify from "dompurify";
import "./utilities.css";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { FiAlertTriangle, FiCheckCircle, FiClock } from "react-icons/fi";
dayjs.extend(relativeTime);

export function HtmlRenderer({ html }) {
  const highlightFiles = (htmlString) => {
    const cleanHtml = DOMPurify.sanitize(htmlString);
    const parser = new DOMParser();
    const doc = parser.parseFromString(cleanHtml, "text/html");

    // Find all links with data-type="file-attachment"
    const fileLinks = doc.querySelectorAll('a[data-type="file-attachment"]');

    fileLinks.forEach((link) => {
      const filename = link.getAttribute("filename") || link.textContent;

      // Create a span element to style the file pill
      const span = doc.createElement("span");
      span.className = "highlight-pill";
      span.innerHTML = `<i class="file-icon"> </i> ${filename}`;

      link.textContent = "";
      link.appendChild(span);

      // Removed target="_blank" so it doesn't even try to open a new tab
      link.setAttribute("download", filename);
    });

    return doc.body.innerHTML;
  };

  const handleContainerClick = async (event) => {
    // 1. Check if a file link was clicked
    const link = event.target.closest('a[data-type="file-attachment"]');
    if (!link) return;

    // 2. STOP the browser immediately. No previews, no new tabs.
    event.preventDefault();

    const filename =
      link.getAttribute("download") ||
      link.getAttribute("filename") ||
      "download";

    try {
      // 3. Fetch the actual file data
      const response = await fetch(link.href);
      if (!response.ok) throw new Error("Network response was not ok");

      // 4. Get the blob, but FORCE it to be an 'octet-stream' (binary download)
      const originalBlob = await response.blob();
      const forceDownloadBlob = new Blob([originalBlob], {
        type: "application/octet-stream",
      });

      const downloadUrl = window.URL.createObjectURL(forceDownloadBlob);

      // 5. Create a temporary, invisible link to trigger the pure download
      const tempLink = document.createElement("a");
      tempLink.style.display = "none";
      tempLink.href = downloadUrl;
      tempLink.download = filename;

      document.body.appendChild(tempLink);
      tempLink.click();

      // 6. Clean up
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(tempLink);
    } catch (error) {
      console.error("Failed to download the file directly:", error);
      // We do NOT use window.open here anymore, so it will never preview.
      alert("Failed to download file. Please check your network connection.");
    }
  };

  const highlightedHtml = highlightFiles(html);

  return (
    <div
      className="html-renderer"
      dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      onClick={handleContainerClick}
    />
  );
}

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const calcHHMM = (from, to) => {
  if (!from || !to) return null;
  const [fh, fm] = from.split(":").map(Number);
  const [th, tm] = to.split(":").map(Number);
  let diff = th * 60 + tm - (fh * 60 + fm);
  if (diff < 0) diff += 24 * 60;
  const hh = String(Math.floor(diff / 60)).padStart(2, "0");
  const mm = String(diff % 60).padStart(2, "0");
  return `${hh}:${mm}`;
};

// Utility function for time comparison
export const timeValidator = (type, relatedKey) => (value, data) => {
  const relatedValue = data[relatedKey];
  if (!value || !relatedValue) return true;
  const [vh, vm] = value.split(":").map(Number);
  const [rh, rm] = relatedValue.split(":").map(Number);
  const valueMinutes = vh * 60 + vm;
  const relatedMinutes = rh * 60 + rm;

  // 1 Validate from < to
  if (type === "from" && valueMinutes >= relatedMinutes)
    return "From-time must be earlier than To-time";
  if (type === "to" && valueMinutes <= relatedMinutes)
    return "To-time must be later than From-time";

  // 2 Validate times are not in the future
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  if (valueMinutes > currentMinutes) {
    return `${type === "from" ? "From" : "To"}-time cannot be in the future`;
  }
  return true;
};

export const dateValidator = (relatedKey, position) => (value, data) => {
  if (!value) return true;
  const parseDate = (val) => {
    const [day, month, year] = val.split("/");
    return new Date(`${year}-${month}-${day}`);
  };
  const currentDate = parseDate(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (position === "before" && currentDate < today) {
    return "Start Date cannot be in the past";
  }
  if (data[relatedKey]) {
    const relatedDate = parseDate(data[relatedKey]);

    if (position === "before" && currentDate > relatedDate) {
      return "Start Date cannot be after Due Date";
    }

    if (position === "after" && currentDate < relatedDate) {
      return "Due Date cannot be before Start Date";
    }
  }
  return true;
};

const getValueCaseInsensitive = (obj, key) => {
  const actualKey = Object.keys(obj).find(
    (k) => k.toLowerCase() === key.toLowerCase(),
  );
  return actualKey ? obj[actualKey] : undefined;
};

export const sortList = (list, direction = "desc") => {
  if (!Array.isArray(list)) return [];

  return [...list].sort((a, b) => {
    const dateStringA = getValueCaseInsensitive(a, "UpdatedAt");
    const dateStringB = getValueCaseInsensitive(b, "UpdatedAt");

    const timeA = dateStringA ? new Date(dateStringA).getTime() : 0;
    const timeB = dateStringB ? new Date(dateStringB).getTime() : 0;

    if (direction === "asc") {
      return timeA - timeB; // Ascending (Oldest first)
    }
    return timeB - timeA; // Descending (Newest first - Default)
  });
};

export const extractTime = (dateTime) => {
  const date = new Date(dateTime);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

// utilities.js
export const formatTimeHHMM = (dateTime) => {
  if (!dateTime) return "";
  const date = new Date(dateTime);
  const hh = date.getHours().toString().padStart(2, "0");
  const mm = date.getMinutes().toString().padStart(2, "0");
  return `${hh}:${mm}`;
};

export const buildOptionsResolver = (
  listKey,
  idKey,
  labelKey,
  filterFn = null,
  customMap = null,
) => {
  // 🔥 1. Add formData to the destructured arguments
  return ({ masterData, context, formData }) => {
    let list = masterData?.[listKey] || context?.data?.[listKey];

    if (!Array.isArray(list)) return [];

    if (filterFn) {
      // 🔥 2. Pass the entire state object into the filter function!
      list = list.filter((item) =>
        filterFn(item, { masterData, context, formData }),
      );
    }

    if (customMap) {
      return list.map(customMap);
    }

    return list.map((item) => ({
      label: item[labelKey],
      value: {
        id: item[idKey],
        name: item[labelKey],
      },
    }));
  };
};

export const getDueStatus = (dueDate) => {
  if (!dueDate) return null;

  const diff = dayjs(dueDate).diff(dayjs(), "day");

  if (diff < 0) {
    return {
      text: `${Math.abs(diff)} days overdue`,
      icon: <FiAlertTriangle className="due-icon" />,
      className: "overdue",
    };
  }

  if (diff === 0) {
    return {
      text: "Due today",
      icon: <FiClock className="due-icon" />,
      className: "today",
    };
  }

  return {
    text: `${diff} days left`,
    icon: <FiCheckCircle className="due-icon" />,
    className: "remaining",
  };
};

export const getInitials = (name) => {
  if (!name) return "U";
  const parts = name.split(" ");
  return parts.length > 1
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
};

export const getLabelStyle = (hexColor) => {
  // Fallback for missing colors
  if (!hexColor || !hexColor.startsWith("#")) {
    return {
      backgroundColor: "#f3f4f6",
      color: "#4b5563",
      borderColor: "#d1d5db",
    };
  }

  // Parse RGB values
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // YIQ formula to calculate perceived brightness (0 to 255)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;

  // If brightness is high (> 180), it's a light color. Force dark text.
  const isLight = yiq > 180;

  return {
    backgroundColor: `${hexColor}1A`, // 10% opacity background
    color: isLight ? "#374151" : hexColor, // Dark gray text for light colors
    borderColor: isLight ? `${hexColor}80` : `${hexColor}4D`, // Make border slightly darker for light colors
  };
};

// src/packages/list/components/HighlightText.jsx

export function HighlightText({ text = "", highlight = "" }) {
  if (!highlight.trim()) return <span>{text}</span>;

  const regex = new RegExp(
    `(${highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi",
  );
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-yellow-200 text-yellow-900 rounded-sm px-0.5 not-italic font-semibold"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  );
}
