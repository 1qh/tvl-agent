import '@a/ui/globals.css'
import type { AbstractIntlMessages } from 'next-intl'
import type { ReactNode } from 'react'

import { Toaster } from '@a/ui/sonner'
import { ThemeProvider } from 'next-themes'

import { get as getLocale } from '~/i18n/locale'
import IntlErrorHandling from '~/i18n/provider'

const Layout = async ({ children }: Readonly<{ children: ReactNode }>) => {
  const locale = await getLocale(),
    messages = (await import(`../../messages/${locale}.json`)) as { default: AbstractIntlMessages }
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className='tracking-[-0.02em] antialiased'>
        <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
          <Toaster />
          <IntlErrorHandling locale={locale} messages={messages.default}>
            {children}
          </IntlErrorHandling>
        </ThemeProvider>
      </body>
    </html>
  )
}

export const viewport = {
  maximumScale: 1
}
export default Layout
