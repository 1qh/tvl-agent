'use server'

import { cookies } from 'next/headers'

import type { Locale } from './config'

import { defaultLocale } from './config'

const N = 'NEXT_LOCALE',
  get = async () => (await cookies()).get(N)?.value ?? defaultLocale,
  set = async (locale: Locale) => {
    ;(await cookies()).set(N, locale)
    return 'ok'
  }

export { get, set }
