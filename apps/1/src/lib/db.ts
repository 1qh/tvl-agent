/* eslint-disable max-statements */

import type { Chat, DBMessage } from '@a/db/schema'
import type { SQL } from 'drizzle-orm'
import type { AppUsage } from 'types'

import { db } from '@a/db/client'
import { chat, message, stream, vote } from '@a/db/schema'
import { and, asc, count, desc, eq, gt, gte, inArray, lt } from 'drizzle-orm'

import ChatSDKError from './errors'

export const createStreamId = async ({ chatId, streamId }: { chatId: string; streamId: string }) => {
    try {
      await db.insert(stream).values({ chatId, id: streamId })
    } catch {
      throw new ChatSDKError('bad_request:database', 'Failed to create stream id')
    }
  },
  deleteAllChatsByUserId = async ({ userId }: { userId: string }) => {
    try {
      const userChats = await db.select({ id: chat.id }).from(chat).where(eq(chat.userId, userId))
      if (userChats.length === 0) return { deletedCount: 0 }
      const chatIds = userChats.map(c => c.id)
      await db.delete(vote).where(inArray(vote.chatId, chatIds))
      await db.delete(message).where(inArray(message.chatId, chatIds))
      await db.delete(stream).where(inArray(stream.chatId, chatIds))
      const deletedChats = await db.delete(chat).where(eq(chat.userId, userId)).returning()
      return { deletedCount: deletedChats.length }
    } catch {
      throw new ChatSDKError('bad_request:database', 'Failed to delete all chats by user id')
    }
  },
  deleteChatById = async ({ id }: { id: string }) => {
    try {
      await db.delete(vote).where(eq(vote.chatId, id))
      await db.delete(message).where(eq(message.chatId, id))
      await db.delete(stream).where(eq(stream.chatId, id))
      const [chatsDeleted] = await db.delete(chat).where(eq(chat.id, id)).returning()
      return chatsDeleted
    } catch {
      throw new ChatSDKError('bad_request:database', 'Failed to delete chat by id')
    }
  },
  getChatById = async ({ id }: { id: string }) => {
    try {
      const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id))
      if (!selectedChat) return null
      return selectedChat
    } catch {
      throw new ChatSDKError('bad_request:database', 'Failed to get chat by id')
    }
  },
  getChatsByUserId = async ({
    endingBefore,
    id,
    limit,
    startingAfter
  }: {
    endingBefore: null | string
    id: string
    limit: number
    startingAfter: null | string
  }) => {
    try {
      const extendedLimit = limit + 1,
        baseCondition = eq(chat.userId, id),
        query = (whereCondition?: SQL) =>
          db
            .select()
            .from(chat)
            .where(whereCondition ? and(whereCondition, baseCondition) : baseCondition)
            .orderBy(desc(chat.createdAt))
            .limit(extendedLimit)
      let filteredChats: Chat[] = []
      if (startingAfter) {
        const [selectedChat] = await db.select().from(chat).where(eq(chat.id, startingAfter)).limit(1)
        if (!selectedChat) throw new ChatSDKError('not_found:database', `Chat with id ${startingAfter} not found`)
        filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt))
      } else if (endingBefore) {
        const [selectedChat] = await db.select().from(chat).where(eq(chat.id, endingBefore)).limit(1)
        if (!selectedChat) throw new ChatSDKError('not_found:database', `Chat with id ${endingBefore} not found`)
        filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt))
      } else filteredChats = await query()
      const hasMore = filteredChats.length > limit
      return {
        chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
        hasMore
      }
    } catch {
      throw new ChatSDKError('bad_request:database', 'Failed to get chats by user id')
    }
  },
  getMessageCountByUserId = async ({ differenceInHours, id }: { differenceInHours: number; id: string }) => {
    try {
      const hoursAgo = new Date(Date.now() - differenceInHours * 60 * 60 * 1000),
        [stats] = await db
          .select({ count: count(message.id) })
          .from(message)
          .innerJoin(chat, eq(message.chatId, chat.id))
          .where(and(eq(chat.userId, id), gte(message.createdAt, hoursAgo), eq(message.role, 'user')))
          .execute()
      return stats?.count ?? 0
    } catch {
      throw new ChatSDKError('bad_request:database', 'Failed to get message count by user id')
    }
  },
  getMessagesByChatId = async ({ id }: { id: string }) => {
    try {
      return await db.select().from(message).where(eq(message.chatId, id)).orderBy(asc(message.createdAt))
    } catch {
      throw new ChatSDKError('bad_request:database', 'Failed to get messages by chat id')
    }
  },
  getStreamIdsByChatId = async ({ chatId }: { chatId: string }) => {
    try {
      const streamIds = await db
        .select({ id: stream.id })
        .from(stream)
        .where(eq(stream.chatId, chatId))
        .orderBy(asc(stream.createdAt))
        .execute()
      return streamIds.map(({ id }) => id)
    } catch {
      throw new ChatSDKError('bad_request:database', 'Failed to get stream ids by chat id')
    }
  },
  getVotesByChatId = async ({ id }: { id: string }) => {
    try {
      return await db.select().from(vote).where(eq(vote.chatId, id))
    } catch {
      throw new ChatSDKError('bad_request:database', 'Failed to get votes by chat id')
    }
  },
  saveChat = async ({ id, title, userId, visibility }: Pick<Chat, 'id' | 'title' | 'userId' | 'visibility'>) => {
    try {
      return await db.insert(chat).values({ id, title, userId, visibility })
    } catch {
      throw new ChatSDKError('bad_request:database', 'Failed to save chat')
    }
  },
  saveMessages = async (messages: (Omit<DBMessage, 'createdAt'> & { createdAt?: DBMessage['createdAt'] })[]) => {
    try {
      return await db.insert(message).values(messages)
    } catch {
      throw new ChatSDKError('bad_request:database', 'Failed to save messages')
    }
  },
  updateChatLastContextById = async ({ chatId, context }: { chatId: string; context: AppUsage }) => {
    try {
      return await db.update(chat).set({ lastContext: context }).where(eq(chat.id, chatId))
    } catch (error) {
      console.warn('Failed to update lastContext for chat', chatId, error)
    }
  },
  updateMessage = async ({ id, parts }: { id: string; parts: DBMessage['parts'] }) => {
    try {
      return await db.update(message).set({ parts }).where(eq(message.id, id))
    } catch {
      throw new ChatSDKError('bad_request:database', 'Failed to update message')
    }
  },
  updateChatVisibilityById = async ({ chatId, visibility }: { chatId: string; visibility: 'private' | 'public' }) => {
    try {
      return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId))
    } catch {
      throw new ChatSDKError('bad_request:database', 'Failed to update chat visibility by id')
    }
  },
  updateChatTitleById = async ({ chatId, title }: { chatId: string; title: string }) => {
    try {
      return await db.update(chat).set({ title }).where(eq(chat.id, chatId))
    } catch {
      throw new ChatSDKError('bad_request:database', 'Failed to update chat title by id')
    }
  },
  updateChatFeedbackById = async ({
    chatId,
    text,
    type
  }: {
    chatId: string
    text?: null | string
    type?: 'bug' | 'quality'
  }) => {
    try {
      const [selectedChat] = await db.select().from(chat).where(eq(chat.id, chatId))
      if (!selectedChat) throw new ChatSDKError('not_found:database', `Chat with id ${chatId} not found`)
      return await db
        .update(chat)
        .set({ feedbackCreatedAt: text ? new Date() : null, feedbackText: text ?? null, feedbackType: type ?? null })
        .where(eq(chat.id, chatId))
    } catch {
      throw new ChatSDKError('bad_request:database', 'Failed to update chat feedback by id')
    }
  },
  toggleChatBookmarkById = async ({ chatId }: { chatId: string }) => {
    try {
      const [selectedChat] = await db.select().from(chat).where(eq(chat.id, chatId))
      if (!selectedChat) throw new ChatSDKError('not_found:database', `Chat with id ${chatId} not found`)
      return await db.update(chat).set({ isBookmarked: !selectedChat.isBookmarked }).where(eq(chat.id, chatId))
    } catch {
      throw new ChatSDKError('bad_request:database', 'Failed to toggle chat bookmark by id')
    }
  },
  voteMessage = async ({ chatId, messageId, type }: { chatId: string; messageId: string; type: 'down' | 'up' }) => {
    try {
      const [existingVote] = await db.select().from(vote).where(eq(vote.messageId, messageId))
      if (existingVote)
        return await db
          .update(vote)
          .set({ isUpvoted: type === 'up' })
          .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)))
      return await db.insert(vote).values({ chatId, isUpvoted: type === 'up', messageId })
    } catch {
      throw new ChatSDKError('bad_request:database', 'Failed to vote message')
    }
  }
