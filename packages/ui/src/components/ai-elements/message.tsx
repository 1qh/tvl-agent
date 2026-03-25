/* eslint-disable @typescript-eslint/no-unsafe-argument */
'use client'

import type { FileUIPart, UIMessage } from 'ai'
import type { ComponentProps, HTMLAttributes, ReactElement } from 'react'

import { cn } from '@a/ui'
import { Button } from '@a/ui/button'
import { ButtonGroup, ButtonGroupText } from '@a/ui/button-group'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@a/ui/tooltip'
import { ChevronLeftIcon, ChevronRightIcon, PaperclipIcon, XIcon } from 'lucide-react'
import Image from 'next/image'
import { createContext, memo, use, useEffect, useState } from 'react'
import { Streamdown } from 'streamdown'

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage['role']
}

export const Message = ({ className, from, ...props }: MessageProps) => (
  <div
    className={cn(
      'group flex w-full max-w-[95%] flex-col gap-2',
      from === 'user' ? 'is-user ml-auto justify-end' : 'is-assistant',
      className
    )}
    {...props}
  />
)

export type MessageContentProps = HTMLAttributes<HTMLDivElement>

export const MessageContent = ({ children, className, ...props }: MessageContentProps) => (
  <div
    className={cn(
      'is-user:dark flex w-fit max-w-full min-w-0 flex-col gap-2 overflow-hidden text-sm',
      'group-[.is-user]:ml-auto group-[.is-user]:rounded-lg group-[.is-user]:bg-secondary group-[.is-user]:px-4 group-[.is-user]:py-3 group-[.is-user]:text-foreground',
      'group-[.is-assistant]:text-foreground',
      className
    )}
    {...props}>
    {children}
  </div>
)

export type MessageActionsProps = ComponentProps<'div'>

export const MessageActions = ({ children, className, ...props }: MessageActionsProps) => (
  <div className={cn('flex items-center gap-1', className)} {...props}>
    {children}
  </div>
)

export type MessageActionProps = ComponentProps<typeof Button> & {
  label?: string
  tooltip?: string
}

export const MessageAction = ({
  children,
  label,
  size = 'icon-sm',
  tooltip,
  variant = 'ghost',
  ...props
}: MessageActionProps) => {
  const button = (
    <Button size={size} type='button' variant={variant} {...props}>
      {children}
      <span className='sr-only'>{label ?? tooltip}</span>
    </Button>
  )

  if (tooltip)
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )

  return button
}

interface MessageBranchContextType {
  branches: ReactElement[]
  currentBranch: number
  goToNext: () => void
  goToPrevious: () => void
  setBranches: (branches: ReactElement[]) => void
  totalBranches: number
}

const MessageBranchContext = createContext<MessageBranchContextType | null>(null),
  useMessageBranch = () => {
    const context = use(MessageBranchContext)

    if (!context) throw new Error('MessageBranch components must be used within MessageBranch')

    return context
  }

export type MessageBranchProps = HTMLAttributes<HTMLDivElement> & {
  defaultBranch?: number
  onBranchChange?: (branchIndex: number) => void
}

export const MessageBranch = ({ className, defaultBranch = 0, onBranchChange, ...props }: MessageBranchProps) => {
  const [currentBranch, setCurrentBranch] = useState(defaultBranch),
    [branches, setBranches] = useState<ReactElement[]>([]),
    handleBranchChange = (newBranch: number) => {
      setCurrentBranch(newBranch)
      onBranchChange?.(newBranch)
    },
    goToPrevious = () => {
      const newBranch = currentBranch > 0 ? currentBranch - 1 : branches.length - 1
      handleBranchChange(newBranch)
    },
    goToNext = () => {
      const newBranch = currentBranch < branches.length - 1 ? currentBranch + 1 : 0
      handleBranchChange(newBranch)
    },
    contextValue: MessageBranchContextType = {
      branches,
      currentBranch,
      goToNext,
      goToPrevious,
      setBranches,
      totalBranches: branches.length
    }

  return (
    <MessageBranchContext value={contextValue}>
      <div className={cn('grid w-full gap-2 [&>div]:pb-0', className)} {...props} />
    </MessageBranchContext>
  )
}

export type MessageBranchContentProps = HTMLAttributes<HTMLDivElement>

export const MessageBranchContent = ({ children, ...props }: MessageBranchContentProps) => {
  const { branches, currentBranch, setBranches } = useMessageBranch(),
    childrenArray = Array.isArray(children) ? children : [children]

  // Use useEffect to update branches when they change
  useEffect(() => {
    if (branches.length !== childrenArray.length) setBranches(childrenArray)
  }, [childrenArray, branches, setBranches])

  return childrenArray.map((branch, index) => (
    <div
      className={cn('grid gap-2 overflow-hidden [&>div]:pb-0', index === currentBranch ? 'block' : 'hidden')}
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      key={branch.key}
      {...props}>
      {branch}
    </div>
  ))
}

