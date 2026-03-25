'use client'

import type { Vote } from '@a/db/schema'
import type { AppUsage } from 'types'

import { cn } from '@a/ui'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useTranslations } from 'next-intl'
import { Source_Serif_4 } from 'next/font/google'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import useSWRInfinite, { unstable_serialize } from 'swr/infinite'

import type { Attachment, ChatMessage } from '~/types'

import ChatHeader from '~/components/chat-header'
import useAutoResume from '~/hooks/use-auto-resume'
import useChatActions from '~/hooks/use-chat-actions'
import useChatVisibility from '~/hooks/use-chat-visibility'
import ChatSDKError from '~/lib/errors'
import { fetcher, fetchWithErrorHandlers, randomId } from '~/utils'

import type { ChatHistory } from './sidebar-history'
import type { VisibilityType } from './visibility-selector'

import Artifact from './artifact'
import { useDataStream } from './data-stream-provider'
import Messages from './messages'
import MultimodalInput from './multimodal-input'
import { getChatHistoryPaginationKey } from './sidebar-history'
import { toast } from './toast'

// eslint-disable-next-line new-cap
const font = Source_Serif_4({ subsets: ['vietnamese'] })

interface ChatProps {
  autoResume: boolean
  id: string
  initialChatModel: string
  initialLastContext?: AppUsage
  initialMessages: ChatMessage[]
  initialVisibilityType: VisibilityType
  isAnonymous: boolean
  isReadonly: boolean
}

const Chat = ({
  autoResume,
  id,
  initialChatModel,
  initialLastContext,
  initialMessages,
  initialVisibilityType,
  isAnonymous,
  isReadonly
}: ChatProps) => {
  const t = useTranslations(),
    router = useRouter(),
    { visibilityType } = useChatVisibility({ chatId: id, initialVisibilityType }),
    { mutate } = useSWRConfig()

  useEffect(() => {
    const handlePopState = () => {
      router.refresh()
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [router])

  const { setDataStream } = useDataStream(),
    [input, setInput] = useState<string>(''),
    [usage, setUsage] = useState<AppUsage | undefined>(initialLastContext),
    [currentModelId, setCurrentModelId] = useState(initialChatModel),
    currentModelIdRef = useRef(currentModelId),
    { data: paginatedChatHistories, mutate: mutateChatHistory } = useSWRInfinite<ChatHistory>(
      getChatHistoryPaginationKey,
      fetcher,
      { fallbackData: [] }
    ),
    allChats = paginatedChatHistories?.flatMap(p => p.chats) ?? [],
    currentChat = allChats.find(c => c.id === id),
    isBookmarked = currentChat?.isBookmarked ?? false,
    hasFeedback = Boolean(currentChat?.feedbackText),
    { handleToggleBookmark } = useChatActions({ mutate: mutateChatHistory })

  useEffect(() => {
    currentModelIdRef.current = currentModelId
  }, [currentModelId])

  const { messages, resumeStream, sendMessage, setMessages, status, stop } = useChat<ChatMessage>({
      experimental_throttle: 100,
      generateId: randomId,
      id,
      messages: initialMessages,
      onData: dataPart => {
        // @ts-expect-error - x
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        setDataStream(ds => (ds ? [...ds, dataPart] : []))
        if (dataPart.type === 'data-usage') setUsage(dataPart.data as AppUsage)
      },
      onError: e => {
        if (
          e instanceof ChatSDKError &&
          isAnonymous &&
          e.message.toLowerCase().includes('exceeded your maximum number of messages')
        ) {
          toast({
            description: 'You have reached the limit for anonymous users. Please create an account to continue chatting.',
            type: 'error'
          })
          globalThis.history.replaceState({}, '', '/login')
          router.refresh()
        }
      },
      onFinish: () => {
        mutate(unstable_serialize(getChatHistoryPaginationKey))
      },
      // eslint-disable-next-line react-hooks/refs
      transport: new DefaultChatTransport({
        api: '/api/chat',
        fetch: fetchWithErrorHandlers as typeof fetch,
        prepareSendMessagesRequest: req => ({
          body: {
            id: req.id,
            message: req.messages.at(-1),
            selectedChatModel: currentModelIdRef.current,
            selectedVisibilityType: visibilityType,
            ...req.body
          }
        })
      })
    }),
    searchParams = useSearchParams(),
    query = searchParams.get('query'),
    [hasAppendedQuery, setHasAppendedQuery] = useState(false)

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      sendMessage({
        parts: [{ text: query, type: 'text' }],
        role: 'user' as const
      })
      setHasAppendedQuery(true)
      globalThis.history.replaceState({}, '', `/chat/${id}`)
    }
  }, [query, sendMessage, hasAppendedQuery, id])

  const { data: votes } = useSWR<Vote[]>(messages.length >= 2 ? `/api/vote?chatId=${id}` : null, fetcher),
    [attachments, setAttachments] = useState<Attachment[]>([])

  useAutoResume({ autoResume, initialMessages, resumeStream, setMessages })
  return (
    <>
      {messages.length ? (
        <>
          <ChatHeader
            chatId={id}
            handleToggleBookmark={handleToggleBookmark}
            hasFeedback={hasFeedback}
            hasMessages={messages.length > 0}
            isAnonymous={isAnonymous}
            isBookmarked={isBookmarked}
            isReadonly={isReadonly}
            selectedVisibilityType={visibilityType}
          />
          <Messages chatId={id} isReadonly={isReadonly} messages={messages} status={status} votes={votes} />
        </>
      ) : null}
      <div className={cn('m-auto w-full max-w-4xl', messages.length ? 'sticky bottom-0' : 'gap-2 px-2 pb-0.5')}>
        {messages.length ? null : (
          <p className={cn('mb-6 text-center text-5xl font-light tracking-tighter', font.className)}>{t('heroWelcome')}</p>
        )}
        {!isReadonly && (
          <MultimodalInput
            attachments={attachments}
            chatId={id}
            input={input}
            isAnonymous={isAnonymous}
            messages={messages}
            onModelChange={setCurrentModelId}
            selectedModelId={currentModelId}
            selectedVisibilityType={visibilityType}
            sendMessage={sendMessage}
            setAttachments={setAttachments}
            setInput={setInput}
            setMessages={setMessages}
            status={status}
            stop={stop}
            usage={usage}
          />
        )}
        {messages.length ? (
          <p className='bg-background text-center text-xs font-light tracking-tight text-muted-foreground'>
            {t('aiDisclaimer')}
          </p>
        ) : null}
      </div>
      <Artifact
        attachments={attachments}
        chatId={id}
        handleToggleBookmark={handleToggleBookmark}
        input={input}
        isBookmarked={isBookmarked}
        isReadonly={isReadonly}
        messages={messages}
        selectedModelId={currentModelId}
        selectedVisibilityType={visibilityType}
        sendMessage={sendMessage}
        setAttachments={setAttachments}
        setInput={setInput}
        setMessages={setMessages}
        status={status}
        stop={stop}
        votes={votes}
      />
    </>
  )
}

export default Chat
