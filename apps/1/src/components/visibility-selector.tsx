'use client'

import { Button } from '@a/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@a/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@a/ui/tooltip'
import { VISIBILITIES } from 'constant'
import { Check, Globe, Lock } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

import useChatVisibility from '~/hooks/use-chat-visibility'

type VisibilityType = (typeof VISIBILITIES)[number]

const VisibilitySelector = ({
  chatId,
  selectedVisibilityType
}: {
  chatId: string
  selectedVisibilityType: VisibilityType
}) => {
  const [open, setOpen] = useState(false),
    { setVisibilityType, visibilityType } = useChatVisibility({
      chatId,
      initialVisibilityType: selectedVisibilityType
    }),
    t = useTranslations(),
    current = useMemo(() => VISIBILITIES.find(v => v === visibilityType), [visibilityType])

  return (
    <DropdownMenu onOpenChange={setOpen} open={open}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button size='icon' variant='ghost'>
              {current === 'private' ? <Lock /> : <Globe />}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>
          {visibilityType === 'private' ? t('visibilityPrivateDescription') : t('visibilityPublicDescription')}
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent>
        {VISIBILITIES.map(v => (
          <DropdownMenuItem
            className='group'
            data-active={v === visibilityType}
            key={v}
            onSelect={() => {
              setVisibilityType(v)
              setOpen(false)
            }}>
            <Check className='opacity-0 group-data-[active=true]:opacity-100' />
            <div>
              <p className='capitalize'>{t(v === 'private' ? 'Private' : 'Public')}</p>
              <p className='text-xs text-muted-foreground'>
                {v === 'private' ? t('visibilityPrivateHelp') : t('visibilityPublicHelp')}
              </p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default VisibilitySelector
export type { VisibilityType }
