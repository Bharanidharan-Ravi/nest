import { useState } from "react";

// ── GitHub Style Split Button Component ─────────────────────────────
// ── GitHub Style Split Button Component ─────────────────────────────
const SplitButton = ({ action, formData, handleSubmit, isPending }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = action.options[selectedIndex];

  // 🔥 This guarantees Tailwind compiles the colors correctly
  const getColorClasses = (intent) => {
    switch (intent) {
      case "danger": return "bg-red-600 hover:bg-red-700 text-white";
      case "success": return "bg-green-600 hover:bg-green-700 text-white";
      case "warning": return "bg-brand-yellow hover:bg-yellow-600 text-white"; // Assuming you have brand-yellow
      case "primary": return "bg-blue-600 hover:bg-blue-700 text-white";
      default: return "bg-gray-800 hover:bg-gray-900 text-white"; // neutral
    }
  };

  const colorClasses = getColorClasses(selectedOption.intent);

  return (
    <div className="relative inline-flex shadow-sm rounded-md z-10">
      {/* Main Action Button */}
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setIsOpen(false);
          selectedOption.onClick({ formData, submitForm: handleSubmit });
        }}
        className={`relative inline-flex items-center px-4 py-2 rounded-l-md border border-transparent text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ${colorClasses}`}
      >
        {isPending ? "Processing..." : selectedOption.label}
      </button>

      {/* Dropdown Arrow Button */}
      <button
        type="button"
        disabled={isPending}
        onClick={() => setIsOpen(!isOpen)}
        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border-l border-l-white/30 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ${colorClasses}`}
      >
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="origin-bottom-right absolute right-0 bottom-full mb-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 overflow-hidden">
            <div className="py-1">
              {action.options.map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedIndex(idx);
                    setIsOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-3 text-sm transition-colors ${
                    selectedIndex === idx ? "bg-gray-100 text-gray-900 font-semibold" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex flex-col">
                    <span>{opt.label}</span>
                    {opt.subtext && <span className="text-xs text-gray-500 font-normal mt-0.5">{opt.subtext}</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
export default SplitButton;