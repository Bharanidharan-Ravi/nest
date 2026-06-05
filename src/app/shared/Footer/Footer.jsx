import React from "react";
import "./Footer.css";
import { APP_VERSION } from "../Version";
const Footer = () => {
  return (
    <footer className="wg-footer">
      <span>© {new Date().getFullYear()} WorkGlow Solutions</span>
      <span
        style={{
          marginLeft: 10,
          fontSize: "10px",
          opacity: 0.7,
        }}
      >
        v{APP_VERSION}
      </span>
    </footer>
  );
};

export default Footer;
