import { TextStyle, ViewStyle } from 'react-native'

export interface ThemeColors {
  bg: string
  bgSurface: string
  bgElevated: string
  bgSecondary: string
  bgTertiary: string
  text: string
  textSecondary: string
  textMuted: string
  textTertiary: string
  accent: string
  accentLight: string
  accentDark: string
  success: string
  successLight: string
  error: string
  errorLight: string
  warning: string
  warningLight: string
  border: string
  borderLight: string
  divider: string
  overlay: string
  card: string
  navBar: string
  tabBar: string
  skeleton: string
  skeletonHighlight: string
}

export const LIGHT_THEME: ThemeColors = {
  bg: '#F2F2F7',
  bgSurface: '#FFFFFF',
  bgElevated: '#F8F8FA',
  bgSecondary: '#F5F5F7',
  bgTertiary: '#EFEFF4',
  text: '#1C1C1E',
  textSecondary: '#636366',
  textMuted: '#98989D',
  textTertiary: '#C7C7CC',
  accent: '#007AFF',
  accentLight: '#E8F1FF',
  accentDark: '#0056CC',
  success: '#34C759',
  successLight: '#E8F8ED',
  error: '#FF3B30',
  errorLight: '#FFEAE9',
  warning: '#FF9500',
  warningLight: '#FFF3E0',
  border: '#D1D1D6',
  borderLight: '#E5E5EA',
  divider: '#F2F2F7',
  overlay: 'rgba(0,0,0,0.3)',
  card: '#FFFFFF',
  navBar: 'rgba(255,255,255,0.85)',
  tabBar: 'rgba(255,255,255,0.85)',
  skeleton: '#E5E5EA',
  skeletonHighlight: '#F2F2F7',
}

export const DARK_THEME: ThemeColors = {
  bg: '#000000',
  bgSurface: '#1C1C1E',
  bgElevated: '#2C2C2E',
  bgSecondary: '#1C1C1E',
  bgTertiary: '#2C2C2E',
  text: '#FFFFFF',
  textSecondary: '#AEAEB2',
  textMuted: '#636366',
  textTertiary: '#48484A',
  accent: '#0A84FF',
  accentLight: '#1A3A5C',
  accentDark: '#4DA6FF',
  success: '#30D158',
  successLight: '#1A3A2A',
  error: '#FF453A',
  errorLight: '#3A1A1A',
  warning: '#FF9F0A',
  warningLight: '#3A2A1A',
  border: '#38383A',
  borderLight: '#2C2C2E',
  divider: '#1C1C1E',
  overlay: 'rgba(0,0,0,0.5)',
  card: '#1C1C1E',
  navBar: 'rgba(0,0,0,0.85)',
  tabBar: 'rgba(0,0,0,0.85)',
  skeleton: '#2C2C2E',
  skeletonHighlight: '#38383A',
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
  xxxxxl: 48,
} as const

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const

export const typography = {
  caption: { fontSize: 12, lineHeight: 16, letterSpacing: 0.4 } as TextStyle,
  captionBold: { fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 0.4 } as TextStyle,
  footnote: { fontSize: 13, lineHeight: 18, letterSpacing: -0.08 } as TextStyle,
  footnoteBold: { fontSize: 13, lineHeight: 18, fontWeight: '600', letterSpacing: -0.08 } as TextStyle,
  subhead: { fontSize: 14, lineHeight: 20, letterSpacing: -0.08 } as TextStyle,
  subheadBold: { fontSize: 14, lineHeight: 20, fontWeight: '600', letterSpacing: -0.08 } as TextStyle,
  callout: { fontSize: 15, lineHeight: 22, letterSpacing: -0.2 } as TextStyle,
  calloutBold: { fontSize: 15, lineHeight: 22, fontWeight: '600', letterSpacing: -0.2 } as TextStyle,
  body: { fontSize: 16, lineHeight: 22, letterSpacing: -0.32 } as TextStyle,
  bodyBold: { fontSize: 16, lineHeight: 22, fontWeight: '600', letterSpacing: -0.32 } as TextStyle,
  headline: { fontSize: 17, lineHeight: 24, fontWeight: '600', letterSpacing: -0.34 } as TextStyle,
  title3: { fontSize: 18, lineHeight: 24, fontWeight: '700', letterSpacing: -0.36 } as TextStyle,
  title2: { fontSize: 20, lineHeight: 26, fontWeight: '700', letterSpacing: -0.4 } as TextStyle,
  title1: { fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: -0.48 } as TextStyle,
  largeTitle: { fontSize: 30, lineHeight: 36, fontWeight: '700', letterSpacing: -0.6 } as TextStyle,
} as const

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  } as ViewStyle,
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  } as ViewStyle,
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  } as ViewStyle,
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 10,
  } as ViewStyle,
} as const

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '\u20AC',
  GBP: '\u00A3',
  INR: '\u20B9',
  JPY: '\u00A5',
  AUD: 'A$',
  CAD: 'C$',
  MXN: 'MX$',
  BRL: 'R$',
  PHP: '\u20B1',
}

export function getCurrencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code] || code
}

export const formatCurrency = (amount: number, currencyCode = 'USD') => {
  const symbol = getCurrencySymbol(currencyCode)
  return `${symbol}${Math.abs(amount).toFixed(2)}`
}

export const formatPercentage = (value: number) => `${value.toFixed(1)}%`
