import type { UIMessage } from 'ai'
import type { AppUsage } from 'types'

interface Attachment {
  contentType: string
  name: string
  url: string
}
type ChatMessage = UIMessage<{ createdAt: string }>
interface CustomUIDataTypes {
  appendMessage: string
  'chat-title': string
  clear: null
  finish: null
  id: string
  textDelta: string
  title: string
  usage: AppUsage
}

export type { Attachment, ChatMessage, CustomUIDataTypes }
