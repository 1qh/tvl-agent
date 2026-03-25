/** biome-ignore-all lint/nursery/noFloatingPromises: x */

import type { Vote } from '@a/db/schema'

import { MessageAction, MessageActions } from '@a/ui/ai-elements/message'
import equal from 'fast-deep-equal'
import { Copy, ThumbsDown, ThumbsUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { memo } from 'react'
import { toast } from 'sonner'
import { useSWRConfig } from 'swr'
import { useCopyToClipboard } from 'usehooks-ts'

import type { ChatMessage } from '~/types'

const PureActions = ({
  chatId,
  isLoading,
  message,
  vote
}: {
  chatId: string
  isLoading: boolean
  message: ChatMessage
  vote?: Vote
}) => {
  const { mutate } = useSWRConfig(),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    [_, copyToClipboard] = useCopyToClipboard(),
    t = useTranslations(),
    textFromParts = message.parts
      .filter(p => p.type === 'text')
      .map(p => p.text)
      .join('\n')
      .trim(),
    handleCopy = async () => {
      if (!textFromParts) {
        toast.error("There's no text to copy!")
        return
      }
      await copyToClipboard(textFromParts)
      toast.success('Copied to clipboard!')
    }
  if (isLoading) return null
  return (
    <MessageActions className='-ml-1 gap-0 -space-x-1'>
      <MessageAction onClick={handleCopy} tooltip={t('copy')}>
        <Copy />
      </MessageAction>
      <MessageAction
        disabled={vote?.isUpvoted}
        onClick={() => {
          const upvote = fetch('/api/vote', {
            body: JSON.stringify({ chatId, messageId: message.id, type: 'up' }),
            method: 'PATCH'
          })
          toast.promise(upvote, {
            error: 'Failed to upvote response.',
            loading: 'Upvoting Response...',
            success: () => {
              mutate<Vote[]>(
                `/api/vote?chatId=${chatId}`,
                currentVotes => {
                  if (!currentVotes) return []
                  const votesWithoutCurrent = currentVotes.filter(currentVote => currentVote.messageId !== message.id)
                  return [...votesWithoutCurrent, { chatId, isUpvoted: true, messageId: message.id }]
                },
                { revalidate: false }
              )
              return 'Upvoted Response!'
            }
          })
        }}
        tooltip={t('upvoteResponse')}>
        <ThumbsUp />
      </MessageAction>
      <MessageAction
        disabled={vote ? !vote.isUpvoted : false}
        onClick={() => {
          const downvote = fetch('/api/vote', {
            body: JSON.stringify({ chatId, messageId: message.id, type: 'down' }),
            method: 'PATCH'
          })
          toast.promise(downvote, {
            error: 'Failed to downvote response.',
            loading: 'Downvoting Response...',
            success: () => {
              mutate<Vote[]>(
                `/api/vote?chatId=${chatId}`,
                currentVotes => {
                  if (!currentVotes) return []
                  const votesWithoutCurrent = currentVotes.filter(v => v.messageId !== message.id)
                  return [...votesWithoutCurrent, { chatId, isUpvoted: false, messageId: message.id }]
                },
                { revalidate: false }
              )
              return 'Downvoted Response!'
            }
          })
        }}
        tooltip={t('downvoteResponse')}>
        <ThumbsDown />
      </MessageAction>
    </MessageActions>
  )
}

export default memo(PureActions, (prevProps, nextProps) => {
  if (!equal(prevProps.vote, nextProps.vote)) return false
  if (prevProps.isLoading !== nextProps.isLoading) return false
  return true
})
