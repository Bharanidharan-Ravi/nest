import DOMPurify from "dompurify";
import "./utilities.css";

export function HtmlRenderer({ html }) {
  const highlightFiles = (htmlString) => {
    const cleanHtml = DOMPurify.sanitize(htmlString);
    const parser = new DOMParser();
    const doc = parser.parseFromString(cleanHtml, "text/html");

    // Find all links with data-type="file-attachment"
    const fileLinks = doc.querySelectorAll('a[data-type="file-attachment"]');

    fileLinks.forEach((link) => {
      const filename = link.getAttribute('filename') || link.textContent;
      const fileExtension = filename.split('.').pop().toLowerCase();

      // Create a span element to style the file pill
      const span = doc.createElement('span');
      span.className = 'highlight-pill';
      span.innerHTML = `<i class="file-icon"> </i> ${filename}`;

      link.textContent = '';
      link.appendChild(span);
      link.setAttribute("target", "_blank");

      // Force download for text-based files like .txt, .html, .csv, etc.
      if (fileExtension === 'txt' || fileExtension === 'html' || fileExtension === 'csv') {
        // Create a Blob URL for text-based files to force download
        const blob = new Blob([link.href], { type: 'text/plain' });
        const downloadUrl = URL.createObjectURL(blob);
        link.setAttribute('href', downloadUrl);
        link.setAttribute('download', filename);
      } else {
        link.setAttribute('download', filename);
      }
    });

    return doc.body.innerHTML;
  };

  const highlightedHtml = highlightFiles(html);

  return (
    <div
      className="html-renderer"
      dangerouslySetInnerHTML={{ __html: highlightedHtml }}
    />
  );
}

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// calculation - Hours

export const calcHHMM = (from, to) => {
  if (!from || !to) return null;
  const [fh, fm] = from.split(":").map(Number);
  const [th, tm] = to.split(":").map(Number);
  let diff = (th * 60 + tm) - (fh * 60 + fm);
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
  if (type === "to" && valueMinutes <= relatedMinutes) return "To-time must be later than From-time";

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
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// utilities.js
export const formatTimeHHMM = (dateTime) => {
  if (!dateTime) return "";
  const date = new Date(dateTime);
  const hh = date.getHours().toString().padStart(2, "0");
  const mm = date.getMinutes().toString().padStart(2, "0");
  return `${hh}:${mm}`;
};