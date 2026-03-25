import type { AbstractIntlMessages } from 'next-intl'

import { IntlErrorCode } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'

import { get } from './locale'

export default getRequestConfig(async () => {
  const locale = await get()
  return {
    locale,
    messages: ((await import(`../../messages/${locale}.json`)) as { default: AbstractIntlMessages }).default,
    onError: error => {
      if (error.code === IntlErrorCode.MISSING_MESSAGE) {
        //
      }
    }
  }
})
