interface ChatModel {
  description: string
  id: ModelId
  name: string
}

type ModelId = (typeof MODELS)[number]

export const MODELS = ['gem3f', 'gpt5mini', 'qwen3vl4b'] as const,
  DEFAULT_CHAT_MODEL: ModelId = 'gem3f',
  chatModels: ChatModel[] = [
    {
      description: 'Intelligence in a Flash from Google',
      id: 'gem3f',
      name: 'Gemini 3 Flash'
    },
    {
      description: 'Fast & affordable model from OpenAI',
      id: 'gpt5mini',
      name: 'GPT-5 Mini'
    },
    {
      description: 'Latest model from Qwen by Alibaba',
      id: 'qwen3vl4b',
      name: 'Qwen3-4B'
    }
  ]

export type { ChatModel, ModelId }
