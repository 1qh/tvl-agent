'use client'

import { useMemo } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { unstable_serialize } from 'swr/infinite'

import type { ChatHistory } from '~/components/sidebar-history'
import type { VisibilityType } from '~/components/visibility-selector'

import { updateChatVisibility } from '~/actions'
import { getChatHistoryPaginationKey } from '~/components/sidebar-history'

const useChatVisibility = ({
  chatId,
  initialVisibilityType
}: {
  chatId: string
  initialVisibilityType: VisibilityType
}) => {
  const { cache, mutate } = useSWRConfig(),
    history = cache.get('/api/history')?.data as ChatHistory | undefined,
    { data: localVisibility, mutate: setLocalVisibility } = useSWR(`${chatId}-visibility`, null, {
      fallbackData: initialVisibilityType
    }) as { data: VisibilityType; mutate: (value: VisibilityType) => void },
    visibilityType = useMemo(() => {
      if (!history) return localVisibility
      const chat = history.chats.find(c => c.id === chatId)
      if (!chat) return 'private'
      return chat.visibility
    }, [history, chatId, localVisibility]),
    setVisibilityType = (v: VisibilityType) => {
      setLocalVisibility(v)
      mutate(unstable_serialize(getChatHistoryPaginationKey))
      updateChatVisibility({ chatId, visibility: v })
    }
  return { setVisibilityType, visibilityType }
}

export default useChatVisibility
