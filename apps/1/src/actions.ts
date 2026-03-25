'use server'

import type { UIMessage } from 'ai'

import { google } from '@ai-sdk/google'
import { generateText } from 'ai'
import { cookies } from 'next/headers'

import type { VisibilityType } from '~/components/visibility-selector'

import { getSession } from '~/auth/server'
import {
  getChatById,
  getMessagesByChatId,
  saveChat,
  saveMessages,
  toggleChatBookmarkById,
  updateChatTitleById,
  updateChatVisibilityById
} from '~/lib/db'
import ChatSDKError from '~/lib/errors'
import { randomId } from '~/utils'

export const generateTitleFromUserMessage = async (message: UIMessage) => {
    const { text } = await generateText({
      model: google('gemini-2.5-flash-lite'),
      prompt: JSON.stringify(message),
      system: 'Generate a short title (< 5 words) based on the first message'
    })
    return text.trim()
  },
  saveChatModelAsCookie = async (model: string) => {
    const cookieStore = await cookies()
    cookieStore.set('chat-model', model)
  },
  updateChatVisibility = async ({ chatId, visibility }: { chatId: string; visibility: VisibilityType }) => {
    await updateChatVisibilityById({ chatId, visibility })
  },
  updateChatTitle = async ({ chatId, title }: { chatId: string; title: string }) => {
    await updateChatTitleById({ chatId, title })
  },
  toggleChatBookmark = async ({ chatId }: { chatId: string }) => {
    await toggleChatBookmarkById({ chatId })
  },
  // eslint-disable-next-line max-statements
  cloneChat = async ({ chatId }: { chatId: string }) => {
    const session = await getSession()
    if (!session?.user) throw new ChatSDKError('unauthorized:chat')
    const existingChat = await getChatById({ id: chatId })
    if (!existingChat) throw new ChatSDKError('not_found:chat')
    if (existingChat.userId !== session.user.id) throw new ChatSDKError('forbidden:chat')
    const messages = await getMessagesByChatId({ id: chatId }),
      newChatId = randomId(),
      newTitle = `Copy of ${existingChat.title}`
    await saveChat({ id: newChatId, title: newTitle, userId: existingChat.userId, visibility: existingChat.visibility })
    if (messages.length)
      await saveMessages(
        messages.map(message => ({
          chatId: newChatId,
          createdAt: message.createdAt,
          id: randomId(),
          parts: message.parts,
          role: message.role
        }))
      )

    const newChat = await getChatById({ id: newChatId })
    if (!newChat) throw new ChatSDKError('not_found:chat')
    return newChat
  }
