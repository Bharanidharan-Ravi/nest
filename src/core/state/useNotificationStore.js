// notificationStore.js

import { create } from "zustand";

export const useNotificationStore = create((set) => ({
  count: 0,

  setCount: (count) =>
    set({ count }),

  increment: () =>
    set((state) => ({
      count: state.count + 1,
    })),

  reset: () =>
    set({ count: 0 }),
}));