/** biome-ignore-all lint/nursery/noFloatingPromises: x */
import type { SWRInfiniteKeyedMutator } from 'swr/infinite'

import { useTranslations } from 'next-intl'
import { useCallback } from 'react'
import { toast } from 'sonner'

import type { ChatHistory } from '~/components/sidebar-history'

import { cloneChat, toggleChatBookmark, updateChatTitle } from '~/actions'
import { isCurrentChat } from '~/utils'

import { useNavigateToHome } from './use-navigation'

interface UseChatActionsProps {
  mutate: SWRInfiniteKeyedMutator<ChatHistory[]>
}

const useChatActions = ({ mutate }: UseChatActionsProps) => {
  const navigateToHome = useNavigateToHome(),
    t = useTranslations(),
    handleEdit = useCallback(
      (chatId: string, title: string) => {
        const editPromise = updateChatTitle({ chatId, title })
        toast.promise(editPromise, {
          error: t('failedUpdateTitle'),
          loading: t('updatingTitle'),
          success: () => {
            mutate(histories => {
              if (histories)
                return histories.map(h => ({ ...h, chats: h.chats.map(c => (c.id === chatId ? { ...c, title } : c)) }))
            })
            return t('titleUpdated')
          }
        })
      },
      [mutate, t]
    ),
    handleToggleBookmark = useCallback(
      (chatId: string) => {
        const bookmarkPromise = toggleChatBookmark({ chatId })
        toast.promise(bookmarkPromise, {
          error: t('failedToggleBookmark'),
          loading: t('updatingBookmark'),
          success: () => {
            mutate(histories => {
              if (histories)
                return histories.map(h => ({
                  ...h,
                  chats: h.chats.map(c => (c.id === chatId ? { ...c, isBookmarked: !c.isBookmarked } : c))
                }))
            })
            return t('bookmarkUpdated')
          }
        })
      },
      [mutate, t]
    ),
    handleClone = useCallback(
      (chatId: string) => {
        const clonePromise = cloneChat({ chatId })
        toast.promise(clonePromise, {
          error: t('failedCopyChat'),
          loading: t('copyingChat'),
          success: newChat => {
            mutate(histories => {
              if (!histories || histories.length === 0) return [{ chats: [newChat], hasMore: false }]
              const [first] = histories
              if (!first) return histories
              return [{ ...first, chats: [newChat, ...first.chats] }, ...histories.slice(1)]
            })
            return t('chatCopied')
          }
        })
      },
      [mutate, t]
    ),
    handleDelete = useCallback(
      (chatId: string, shouldNavigate: boolean) => {
        const deletePromise = fetch(`/api/chat?id=${chatId}`, { method: 'DELETE' })
        toast.promise(deletePromise, {
          error: t('failedDeleteChat'),
          loading: t('deletingChat'),
          success: () => {
            mutate(histories => {
              if (histories) return histories.map(h => ({ ...h, chats: h.chats.filter(c => c.id !== chatId) }))
            })
            return t('chatDeleted')
          }
        })

        if (shouldNavigate && isCurrentChat(chatId, globalThis.location.pathname)) navigateToHome()
      },
      [mutate, navigateToHome, t]
    )

  return {
    handleClone,
    handleDelete,
    handleDeleteAll: () => {
      //
    },
    handleEdit,
    handleToggleBookmark
  }
}
export default useChatActions
