import { useState } from "react";

export default function DND() {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const [input, setInput] = useState(null);
  const download = async (fileId) => {
    try {
      const response = await fetch(
        `${API_URL}/attachment/download/${fileId}`
      )

      if (!response.ok) throw new Error("network error");
      const json = await response.json();
      const fileInfo = json;

      if(!fileInfo || !fileInfo.FileData) {
        alert("Download failed");
        return;
      }

      const byteCharacters = atob(fileInfo.FileData);
      const byteNumber = new Array(byteCharacters.length);
      for (let i= 0; i < byteCharacters.length; i++) {
        byteNumber[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumber);

      const blob = new Blob([byteArray], {type: fileInfo.ContentType});

      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileInfo.FileName;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("failed to download:", error);
      alert("AN error occurred");
    }
  }
  return (
    <div>
      <h2>Login</h2>
      <input type="text" onChange={(e) => setInput(e.target.value)}/>
      <button onClick={() => download(input)}>click</button>
    </div>
  );
}