'use client'

import type { Chat } from '@a/db/schema'

import { useSidebar } from '@a/ui/sidebar'
import { Spinner } from '@a/ui/spinner'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import useSWRInfinite from 'swr/infinite'

import useChatActions from '~/hooks/use-chat-actions'
import { fetcher } from '~/utils'

import { DeleteChat } from './chat-actions'
import ChatItem from './sidebar-history-item'

const PAGE_SIZE = 20,
  MAX_SIDEBAR_CHATS = 20,
  SectionHeader = ({ label }: { label: string }) => (
    <div className='px-2 py-1 pt-4'>
      <p className='text-sm font-medium text-muted-foreground'>{label}</p>
    </div>
  )

interface ChatHistory {
  chats: Chat[]
  hasMore: boolean
}

export const getChatHistoryPaginationKey = (pageIndex: number, previousPageData: ChatHistory) => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (previousPageData && !previousPageData.hasMore) return null
    if (pageIndex === 0) return `/api/history?limit=${PAGE_SIZE}`
    const firstChatFromPage = previousPageData.chats.at(-1)
    if (!firstChatFromPage) return null
    return `/api/history?ending_before=${firstChatFromPage.id}&limit=${PAGE_SIZE}`
  },
  SidebarHistory = () => {
    const { isMobile, setOpenMobile, state } = useSidebar(),
      { id } = useParams(),
      t = useTranslations(),
      {
        data: paginatedChatHistories,
        isLoading,
        mutate
      } = useSWRInfinite<ChatHistory>(getChatHistoryPaginationKey, fetcher, {
        fallbackData: []
      }),
      [deleteId, setDeleteId] = useState<null | string>(null),
      [showDeleteDialog, setShowDeleteDialog] = useState(false),
      { handleClone, handleDelete: handleDeleteAction, handleEdit, handleToggleBookmark } = useChatActions({ mutate }),
      allChats = paginatedChatHistories?.flatMap(p => p.chats) ?? [],
      limitedChats = allChats.slice(0, MAX_SIDEBAR_CHATS),
      bookmarkedChats = limitedChats.filter(c => c.isBookmarked),
      recentChats = limitedChats.filter(c => !c.isBookmarked),
      hasEmptyChatHistory = allChats.length === 0,
      handleDeleteClick = (chatId: string) => {
        setDeleteId(chatId)
        setShowDeleteDialog(true)
      },
      handleDelete = () => {
        if (deleteId) {
          handleDeleteAction(deleteId, true)
          setShowDeleteDialog(false)
        }
      }
    if (isLoading) return <Spinner className='m-auto' />
    if (state !== 'collapsed' && hasEmptyChatHistory)
      return <p className='m-auto text-center text-sm text-muted-foreground'>{t('noChatsYet')}</p>

    if (state === 'collapsed' && !isMobile) return null

    return (
      <>
        {bookmarkedChats.length > 0 ? (
          <>
            <SectionHeader label={t('bookmarks')} />
            {bookmarkedChats.map(chat => (
              <ChatItem
                chat={chat}
                isActive={chat.id === id}
                key={chat.id}
                onClone={handleClone}
                onDelete={handleDeleteClick}
                onEdit={handleEdit}
                onToggleBookmark={handleToggleBookmark}
                setOpenMobile={setOpenMobile}
              />
            ))}
          </>
        ) : null}
        {recentChats.length > 0 ? (
          <>
            <SectionHeader label={t('recents')} />
            {recentChats.map(chat => (
              <ChatItem
                chat={chat}
                isActive={chat.id === id}
                key={chat.id}
                onClone={handleClone}
                onDelete={handleDeleteClick}
                onEdit={handleEdit}
                onToggleBookmark={handleToggleBookmark}
                setOpenMobile={setOpenMobile}
              />
            ))}
          </>
        ) : null}
        <DeleteChat onConfirm={handleDelete} onOpenChange={setShowDeleteDialog} open={showDeleteDialog} />
      </>
    )
  }

export type { ChatHistory }
