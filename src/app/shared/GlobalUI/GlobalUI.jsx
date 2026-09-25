import React, { useEffect, useState } from 'react';
import { useUIStore } from '../../../core/state/useUIStore';

import { WGLogoLoader } from "./WGLogoLoader";

export function GlobalUI() {
  const { isLoading: apiLoading, pageLoads, error, success, clearMessages } = useUIStore();
  const isLoading = apiLoading || pageLoads > 0;
  const [showLoader, setShowLoader] = useState(false);

  const loaderVisible = isLoading && showLoader;

  // This handles the smooth fade-in/out logic based on the store's isLoading state
  useEffect(() => {
    let timer;
    if (isLoading) {
      setShowLoader(true);
    } else {
      // Small delay before removing from DOM for smooth fade-out transition
      timer = setTimeout(() => setShowLoader(false), 300);
    }
    return () => clearTimeout(timer);
  }, [isLoading]);

  // Auto-hide toast messages
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        clearMessages();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success, clearMessages]);

  return (
    <>
      {/* GLOBAL LOADER OVERLAY */}
      <div
        className={`fixed inset-0 z-[9999] flex items-center justify-center bg-white/40 backdrop-blur-[4px] transition-opacity duration-300 ease-in-out ${
          loaderVisible
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Owl floats straight on the frosted backdrop — no card, no text */}
        <div
          className={`transition-transform duration-500 ease-out ${
            loaderVisible ? "scale-100" : "scale-90"
          }`}
        >
          <WGLogoLoader className="w-32 h-auto drop-shadow-[0_10px_24px_rgba(255,177,22,0.35)]" />
        </div>
      </div>

      {/* GLOBAL TOAST MESSAGES (Keep existing code for error/success) */}
      <div className="fixed top-4 right-4 z-[10000] flex flex-col gap-2 max-w-[90vw] sm:max-w-sm transition-all duration-300">
        {/* ... (your existing error/success toast code) ... */}
         <div className={`transition-all duration-300 transform ${error ? "translate-x-0 opacity-100" : "translate-x-10 opacity-0 hidden"}`}>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-lg flex justify-between items-start">
               <div className="flex-1 text-sm font-medium break-words">{error}</div>
              <button onClick={clearMessages} className="text-red-400 hover:text-red-700 font-bold ml-4 text-lg leading-none">&times;</button>
            </div>
          )}
        </div>

        <div className={`transition-all duration-300 transform ${success ? "translate-x-0 opacity-100" : "translate-x-10 opacity-0 hidden"}`}>
          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-lg flex justify-between items-start">
              <div className="flex-1 text-sm font-medium break-words">{success}</div>
              <button onClick={clearMessages} className="text-green-400 hover:text-green-700 font-bold ml-4 text-lg leading-none">&times;</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}