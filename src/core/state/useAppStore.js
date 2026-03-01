import { create } from "zustand";

export const useAppStore = create((set) => ({
  //   user: null,
  token: null,
  isAuthenticated: false,

  login: (token) => {
    sessionStorage.setItem("user", JSON.stringify(token));
    set({
      token,
      isAuthenticated: true,
    });
  },
  // logout: () => {
  //   sessionStorage.removeItem("user");
  //   set({
  //     //   user: null,
  //     token: null,
  //     isAuthenticated: false,
  //   });
  // },
}));
