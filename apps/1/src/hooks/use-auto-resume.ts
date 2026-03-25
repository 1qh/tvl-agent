'use client'

import type { UseChatHelpers } from '@ai-sdk/react'

import { useEffect } from 'react'

import type { ChatMessage } from '~/types'

import { useDataStream } from '~/components/data-stream-provider'

interface UseAutoResumeParams {
  autoResume: boolean
  initialMessages: ChatMessage[]
  resumeStream: UseChatHelpers<ChatMessage>['resumeStream']
  setMessages: UseChatHelpers<ChatMessage>['setMessages']
}

const useAutoResume = ({ autoResume, initialMessages, resumeStream, setMessages }: UseAutoResumeParams) => {
  const { dataStream } = useDataStream()
  useEffect(() => {
    if (!autoResume) return
    const mostRecentMessage = initialMessages.at(-1)
    if (mostRecentMessage?.role === 'user') resumeStream()
  }, [autoResume, initialMessages.at, resumeStream])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!dataStream) return
    if (dataStream.length === 0) return
    const [dataPart] = dataStream
    if (dataPart?.type === 'data-appendMessage') {
      const message = JSON.parse(dataPart.data) as ChatMessage
      setMessages([...initialMessages, message])
    }
  }, [dataStream, initialMessages, setMessages])
}

export default useAutoResume
