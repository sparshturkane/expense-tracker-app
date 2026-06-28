import { createContext, useContext, useMemo } from 'react'
import { useColorScheme } from 'react-native'
import { DARK_THEME, LIGHT_THEME, ThemeColors } from './constants'

interface ThemeContextValue {
  colors: ThemeColors
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: LIGHT_THEME,
  isDark: false,
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme()
  const isDark = scheme === 'dark'

  const value = useMemo(
    () => ({
      colors: isDark ? DARK_THEME : LIGHT_THEME,
      isDark,
    }),
    [isDark]
  )

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}

export function useThemeColors() {
  return useContext(ThemeContext).colors
}
