import type { Vote } from '@a/db/schema'
import type { UseChatHelpers } from '@ai-sdk/react'
import type { Dispatch, SetStateAction } from 'react'

import { cn } from '@a/ui'
import { MessageResponse } from '@a/ui/ai-elements/message'
import { useSidebar } from '@a/ui/sidebar'
import equal from 'fast-deep-equal'
import { motion } from 'motion/react'
import { memo, useEffect, useRef } from 'react'
import { useWindowSize } from 'usehooks-ts'

import type { Attachment, ChatMessage } from '~/types'

import { initialArtifactData, useArtifact } from '~/hooks/use-artifact'

import type { VisibilityType } from './visibility-selector'

import ArtifactActions from './artifact-actions'
import ArtifactCloseButton from './artifact-close-button'
import ArtifactMessages from './artifact-messages'
import MultimodalInput from './multimodal-input'

interface UIArtifact {
  boundingBox: {
    height: number
    left: number
    top: number
    width: number
  }
  content: string
  isVisible: boolean
  status: 'idle' | 'streaming'
  title: string
}

const ARTIFACT_ANIMATION_DELAY_MS = 400,
  PureArtifact = ({
    attachments,
    chatId,
    handleToggleBookmark,
    input,
    isBookmarked,
    isReadonly,
    messages,
    selectedModelId,
    selectedVisibilityType,
    sendMessage,
    setAttachments,
    setInput,
    setMessages,
    status,
    stop,
    votes
  }: {
    attachments: Attachment[]
    chatId: string
    handleToggleBookmark: (chatId: string) => void
    input: string
    isBookmarked: boolean
    isReadonly: boolean
    messages: ChatMessage[]
    selectedModelId: string
    selectedVisibilityType: VisibilityType
    sendMessage: UseChatHelpers<ChatMessage>['sendMessage']
    setAttachments: Dispatch<SetStateAction<Attachment[]>>
    setInput: Dispatch<SetStateAction<string>>
    setMessages: UseChatHelpers<ChatMessage>['setMessages']
    status: UseChatHelpers<ChatMessage>['status']
    stop: UseChatHelpers<ChatMessage>['stop']
    votes?: Vote[]
  }) => {
    const { artifact, setArtifact } = useArtifact(),
      { open: isSidebarOpen, setOpen: setSidebarOpen } = useSidebar(),
      hasAutoClosedSidebar = useRef(false),
      previousSidebarOpenState = useRef<boolean | null>(null),
      { height: windowHeight, width: windowWidth } = useWindowSize(),
      isMobile = windowWidth ? windowWidth < 768 : false

    useEffect(() => {
      setArtifact(initialArtifactData)
      hasAutoClosedSidebar.current = false
      previousSidebarOpenState.current = null
    }, [chatId, setArtifact])

    useEffect(() => {
      if (isMobile) return

      if (artifact.isVisible) {
        if (!hasAutoClosedSidebar.current) {
          previousSidebarOpenState.current = isSidebarOpen
          if (isSidebarOpen) {
            setSidebarOpen(false)
            hasAutoClosedSidebar.current = true
          }
        }
        return
      }

      const reopenTimeout = window.setTimeout(() => {
        if (hasAutoClosedSidebar.current && previousSidebarOpenState.current) setSidebarOpen(true)
        hasAutoClosedSidebar.current = false
        previousSidebarOpenState.current = null
      }, ARTIFACT_ANIMATION_DELAY_MS)

      return () => window.clearTimeout(reopenTimeout)
    }, [artifact.isVisible, isMobile, isSidebarOpen, setSidebarOpen])

    return artifact.isVisible ? (
      <motion.div
        animate={{ opacity: 1 }}
        className={cn(
          'fixed top-0 left-0 flex h-dvh w-dvw bg-background md:left-12 md:w-[calc(100dvw-3rem)]',
          isSidebarOpen ? 'z-5' : 'z-20'
        )}
        exit={{ opacity: 0, transition: { delay: 0.4 } }}
        initial={{ opacity: 1 }}>
        {!isMobile && (
          <motion.div
            animate={{ right: 0, width: windowWidth ? windowWidth - 48 : 'calc(100dvw-3rem)' }}
            className='fixed h-dvh'
            exit={{ right: 0, width: isSidebarOpen ? windowWidth - 256 : windowWidth }}
            initial={{ right: 0, width: isSidebarOpen ? windowWidth - 256 : windowWidth }}
          />
        )}
        <motion.div
          animate={
            isMobile
              ? {
                  borderRadius: 0,
                  height: windowHeight,
                  opacity: 1,
                  transition: {
                    damping: 30,
                    delay: 0,
                    duration: 0.8,
                    stiffness: 300,
                    type: 'spring'
                  },
                  width: windowWidth || 'calc(100dvw)',
                  x: 0,
                  y: 0
                }
              : {
                  borderRadius: 0,
                  height: windowHeight,
                  opacity: 1,
                  transition: {
                    damping: 30,
                    delay: 0,
                    duration: 0.8,
                    stiffness: 300,
                    type: 'spring'
                  },
                  width: windowWidth ? windowWidth - 400 - 48 : 'calc(100dvw-400px-3rem)',
                  x: 0,
                  y: 0
                }
          }
          className='fixed flex h-dvh flex-col overflow-y-scroll'
          exit={{ opacity: 0, scale: 0.5, transition: { damping: 30, delay: 0.1, stiffness: 600, type: 'spring' } }}
          initial={{
            borderRadius: 50,
            height: artifact.boundingBox.height,
            opacity: 1,
            width: artifact.boundingBox.width,
            x: artifact.boundingBox.left,
            y: artifact.boundingBox.top
          }}>
          <div className='sticky top-0 flex items-center justify-end p-1 backdrop-blur-lg'>
            <p className='ml-2 grow font-medium'>{artifact.title}</p>
            <ArtifactActions
              artifact={artifact}
              chatId={chatId}
              handleToggleBookmark={handleToggleBookmark}
              isBookmarked={isBookmarked}
            />
            <ArtifactCloseButton />
          </div>
          <div className='mx-auto max-w-5xl px-8 py-4'>
            <MessageResponse>{artifact.content}</MessageResponse>
          </div>
        </motion.div>
        {!isMobile && (
          <motion.div
            animate={{
              opacity: 1,
              scale: 1,
              transition: { damping: 30, delay: 0.1, stiffness: 300, type: 'spring' },
              x: windowWidth ? windowWidth - 400 - 48 : 0
            }}
            className='relative h-dvh w-100 shrink-0 bg-sidebar'
            exit={{ opacity: 0, scale: 1, transition: { duration: 0 }, x: windowWidth ? windowWidth - 400 - 48 : 0 }}
            initial={{ opacity: 0, scale: 1, x: windowWidth ? windowWidth - 400 - 48 + 10 : 10 }}>
            <div className='flex h-full flex-col items-center justify-between'>
              <ArtifactMessages
                chatId={chatId}
                isReadonly={isReadonly}
                messages={messages}
                status={status}
                votes={votes}
              />
              <div className='w-full p-1.5 pt-0'>
                <MultimodalInput
                  attachments={attachments}
                  autoFocus={false}
                  chatId={chatId}
                  input={input}
                  messages={messages}
                  selectedModelId={selectedModelId}
                  selectedVisibilityType={selectedVisibilityType}
                  sendMessage={sendMessage}
                  setAttachments={setAttachments}
                  setInput={setInput}
                  setMessages={setMessages}
                  status={status}
                  stop={stop}
                />
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    ) : null
  }

export default memo(PureArtifact, (prevProps, nextProps) => {
  if (prevProps.status !== nextProps.status) return false
  if (!equal(prevProps.votes, nextProps.votes)) return false
  if (prevProps.input !== nextProps.input) return false
  if (!equal(prevProps.messages, nextProps.messages.length)) return false
  if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) return false
  return true
})
export type { UIArtifact }
