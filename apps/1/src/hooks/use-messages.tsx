import type { UseChatHelpers } from '@ai-sdk/react'

import { useEffect, useState } from 'react'

import type { ChatMessage } from '~/types'

import useScrollToBottom from './use-scroll-to-bottom'

const useMessages = ({ status }: { status: UseChatHelpers<ChatMessage>['status'] }) => {
  const { containerRef, endRef, isAtBottom, onViewportEnter, onViewportLeave, scrollToBottom } = useScrollToBottom(),
    [hasSentMessage, setHasSentMessage] = useState(false)
  useEffect(() => {
    if (status === 'submitted') setHasSentMessage(true)
  }, [status])
  return { containerRef, endRef, hasSentMessage, isAtBottom, onViewportEnter, onViewportLeave, scrollToBottom }
}

export default useMessages
