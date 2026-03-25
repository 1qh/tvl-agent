/* eslint-disable @typescript-eslint/prefer-destructuring */
/** biome-ignore-all lint/nursery/useDestructuring: x */

import env from '~/env'

interface UsageCache {
  isExhausted: boolean
  lastChecked: Date
  limit: number
  usage: number
}

const CACHE_TTL_MS = 5 * 60 * 1000,
  EXHAUSTION_THRESHOLD = env.TAVILY_EXHAUSTION_THRESHOLD,
  usageCache = new Map<string, UsageCache>(),
  // eslint-disable-next-line max-statements, complexity
  getUsageFromTavily = async (apiKey: string): Promise<{ limit: number; usage: number }> => {
    const response = await fetch('https://api.tavily.com/usage', {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    })
    let data: unknown
    try {
      data = await response.json()
    } catch (error) {
      throw new Error(`Failed to parse API response: ${error instanceof Error ? error.message : String(error)}`, {
        cause: error
      })
    }
    if (response.status === 401) {
      const errorMsg =
        typeof data === 'object' &&
        data !== null &&
        'detail' in data &&
        typeof data.detail === 'object' &&
        data.detail !== null &&
        'error' in data.detail
          ? String(data.detail.error)
          : 'Unauthorized: missing or invalid API key'
      throw new Error(`Invalid API key: ${errorMsg}`)
    }
    if (!response.ok) throw new Error(`Failed to fetch key usage: ${response.status} ${response.statusText}`)
    if (typeof data !== 'object' || data === null) throw new Error('Invalid response format from Tavily API')

    const responseData = data as Record<string, unknown>
    let usage: null | number = null,
      limit: null | number = null

    if ('key' in responseData && typeof responseData.key === 'object' && responseData.key !== null) {
      const keyData = responseData.key as Record<string, unknown>
      if (typeof keyData.usage === 'number') usage = keyData.usage
      if (typeof keyData.limit === 'number') limit = keyData.limit
    }
    if (
      limit === null &&
      'account' in responseData &&
      typeof responseData.account === 'object' &&
      responseData.account !== null
    ) {
      const accountData = responseData.account as Record<string, unknown>
      if (typeof accountData.plan_limit === 'number') limit = accountData.plan_limit
      if (usage === null && typeof accountData.plan_usage === 'number') usage = accountData.plan_usage
    }
    if (usage === null || limit === null) throw new Error(`Invalid usage data: usage=${usage}, limit=${limit}`)
    return { limit, usage }
  },
  getCachedUsage = (apiKey: string): null | UsageCache => {
    const cached = usageCache.get(apiKey)
    if (!cached) return null
    const age = Date.now() - cached.lastChecked.getTime()
    if (age > CACHE_TTL_MS) return null
    return cached
  },
  updateCache = (apiKey: string, usage: number, limit: number): void => {
    usageCache.set(apiKey, {
      isExhausted: usage >= EXHAUSTION_THRESHOLD,
      lastChecked: new Date(),
      limit,
      usage
    })
  }

export const markKeyExhausted = (apiKey: string): void => {
    const cached = usageCache.get(apiKey)
    if (cached) usageCache.set(apiKey, { ...cached, isExhausted: true })
  },
  selectBestKey = async (): Promise<string> => {
    const allKeys = env.TAVILY_API_KEYS
    if (!allKeys.length) throw new Error('No Tavily API keys found. Please set TAVILY_API_KEYS environment variable.')
    const keyStatuses = await Promise.all(
        allKeys.map(async apiKey => {
          let cached = getCachedUsage(apiKey)
          if (!cached)
            try {
              const { limit, usage } = await getUsageFromTavily(apiKey)
              updateCache(apiKey, usage, limit)
              cached = { isExhausted: usage >= EXHAUSTION_THRESHOLD, lastChecked: new Date(), limit, usage }
            } catch {
              markKeyExhausted(apiKey)
              return { apiKey, isAvailable: false, remaining: -1 }
            }
          const remaining = cached.limit - cached.usage,
            isAvailable = !cached.isExhausted && remaining > 4
          return { apiKey, isAvailable, remaining }
        })
      ),
      availableKeys = keyStatuses.filter(ks => ks.isAvailable).toSorted((a, b) => b.remaining - a.remaining)

    if (availableKeys.length === 0)
      throw new Error(
        'All Tavily API keys have exceeded usage limits (996+ credits used). Please add more keys or wait for monthly reset.'
      )
    return availableKeys[0]?.apiKey ?? ''
  },
  refreshAllUsage = async (): Promise<{
    exhausted: number
    refreshed: number
    total: number
  }> => {
    const allKeys = env.TAVILY_API_KEYS
    let refreshed = 0,
      exhausted = 0
    await Promise.all(
      allKeys.map(async apiKey => {
        try {
          const { limit, usage } = await getUsageFromTavily(apiKey)
          updateCache(apiKey, usage, limit)
          refreshed += 1
          if (usage >= EXHAUSTION_THRESHOLD) exhausted += 1
        } catch {
          markKeyExhausted(apiKey)
          exhausted += 1
        }
      })
    )
    return {
      exhausted,
      refreshed,
      total: allKeys.length
    }
  }
