export const DARK_THEME = {
  bg: '#0A0A0A',
  bgSurface: '#171717',
  bgElevated: '#252525',
  bgBlurred: 'rgba(19, 19, 19, 0.84)',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textMuted: '#737373',
  textDisabled: '#525252',
  accent: '#0A84FF',
  accentLight: '#E6F2FF',
  accentDark: '#006BD3',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  border: '#2A2A2A',
  divider: '#1A1A1A',
  card: {
    light: 'rgba(237, 246, 254, 0.1)',
    dark: '#1F2937',
  },
  progressFilled: '#0A84FF',
  progressBar: '#374151',
  progressEmpty: 'rgba(255, 255, 255, 0.06)',
}

export const LIGHT_THEME = {
  bg: '#F9FAFB',
  bgSurface: '#FFFFFF',
  bgElevated: '#F3F4F6',
  bgBlurred: 'rgba(251, 254, 255, 0.84)',
  text: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textDisabled: '#D1D5DB',
  accent: '#0A84FF',
  accentLight: '#E0F2FE',
  accentDark: '#006BD3',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  border: '#E5E7EB',
  divider: '#E5E7EB',
  card: {
    light: '#FFFFFF',
    dark: 'rgba(234, 241, 249, 0.1)',
  },
  progressFilled: '#0A84FF',
  progressBar: '#F3F4F6',
  progressEmpty: '#E5E7EB',
}

export const useThemeColors = () => {
  return DARK_THEME
}

export const formatCurrency = (amount: number, _locale = 'en-US') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export const formatPercentage = (value: number) => `${value.toFixed(1)}%`
