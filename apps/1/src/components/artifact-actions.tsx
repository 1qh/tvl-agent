/** biome-ignore-all lint/suspicious/noExplicitAny: x */

import { Button } from '@a/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@a/ui/tooltip'
import { Bookmark, Copy } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { memo, useState } from 'react'
import { toast } from 'sonner'

import textArtifact from '~/lib/artifact'

import type { ArtifactActionContext } from '../lib/artifact'
import type { UIArtifact } from './artifact'

interface ArtifactActionsProps {
  artifact: UIArtifact
  chatId: string
  handleToggleBookmark: (chatId: string) => void
  isBookmarked: boolean
}

const PureArtifactActions = ({ artifact, chatId, handleToggleBookmark, isBookmarked }: ArtifactActionsProps) => {
  const [pendingAction, setPendingAction] = useState<null | string>(null),
    t = useTranslations(),
    actionContext: ArtifactActionContext = {
      chatId,
      content: artifact.content,
      handleToggleBookmark,
      isBookmarked
    },
    renderAction = (action: (typeof textArtifact.actions)[number]) => {
      const isPending = pendingAction === action.description,
        icon =
          action.description === 'bookmark' ? (
            <Bookmark className={isBookmarked ? 'fill-current' : ''} />
          ) : action.description === 'copy' ? (
            <Copy />
          ) : null,
        tooltipLabel = action.description === 'bookmark' && isBookmarked ? t('unbookmark') : t(action.description),
        isDisabled =
          isPending ||
          (artifact.status === 'streaming' && !['bookmark', 'copy'].includes(action.description)) ||
          (action.isDisabled ? action.isDisabled(actionContext) : false)

      return (
        <Tooltip key={action.description}>
          <TooltipTrigger asChild>
            <Button
              disabled={isDisabled}
              onClick={async () => {
                setPendingAction(action.description)
                try {
                  await Promise.resolve(action.onClick(actionContext))
                  if (action.description === 'copy') toast.success(t('copiedToClipboard'))
                } catch {
                  toast.error(t('Failed to execute action'))
                } finally {
                  setPendingAction(null)
                }
              }}
              size='icon'
              variant='ghost'>
              {icon}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{tooltipLabel}</TooltipContent>
        </Tooltip>
      )
    }

  return textArtifact.actions.map(renderAction)
}

export default memo(PureArtifactActions, (prevProps, nextProps) => {
  if (prevProps.artifact.status !== nextProps.artifact.status) return false
  if (prevProps.artifact.content !== nextProps.artifact.content) return false
  if (prevProps.isBookmarked !== nextProps.isBookmarked) return false
  if (prevProps.chatId !== nextProps.chatId) return false
  return true
})
