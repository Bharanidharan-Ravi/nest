import { create } from "zustand";
export const useAppStore = create((set) => ({
  token: JSON.parse(sessionStorage.getItem("user") || "null"),
  isAuthenticated: !!sessionStorage.getItem("user"),
  versionModal: {
    open: false,
    currentVersion: "",
    latestVersion: "",
  },

  showVersionModal: (payload) =>
    set({
      versionModal: {
        open: true,
        ...payload,
      },
    }),

  hideVersionModal: () =>
    set({
      versionModal: {
        open: false,
        currentVersion: "",
        latestVersion: "",
      },
    }),
    
  login: (token) => {
    sessionStorage.setItem("user", JSON.stringify(token));

    set({
      token,
      isAuthenticated: true,
    });
  },

  logout: () => {
    sessionStorage.removeItem("user");

    set({
      token: null,
      isAuthenticated: false,
    });
  },
}));
