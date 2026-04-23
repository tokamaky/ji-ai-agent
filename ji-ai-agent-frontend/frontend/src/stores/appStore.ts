import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ThemeMode } from '@/types'

interface AppStore {
  theme: ThemeMode
  sidebarOpen: boolean
  setTheme: (theme: ThemeMode) => void
  toggleSidebar: () => void
  openSidebar: () => void
  closeSidebar: () => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      theme: 'system',
      sidebarOpen: false,

      setTheme: (theme) => set({ theme }),

      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      openSidebar: () => set({ sidebarOpen: true }),
      closeSidebar: () => set({ sidebarOpen: false }),
    }),
    {
      name: 'ji-ai-app',
      partialize: (s) => ({ theme: s.theme }),
    },
  ),
)
