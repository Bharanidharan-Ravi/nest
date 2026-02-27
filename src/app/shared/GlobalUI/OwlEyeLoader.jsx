import React from "react";

export const OwlEyeLoader = ({ className = "w-24 h-auto" }) => {
  // The exact golden color from your logo
  const goldenColor = "#F4B400";
  const strokeWidth = 8;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 85"
      className={`${className} owl-loader`}
      aria-label="Loading..."
    >
      <style>
        {`
          /* A very subtle, smooth horizontal scan. 
            It gives life to the loader without changing the logo's core look.
          */
          .owl-pupils {
            animation: owlScan 1.2s ease-in-out infinite alternate;
          }
          @keyframes owlScan {
            from { transform: translateX(-2px); }
            to { transform: translateX(2px); }
          }
        `}
      </style>

      {/* --- EYE SOCKETS --- */}
      {/* Left Eye (Centered at 35,35 with radius 28) */}
      <circle
        cx="35"
        cy="35"
        r="28"
        stroke={goldenColor}
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Right Eye (Centered at 85,35 with radius 28) */}
      <circle
        cx="85"
        cy="35"
        r="28"
        stroke={goldenColor}
        strokeWidth={strokeWidth}
        fill="none"
      />

      {/* --- BEAK --- */}
      {/* Connects from the bottom of the eyes to a sharp point */}
      <path
        d="M 50 58 L 60 76 L 70 58"
        stroke={goldenColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* --- PUPILS --- */}
      <g className="owl-pupils">
        {/* Left Pupil: Much LARGER (radius 12), centered in its socket.
        */}
        <circle cx="35" cy="35" r="12" fill="#000" />
        
        {/* Right Pupil: Much SMALLER (radius 6), centered in its socket.
        */}
        <circle cx="85" cy="35" r="6" fill="#000" />
      </g>
    </svg>
  );
};