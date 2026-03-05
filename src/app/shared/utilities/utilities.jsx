import DOMPurify from "dompurify";
import "./utilities.css"


export function HtmlRenderer({ html }) {
  const highlightFiles = (htmlString) =>{
    const cleanHtml = DOMPurify.sanitize(htmlString);
    const parser = new DOMParser();
    const doc = parser.parseFromString(cleanHtml, "text/html");
    const fileLinks = doc.querySelectorAll('a[data-type="file-attachment"]');
    fileLinks.forEach((link) => {
      const filename = link.getAttribute('filename') || link.textContent;
      const span = doc.createElement('span');
      span.className = 'highlight-pill';
      span.innerHTML = `<i class="file-icon"> 📎</i> ${filename}`;
      link.textContent = '';
      link.appendChild(span);
      link.setAttribute("target", "_blank");
      link.setAttribute('download', filename);
    });
    return doc.body.innerHTML;
  };
  const highlightedHtml = highlightFiles(html);
  
    return (
        <div
            className="html-renderer"
            dangerouslySetInnerHTML={{__html: highlightedHtml}}
        />
    );
  };



//   import { useMemo } from "react";
// import { renderToStaticMarkup } from "react-dom/server";
// import DOMPurify from "dompurify";
// import "./utilities.css"

// // ── MUI Icons
// import AttachFileIcon from "@mui/icons-material/AttachFile";
// import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
// import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
// import ImageIcon from "@mui/icons-material/Image";
// import VideoFileIcon from "@mui/icons-material/VideoFile";
// import AudioFileIcon from "@mui/icons-material/AudioFile";
// import FolderZipIcon from "@mui/icons-material/FolderZip";
// import DescriptionIcon from "@mui/icons-material/Description";

// ── Pre-render MUI icons to SVG strings (done once at module load, not per render)
// const FILE_ICON_MAP = {
//   pdf:  renderToStaticMarkup(<PictureAsPdfIcon fontSize="small" />),
//   png:  renderToStaticMarkup(<ImageIcon fontSize="small" />),
//   jpg:  renderToStaticMarkup(<ImageIcon fontSize="small" />),
//   jpeg: renderToStaticMarkup(<ImageIcon fontSize="small" />),
//   gif:  renderToStaticMarkup(<ImageIcon fontSize="small" />),
//   webp: renderToStaticMarkup(<ImageIcon fontSize="small" />),

  
//   mp4:  renderToStaticMarkup(<VideoFileIcon fontSize="small" />),
//   mov:  renderToStaticMarkup(<VideoFileIcon fontSize="small" />),
//   mp3:  renderToStaticMarkup(<AudioFileIcon fontSize="small" />),
//   wav:  renderToStaticMarkup(<AudioFileIcon fontSize="small" />),
//   zip:  renderToStaticMarkup(<FolderZipIcon fontSize="small" />),
//   rar:  renderToStaticMarkup(<FolderZipIcon fontSize="small" />),
//   doc:  renderToStaticMarkup(<DescriptionIcon fontSize="small" />),
//   docx: renderToStaticMarkup(<DescriptionIcon fontSize="small" />),
//   xls:  renderToStaticMarkup(<InsertDriveFileIcon fontSize="small" />),
//   xlsx: renderToStaticMarkup(<InsertDriveFileIcon fontSize="small" />),
// };

// const DEFAULT_ICON = renderToStaticMarkup(<AttachFileIcon fontSize="small" />);

// function getIconForFile(filename) {
//   const ext = filename?.split(".").pop()?.toLowerCase();
//   return FILE_ICON_MAP[ext] ?? DEFAULT_ICON;
// }

// // ── Component
// export function HtmlRenderer({ html }) {
//   const highlightedHtml = useMemo(() => {
//     if (!html) return "";
//     try {
//       const cleanHtml = DOMPurify.sanitize(html);
//       const doc = new DOMParser().parseFromString(cleanHtml, "text/html");

//       doc.querySelectorAll('a[data-type="file-attachment"]').forEach((link) => {
//         const filename =
//           link.getAttribute("filename") || link.textContent.trim();
//         if (!filename) return;

//         // Icon SVG string — safe because it's from React, not user input
//         const iconSvg = getIconForFile(filename);

//         // Build pill using DOM API
//         const pill = doc.createElement("span");
//         pill.className = "highlight-pill";

//         const iconWrapper = doc.createElement("span");
//         iconWrapper.className = "file-icon-wrapper";
//         iconWrapper.innerHTML = iconSvg; // trusted: React-generated SVG only

//         const label = doc.createElement("span");
//         label.className = "file-label";
//         label.textContent = filename; // textContent = XSS safe

//         pill.append(iconWrapper, label);
//         link.replaceChildren(pill);
//         link.setAttribute("target", "_blank");
//         link.setAttribute("rel", "noopener noreferrer");
//         link.setAttribute("download", filename);
//       });

//       return doc.body.innerHTML;
//     } catch (err) {
//       console.error("[HtmlRenderer] Failed to process HTML:", err);
//       return DOMPurify.sanitize(html); // safe fallback
//     }
//   }, [html]);

//   if (!html) return null;

//   return (
//     <div
//       className="html-renderer"
//       dangerouslySetInnerHTML={{ __html: highlightedHtml }}
//     />
//   );
// }


//   date format

export const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // calculation - Hours

  export const calcHHMM = (from, to)=>{
    if (!from || !to) return null;
    const [fh,fm] = from.split(":").map(Number);
    const [th,tm] = to.split(":").map(Number);
    let diff = (th * 60 + tm) - (fh * 60 + fm);
    if (diff < 0) diff += 24*60;
    const hh =String(Math.floor(diff/60)).padStart(2,"0");
    const mm = String(diff % 60).padStart(2,"0");
    return `${hh}:${mm}`;
  }