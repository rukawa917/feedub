import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'dark' | 'light'

interface ThemeState {
  theme: Theme

  // Actions
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

/**
 * Apply theme to document
 */
function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'light') {
    root.classList.add('light')
  } else {
    root.classList.remove('light')
  }
}

/**
 * Theme store with localStorage persistence
 * Manages dark/light mode preference
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',

      setTheme: (theme) => {
        applyTheme(theme)
        set({ theme })
      },

      toggleTheme: () => {
        const currentTheme = get().theme
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
        applyTheme(newTheme)
        set({ theme: newTheme })
      },
    }),
    {
      name: 'theme-storage',
      version: 1,
      onRehydrateStorage: () => (state) => {
        // Apply theme on rehydration (page load)
        if (state?.theme) {
          applyTheme(state.theme)
        }
      },
    }
  )
)
