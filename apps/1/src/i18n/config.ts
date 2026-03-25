const flag = {
    en: 'gb',
    vi: 'vn'
  } as const,
  locales = Object.keys(flag),
  defaultLocale: Locale = 'vi'

type Locale = keyof typeof flag

export { defaultLocale, flag, locales }
export type { Locale }