export type MessageBranchSelectorProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage['role']
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const MessageBranchSelector = ({ className, from, ...props }: MessageBranchSelectorProps) => {
  const { totalBranches } = useMessageBranch()

  // Don't render if there's only one branch
  if (totalBranches <= 1) return null

  return (
    <ButtonGroup
      className='[&>*:not(:first-child)]:rounded-l-md [&>*:not(:last-child)]:rounded-r-md'
      orientation='horizontal'
      {...props}
    />
  )
}

export type MessageBranchPreviousProps = ComponentProps<typeof Button>

export const MessageBranchPrevious = ({ children, ...props }: MessageBranchPreviousProps) => {
  const { goToPrevious, totalBranches } = useMessageBranch()

  return (
    <Button
      aria-label='Previous branch'
      disabled={totalBranches <= 1}
      onClick={goToPrevious}
      size='icon-sm'
      type='button'
      variant='ghost'
      {...props}>
      {children ?? <ChevronLeftIcon size={14} />}
    </Button>
  )
}

export type MessageBranchNextProps = ComponentProps<typeof Button>

export const MessageBranchNext = ({ children, ...props }: MessageBranchNextProps) => {
  const { goToNext, totalBranches } = useMessageBranch()

  return (
    <Button
      aria-label='Next branch'
      disabled={totalBranches <= 1}
      onClick={goToNext}
      size='icon-sm'
      type='button'
      variant='ghost'
      {...props}>
      {children ?? <ChevronRightIcon size={14} />}
    </Button>
  )
}

export type MessageBranchPageProps = HTMLAttributes<HTMLSpanElement>

export const MessageBranchPage = ({ className, ...props }: MessageBranchPageProps) => {
  const { currentBranch, totalBranches } = useMessageBranch()

  return (
    <ButtonGroupText className={cn('border-none bg-transparent text-muted-foreground shadow-none', className)} {...props}>
      {currentBranch + 1} of {totalBranches}
    </ButtonGroupText>
  )
}

export type MessageResponseProps = ComponentProps<typeof Streamdown>

export const MessageResponse = memo(
  ({ className, ...props }: MessageResponseProps) => (
    <Streamdown className={cn('size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0', className)} {...props} />
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children
)

MessageResponse.displayName = 'MessageResponse'

export type MessageAttachmentProps = HTMLAttributes<HTMLDivElement> & {
  className?: string
  data: FileUIPart
  onRemove?: () => void
}

export type MessageAttachmentsProps = ComponentProps<'div'>

export type MessageToolbarProps = ComponentProps<'div'>

export const MessageAttachment = ({ className, data, onRemove, ...props }: MessageAttachmentProps) => {
  const filename = data.filename ?? '',
    mediaType = data.mediaType.startsWith('image/') && data.url ? 'image' : 'file',
    isImage = mediaType === 'image',
    attachmentLabel = filename || (isImage ? 'Image' : 'Attachment')

  return (
    <div className={cn('group relative size-24 overflow-hidden rounded-lg', className)} {...props}>
      {isImage ? (
        <>
          <Image
            alt={filename || 'attachment'}
            className='size-full object-cover'
            height={100}
            src={data.url}
            width={100}
          />
          {onRemove ? (
            <Button
              aria-label='Remove attachment'
              className='absolute top-2 right-2 size-6 rounded-full bg-background/80 p-0 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-background [&>svg]:size-3'
              onClick={e => {
                e.stopPropagation()
                onRemove()
              }}
              type='button'
              variant='ghost'>
              <XIcon />
              <span className='sr-only'>Remove</span>
            </Button>
          ) : null}
        </>
      ) : (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className='flex size-full shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground'>
                <PaperclipIcon className='size-4' />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{attachmentLabel}</p>
            </TooltipContent>
          </Tooltip>
          {onRemove ? (
            <Button
              aria-label='Remove attachment'
              className='size-6 shrink-0 rounded-full p-0 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-accent [&>svg]:size-3'
              onClick={e => {
                e.stopPropagation()
                onRemove()
              }}
              type='button'
              variant='ghost'>
              <XIcon />
              <span className='sr-only'>Remove</span>
            </Button>
          ) : null}
        </>
      )}
    </div>
  )
}

export const MessageAttachments = ({ children, className, ...props }: MessageAttachmentsProps) => {
  if (!children) return null

  return (
    <div className={cn('ml-auto flex w-fit flex-wrap items-start gap-2', className)} {...props}>
      {children}
    </div>
  )
}

export const MessageToolbar = ({ children, className, ...props }: MessageToolbarProps) => (
  <div className={cn('mt-4 flex w-full items-center justify-between gap-4', className)} {...props}>
    {children}
  </div>
)
