import { create } from "zustand"

export const useAppStore = create((set) => ({
//   user: null,
  token: null,
  isAuthenticated: false,

  login: (token) =>
    set({
      token,
      isAuthenticated: true
    }),

  logout: () =>
    set({
    //   user: null,
      token: null,
      isAuthenticated: false
    })
}))
