import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  theme: "light" | "dark";
  commandMenuOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  setSidebarCollapsed: (v: boolean) => void;
  toggleSidebarCollapsed: () => void;
  toggleSidebar: () => void;
  setTheme: (t: "light" | "dark") => void;
  toggleTheme: () => void;
  setCommandMenuOpen: (v: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarOpen: true,
      sidebarCollapsed: false,
      theme: "light",
      commandMenuOpen: false,
      setSidebarOpen: (v) => set({ sidebarOpen: v }),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      toggleSidebarCollapsed: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
      setTheme: (t) => set({ theme: t }),
      toggleTheme: () => set({ theme: get().theme === "light" ? "dark" : "light" }),
      setCommandMenuOpen: (v) => set({ commandMenuOpen: v }),
    }),
    { name: "amortix-ui" },
  ),
);
