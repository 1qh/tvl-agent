'use client'

import { Button } from '@a/ui/button'
import { useSidebar } from '@a/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@a/ui/tooltip'
import { Bookmark, TriangleAlert } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { memo, useEffect, useState } from 'react'

import type { VisibilityType } from './visibility-selector'

import FeedbackDialog from './feedback-dialog'
import VisibilitySelector from './visibility-selector'

interface ChatHeaderProps {
  chatId: string
  handleToggleBookmark?: (chatId: string) => void
  hasFeedback?: boolean
  hasMessages: boolean
  isAnonymous: boolean
  isBookmarked: boolean
  isReadonly: boolean
  selectedVisibilityType: VisibilityType
}

const PureChatHeader = ({
  chatId,
  handleToggleBookmark,
  hasFeedback,
  hasMessages,
  isAnonymous,
  isBookmarked,
  isReadonly,
  selectedVisibilityType
}: ChatHeaderProps) => {
  const { isMobile, setOpenMobile, toggleSidebar } = useSidebar(),
    [feedbackOpen, setFeedbackOpen] = useState(false),
    t = useTranslations()
  useEffect(() => {
    setOpenMobile(false)
  }, [chatId, setOpenMobile])
  return (
    <header className='absolute inset-x-0 top-1 z-1 flex items-center justify-between pr-1'>
      {!isAnonymous && isMobile ? (
        <Button onClick={toggleSidebar} size='icon' title={t('openMenu')} variant='ghost'>
          <Image alt='' className='size-5 rounded-full' height={20} src='/logo.jpg' unoptimized width={20} />
        </Button>
      ) : null}
      <div className={hasMessages ? 'ml-auto flex items-center' : 'invisible ml-auto flex items-center'}>
        {!(isReadonly || isAnonymous) && (
          <VisibilitySelector chatId={chatId} selectedVisibilityType={selectedVisibilityType} />
        )}
        {!isAnonymous && (
          <>
            {Boolean(handleToggleBookmark) && !isReadonly ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={() => handleToggleBookmark?.(chatId)} size='icon' variant='ghost'>
                    <Bookmark className={isBookmarked ? 'fill-current' : ''} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isBookmarked ? t('removeBookmark') : t('bookmarkDescription')}</TooltipContent>
              </Tooltip>
            ) : null}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button disabled={Boolean(hasFeedback)} onClick={() => setFeedbackOpen(true)} size='icon' variant='ghost'>
                  <TriangleAlert />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('reportDescription')}</TooltipContent>
            </Tooltip>
            <FeedbackDialog chatId={chatId} onOpenChange={setFeedbackOpen} open={feedbackOpen} />
          </>
        )}
      </div>
    </header>
  )
}

export default memo(
  PureChatHeader,
  (prevProps, nextProps) =>
    prevProps.chatId === nextProps.chatId &&
    prevProps.hasMessages === nextProps.hasMessages &&
    prevProps.isAnonymous === nextProps.isAnonymous &&
    prevProps.isBookmarked === nextProps.isBookmarked &&
    prevProps.isReadonly === nextProps.isReadonly &&
    prevProps.selectedVisibilityType === nextProps.selectedVisibilityType
)
