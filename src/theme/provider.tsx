import { View } from 'react-native'
import { DARK_THEME } from './constants'

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return <View style={{ flex: 1 }}>{children}</View>
}

export const useThemeColors = () => DARK_THEME

export const getThemeMode = () => 'dark' as const
