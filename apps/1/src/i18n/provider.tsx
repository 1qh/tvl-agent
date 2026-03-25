'use client'

import type { AbstractIntlMessages } from 'next-intl'
import type { ReactNode } from 'react'

import { IntlErrorCode, NextIntlClientProvider } from 'next-intl'

const IntlErrorHandling = ({
  children,
  locale,
  messages
}: {
  children: ReactNode
  locale: string
  messages: AbstractIntlMessages
}) => (
  <NextIntlClientProvider
    locale={locale}
    messages={messages}
    onError={e => {
      if (e.code === IntlErrorCode.MISSING_MESSAGE) {
        //
      }
    }}>
    {children}
  </NextIntlClientProvider>
)

export default IntlErrorHandling
