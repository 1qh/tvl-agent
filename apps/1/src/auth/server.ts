import { initAuth } from '@a/auth'
import { headers } from 'next/headers'
import { cache } from 'react'

export const auth = initAuth(),
  getSession = cache(async () => {
    const { response } = await auth.api.getSession({
      headers: await headers(),
      returnHeaders: true
    })
    return response
  })
