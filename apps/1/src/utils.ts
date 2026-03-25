import type { DBMessage } from '@a/db/schema'
import type { UIMessagePart } from 'ai'

import { formatISO } from 'date-fns'

import type { ChatMessage } from '~/types'

import ChatSDKError from '~/lib/errors'

interface CauseCode {
  cause: string
  code: `${ChatSDKError['type']}:${ChatSDKError['surface']}`
}

export const fetcher = async (url: string) => {
    const response = await fetch(url)
    if (!response.ok) {
      const { cause, code } = (await response.json()) as CauseCode
      throw new ChatSDKError(code, cause)
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return response.json()
  },
  convertToUIMessages = (messages: DBMessage[]): ChatMessage[] =>
    messages.map(m => ({
      id: m.id,
      metadata: { createdAt: formatISO(m.createdAt) },
      parts: m.parts as UIMessagePart<Record<string, unknown>, Record<string, { input: unknown; output: undefined }>>[],
      role: m.role as 'assistant' | 'system' | 'user'
    })),
  fetchWithErrorHandlers = async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const response = await fetch(input, init)
      if (!response.ok) {
        const { cause, code } = (await response.json()) as CauseCode
        throw new ChatSDKError(code, cause)
      }
      return response
    } catch (error: unknown) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) throw new ChatSDKError('offline:chat')
      throw error
    }
  },
  randomId = (): string => crypto.randomUUID(),
  sanitizeText = (text: string) => text.replace('<has_function_call>', ''),
  getUserInitials = (name?: null | string): string => {
    if (!name) return 'ME'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  },
  isCurrentChat = (chatId: string | string[], pathname: string): boolean =>
    chatId === pathname.split('/').at(-1) || pathname.endsWith(String(chatId))
