import type { LanguageModelUsage } from 'ai'
import type { UsageData } from 'tokenlens/helpers'

type AppUsage = LanguageModelUsage & UsageData & { modelId?: string }

export type { AppUsage }
