import React, { useState, useEffect } from "react";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";

const FloatingArrowScroll = () => {
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [showBottomBtn, setShowBottomBtn] = useState(true);

  // We look for the main scroll container we just named in MainLayout
  const scrollContainerId = "main-scroll-container";

  useEffect(() => {
    const scrollContainer = document.getElementById(scrollContainerId);
    if (!scrollContainer) return;

    const handleScroll = () => {
      // Show "Top" arrow if we've scrolled down a bit
      if (scrollContainer.scrollTop > 200) {
        setShowTopBtn(true);
      } else {
        setShowTopBtn(false);
      }

      // Hide "Bottom" arrow if we hit the very bottom
      const isAtBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop <= scrollContainer.clientHeight + 50;
      if (isAtBottom) {
        setShowBottomBtn(false);
      } else {
        setShowBottomBtn(true);
      }
    };

    scrollContainer.addEventListener("scroll", handleScroll);
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    const scrollContainer = document.getElementById(scrollContainerId);
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const scrollToBottom = () => {
    const scrollContainer = document.getElementById(scrollContainerId);
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: "smooth" });
    }
  };

  return (
    <div className="fixed bottom-12 right-12 flex flex-col gap-3 z-50">
      
      {/* UP ARROW */}
      <button
        onClick={scrollToTop}
        className={`p-3 rounded-full bg-white text-gray-700 shadow-lg border border-gray-200 hover:bg-gray-50 transition-all duration-300 ${
          showTopBtn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
        title="Scroll to Top"
      >
        <FaArrowUp size={16} />
      </button>

      {/* DOWN ARROW */}
      <button
        onClick={scrollToBottom}
        className={`p-3 rounded-full bg-brand-yellow text-white shadow-lg hover:bg-yellow-600 transition-all duration-300 ${
          showBottomBtn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
        title="Scroll to Bottom"
      >
        <FaArrowDown size={16} />
      </button>
      
    </div>
  );
};

export default FloatingArrowScroll;









// import React, { useState, useEffect } from "react";
// import { FaArrowDown } from "react-icons/fa";
// import "./FloatingArrowScroll.css";

// const FloatingArrowScroll = ({ targetId }) => {
//   const [visible, setVisible] = useState(true);

//   useEffect(() => {
//     let timeout;

//     const handleMouseMove = () => {
//       setVisible(true);
//       clearTimeout(timeout);
//       timeout = setTimeout(() => setVisible(false), 2000); 
//     };

//     window.addEventListener("mousemove", handleMouseMove);

//     return () => {
//       window.removeEventListener("mousemove", handleMouseMove);
//       clearTimeout(timeout);
//     };
//   }, []);

//   const handleClick = () => {
//     const target = document.getElementById(targetId);
//     if (target) {
//       target.scrollIntoView({ behavior: "smooth", block: "end" });
//     } else {
//       window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
//     }
//   };

//   return (
//     <div
//       className={`floating-arrow ${visible ? "visible" : "hidden"}`}
//       onClick={handleClick}
//     >
//       <FaArrowDown />
//     </div>
//   );
// };

// export default FloatingArrowScroll;
