'use client'
import { Button } from '@a/ui/button'
import {
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from '@a/ui/dropdown-menu'
import Flag from '@svgr-iconkit/flag-icons'
import iso from 'iso-639-1'
import { Languages } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import type { Locale } from './config'

import { flag, locales } from './config'
import { set } from './locale'

export const LangSwitchDrop = () => {
    const t = useTranslations()
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Languages />
          {t('language')}
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent>
            {locales.map(l => (
              <DropdownMenuItem key={l} onSelect={async () => set(l as Locale)}>
                <Flag className='size-4 shrink-0 rounded-full' name={flag[l as Locale]} variant='square' />
                {iso.getNativeName(l)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
    )
  },
  LangSwitch = () => {
    const locale = useLocale(),
      handleClick = async () => {
        await set(locale === 'en' ? 'vi' : 'en')
        globalThis.location.reload()
      }
    return (
      <Button onClick={handleClick} size='icon' type='button' variant='ghost'>
        <Flag className='size-5 shrink-0 rounded-full' name={flag[locale as Locale]} variant='square' />
      </Button>
    )
  }
