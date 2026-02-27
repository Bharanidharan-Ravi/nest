import React, { useEffect } from 'react';
import { useUIStore } from '../../../core/state/useUIStore';

import { OwlEyeLoader } from "./OwlEyeLoader"; 
import { useState } from 'react';

export function GlobalUI() {
  const { isLoading, error, success, clearMessages } = useUIStore();
  const [showLoader, setShowLoader] = useState(false);

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
        className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
          isLoading && showLoader
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Loader Box */}
        <div
          className={`bg-white p-5 rounded-2xl shadow-2xl flex flex-col items-center gap-3 transition-transform duration-300 ease-in-out ${
            isLoading && showLoader ? "scale-100" : "scale-95"
          }`}
        >
          {/* 🔥 REPLACE THE GENERIC SPINNER WITH YOUR OWL EYE */}
          <OwlEyeLoader className="w-28 h-auto"/>
          
          {/* Optional: Add text below it */}
          <span className="text-gray-700 font-semibold tracking-wider text-sm mt-2">
            LOADING
          </span>
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