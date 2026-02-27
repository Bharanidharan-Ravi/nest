import { create } from 'zustand';

export const useUIStore = create((set, get) => ({
  isLoading: false,
  error: null,
  success: null,
  
  setLoading: (status) => set({ isLoading: status }),
  
  setError: (msg) => {
    // 🔥 FIX: Prevent the same error toast from popping up multiple times 
    // during a rapid React Query retry sequence.
    
    
    if (get().error === msg) return; 
    set({ error: msg });
  },
  
  setSuccess: (msg) => {
    if (get().success === msg) return;
    set({ success: msg });
  },
  
  clearMessages: () => set({ error: null, success: null }),
}));