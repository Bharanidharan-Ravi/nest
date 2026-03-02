import React, { useState, useEffect } from "react";
import { FaArrowDown } from "react-icons/fa";
import "./FloatingArrowScroll.css";

const FloatingArrowScroll = ({ targetId }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let timeout;

    const handleMouseMove = () => {
      setVisible(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setVisible(false), 2000); 
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);

  const handleClick = () => {
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "end" });
    } else {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }
  };

  return (
    <div
      className={`floating-arrow ${visible ? "visible" : "hidden"}`}
      onClick={handleClick}
    >
      <FaArrowDown />
    </div>
  );
};

export default FloatingArrowScroll;
