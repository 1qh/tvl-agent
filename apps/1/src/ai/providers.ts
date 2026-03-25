import type { LanguageModelV3 } from '@ai-sdk/provider'

import { google } from '@ai-sdk/google'
import { openai } from '@ai-sdk/openai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { customProvider } from 'ai'

import env from '~/env'

import type { ModelId } from './models'

const custom = createOpenAICompatible({
  baseURL: env.LLM_BASE_URL,
  includeUsage: true,
  name: '',
  supportsStructuredOutputs: true
})

export default customProvider({
  languageModels: {
    gem3f: google('gemini-3-flash-preview'),
    gpt5mini: openai('gpt-5-mini'),
    qwen3vl4b: custom('qwen3-vl:4b-instruct')
  } satisfies Record<ModelId, LanguageModelV3>
})
