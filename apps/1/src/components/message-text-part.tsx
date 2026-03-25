/* eslint-disable react-hooks/refs */
'use client'

import { cn } from '@a/ui'
import { Message, MessageResponse } from '@a/ui/ai-elements/message'
import { Shimmer } from '@a/ui/ai-elements/shimmer'
import { Fragment, memo, useMemo, useRef } from 'react'

import { useArtifact } from '~/hooks/use-artifact'
import { parseResponse } from '~/lib/response-parser'
import { sanitizeText } from '~/utils'

import ArtifactBadge from './artifact-badge'
import ArtifactPreview from './artifact-preview'
import MessageReasoning from './message-reasoning'

interface MessageTextPartProps {
  isLoading: boolean
  messageId: string
  messageRole: 'assistant' | 'system' | 'user'
  text: string
}

const PureMessageTextPart = ({ isLoading, messageId, messageRole, text }: MessageTextPartProps) => {
  const { artifact, setArtifact } = useArtifact(),
    reportIdRef = useRef<null | string>(null),
    hasAutoOpenedRef = useRef(false),
    parsed = useMemo(() => {
      const existingReportId = reportIdRef.current,
        result = parseResponse(text, existingReportId ?? undefined)
      if (result.report && !reportIdRef.current) reportIdRef.current = result.report.id
      if (
        result.report &&
        isLoading &&
        result.hasPartialReport &&
        result.report.content.length > 400 &&
        result.report.content.length < 450 &&
        !hasAutoOpenedRef.current
      ) {
        hasAutoOpenedRef.current = true
        setArtifact(a => ({
          ...a,
          content: result.report?.content ?? '',
          isVisible: true,
          status: 'streaming',
          title: result.report?.title ?? ''
        }))
      } else if (result.report && isLoading && artifact.isVisible)
        setArtifact(a => ({
          ...a,
          content: result.report?.content ?? a.content,
          status: 'streaming'
        }))
      return result
    }, [text, artifact.isVisible, isLoading, setArtifact]),
    key = `message-${messageId}-part`

  return parsed.blocks.length ? (
    parsed.blocks.map((block, i) => {
      const k = `${key}-block-${i}`
      if (block.type === 'thinking') return <MessageReasoning isLoading={isLoading} key={k} reasoning={block.content} />
      if (block.type === 'report')
        return parsed.report ? (
          <Fragment key={k}>
            {artifact.isVisible ? (
              <ArtifactBadge isStreaming={isLoading ? parsed.hasPartialReport : false} report={parsed.report} />
            ) : null}
            <ArtifactPreview isStreaming={isLoading ? parsed.hasPartialReport : false} report={parsed.report} />
          </Fragment>
        ) : null
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (block.type === 'text' && block.content.trim().length > 0)
        return (
          <Message className={cn(messageRole === 'user' && 'mb-2')} from={messageRole} key={k}>
            {messageRole === 'user' ? (
              <MessageResponse className='ml-auto w-fit max-w-lg rounded-3xl border bg-muted px-4 py-2.5 text-balance'>
                {sanitizeText(block.content)}
              </MessageResponse>
            ) : (
              <MessageResponse className='w-full'>{sanitizeText(block.content)}</MessageResponse>
            )}
          </Message>
        )
      return null
    })
  ) : (
    <Shimmer>Thinking...</Shimmer>
  )
}

export default memo(
  PureMessageTextPart,
  (prev, next) => prev.isLoading === next.isLoading && prev.text === next.text && prev.messageId === next.messageId
)
