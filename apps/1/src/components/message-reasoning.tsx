'use client'

import { Reasoning, ReasoningContent, ReasoningTrigger } from '@a/ui/ai-elements/reasoning'
import { Shimmer } from '@a/ui/ai-elements/shimmer'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

const GetThinkingMessage = (isStreaming: boolean, duration?: number) => {
  const t = useTranslations()
  return isStreaming || duration === 0 ? (
    <Shimmer duration={1}>{t('thinking')}</Shimmer>
  ) : (
    <p>
      {t('thoughtFor')} {duration ? `${duration}s` : t('aFewSeconds')}
    </p>
  )
}

interface MessageReasoningProps {
  isLoading: boolean
  reasoning: string
}

const MessageReasoning = ({ isLoading, reasoning }: MessageReasoningProps) => {
  const [hasBeenStreaming, setHasBeenStreaming] = useState(isLoading)
  useEffect(() => {
    if (isLoading) setHasBeenStreaming(true)
  }, [isLoading])
  return (
    <Reasoning defaultOpen={hasBeenStreaming} isStreaming={isLoading}>
      <ReasoningTrigger getThinkingMessage={GetThinkingMessage} />
      <ReasoningContent>{reasoning}</ReasoningContent>
    </Reasoning>
  )
}

export default MessageReasoning
