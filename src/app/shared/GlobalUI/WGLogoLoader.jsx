import React from "react";

export const WGLogoLoader = ({ className = "w-24 h-auto", animate = true }) => {
  // The exact golden color from your logo
  const goldenColor = "#FFB116";
  const strokeWidth = 9;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 6 152 118"
      className={`${className} owl-loader${animate ? " owl-float" : ""}`}
      overflow="visible"
      aria-label="WorkGlow"
    >
      {animate && (
        <style>
          {`
            /* One shared 2.4s rhythm so every part moves together:
               the owl floats, the eyebrow lifts twice (a curious "hmm?"),
               the pupils glance side to side and blink once at the end. */
            .owl-float { animation: owlFloat 2.4s ease-in-out infinite; }
            .owl-brow {
              transform-box: fill-box;
              transform-origin: center;
              animation: owlBrow 2.4s cubic-bezier(.45,0,.25,1) infinite;
            }
            .owl-pupils { animation: owlScan 2.4s ease-in-out infinite; }
            .owl-pupil {
              transform-box: fill-box;
              transform-origin: center;
              animation: owlBlink 2.4s ease-in-out infinite;
            }
            @keyframes owlFloat {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-4px); }
            }
            @keyframes owlBrow {
              0%, 45%, 100% { transform: translateY(0) scaleX(1); }
              12% { transform: translateY(-6px) scaleX(1.04); }
              24% { transform: translateY(0) scaleX(1); }
              34% { transform: translateY(-4px) scaleX(1.02); }
            }
            @keyframes owlScan {
              0%, 100% { transform: translateX(-3px); }
              50% { transform: translateX(3px); }
            }
            @keyframes owlBlink {
              0%, 88%, 100% { transform: scaleY(1); }
              93% { transform: scaleY(0.1); }
            }
          `}
        </style>
      )}

      {/* --- EYEBROW --- */}
      {/* Thin check-mark "V": arched arms (longer on the left) meeting in a
          rounded dip instead of a sharp corner */}
      <path
        className={animate ? "owl-brow" : undefined}
        d="M 42 13 Q 67 14 81 27 Q 85 31 89 27 Q 101 18 119 20"
        stroke={goldenColor}
        strokeWidth={strokeWidth - 3}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* --- BEAK --- */}
      {/* White "V" hanging from where the eyes touch; drawn first so the eye
          circles cover its top and form the upper edge of the beak */}
      <path
        d="M 82 66 L 69 94 Q 75 106 80 116.5 Q 82 119 84 116.5 Q 89 106 94 94 Z"
        stroke={goldenColor}
        strokeWidth={strokeWidth - 3}
        strokeLinejoin="round"
        fill="#fff"
      />

      {/* --- EYE SOCKETS --- */}
      {/* Left Eye: BIGGER socket, white inside */}
      <circle
        cx="45"
        cy="68"
        r="36"
        stroke={goldenColor}
        strokeWidth={strokeWidth}
        fill="#fff"
      />
      {/* Right Eye: SMALLER socket, just touching the left one */}
      <circle
        cx="111"
        cy="70"
        r="30"
        stroke={goldenColor}
        strokeWidth={strokeWidth}
        fill="#fff"
      />

      {/* --- PUPILS --- */}
      {/* Both pupils glance inward toward the beak */}
      <g className={animate ? "owl-pupils" : undefined}>
        <circle className={animate ? "owl-pupil" : undefined} cx="53" cy="73" r="13" fill="#000" />
        <circle className={animate ? "owl-pupil" : undefined} cx="105" cy="73" r="10" fill="#000" />
      </g>
    </svg>
  );
};
