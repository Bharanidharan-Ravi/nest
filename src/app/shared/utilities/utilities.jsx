import DOMPurify from "dompurify";
import "./utilities.css"
export function HtmlRenderer({ html }) {
    const cleanHtml = DOMPurify.sanitize(html);
  
    return (
        <div
            className="html-renderer"
            dangerouslySetInnerHTML={{__html: cleanHtml}}
        />
    );
  };

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
    console.log("from",from);
    console.log("to",to);
    if (!from || !to) return null;
    const [fh,fm] = from.split(":").map(Number);
    const [th,tm] = to.split(":").map(Number);
    let diff = (th * 60 + tm) - (fh * 60 + fm);
    if (diff < 0) diff += 24*60;
    const hh =String(Math.floor(diff/60)).padStart(2,"0");
    const mm = String(diff % 60).padStart(2,"0");
    return `${hh}:${mm}`;
  }