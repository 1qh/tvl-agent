/* eslint-disable no-await-in-loop */
/** biome-ignore-all lint/nursery/noContinue: x */
/** biome-ignore-all lint/performance/noAwaitInLoops: x */
import { tavily } from '@tavily/core'

import { markKeyExhausted, selectBestKey } from './tavily-key-manager'

// eslint-disable-next-line max-statements
const executeWithKeyRotation = async <T>(
  operation: (client: ReturnType<typeof tavily>) => Promise<T>,
  retries = 3
): Promise<T> => {
  let lastUsedKey: null | string = null

  for (let attempt = 0; attempt < retries; attempt += 1)
    try {
      const apiKey = await selectBestKey()
      lastUsedKey = apiKey
      const client = tavily({ apiKey })
      return await operation(client)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error),
        isRateLimit =
          errorMessage.includes('429') || errorMessage.includes('rate limit') || errorMessage.includes('exceeded')

      if (isRateLimit && attempt < retries - 1) {
        if (lastUsedKey) markKeyExhausted(lastUsedKey)
        lastUsedKey = null
        // eslint-disable-next-line no-continue
        continue
      }

      throw error
    }

  throw new Error('Failed to execute Tavily operation after retries')
}

export const search = async (query: string, options?: Parameters<ReturnType<typeof tavily>['search']>[1]) =>
  executeWithKeyRotation(async client => client.search(query, options))

export const extract = async (urls: string[], options?: Parameters<ReturnType<typeof tavily>['extract']>[1]) =>
  executeWithKeyRotation(async client => client.extract(urls, options))
