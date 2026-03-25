'use client'

import type { User } from '@a/db/schema'

import { cn } from '@a/ui'
import { buttonVariants } from '@a/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@a/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@a/ui/tooltip'
import { PanelLeft, SquarePen } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Roboto_Serif } from 'next/font/google'
import Image from 'next/image'

import { SidebarHistory } from '~/components/sidebar-history'
import SidebarUserNav from '~/components/sidebar-user-nav'
import { useNavigateToHome } from '~/hooks/use-navigation'

// eslint-disable-next-line new-cap
const robotoSerifText = Roboto_Serif({ display: 'swap', subsets: ['latin'], weight: '400' })

interface AppSidebarProps {
  user?: User
}

const AppSidebar = ({ user }: AppSidebarProps) => {
  const { open, toggleSidebar } = useSidebar(),
    handleNewChat = useNavigateToHome(),
    t = useTranslations()

  if (!user) return null

  return (
    <Sidebar className='border-none' collapsible='icon'>
      <SidebarHeader className='flex-row items-center'>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className={cn(buttonVariants({ variant: 'ghost' }), 'group/logo size-8 p-2')}
              onClick={open ? handleNewChat : toggleSidebar}
              type='button'>
              <div className='relative size-6 shrink-0 group-hover/logo:hidden'>
                <Image alt='' className='rounded-full object-contain' height={24} src='/logo.jpg' unoptimized width={24} />
              </div>
              <SquarePen className='hidden size-5 shrink-0 group-hover/logo:block group-data-[collapsible=icon]:hidden' />
              <PanelLeft className='hidden size-5 shrink-0 group-data-[collapsible=icon]:group-hover/logo:block' />
            </button>
          </TooltipTrigger>
          <TooltipContent side='right'>{open ? t('newChat') : t('expandSidebar')}</TooltipContent>
        </Tooltip>
        <span
          className={`${robotoSerifText.className} ml-0 flex-1 truncate text-xl font-semibold tracking-tight group-data-[collapsible=icon]:hidden`}>
          {t('sidebarTitle')}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className={cn(buttonVariants({ variant: 'ghost' }), 'size-8 p-0 group-data-[collapsible=icon]:hidden')}
              onClick={toggleSidebar}
              type='button'>
              <PanelLeft className='size-5' />
            </button>
          </TooltipTrigger>
          <TooltipContent side='right'>{t('collapseSidebar')}</TooltipContent>
        </Tooltip>
      </SidebarHeader>

      <SidebarContent className='gap-0 p-1 group-data-[collapsible=icon]:p-2'>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleNewChat} tooltip={t('newChat')}>
              <SquarePen />
              <span>{t('newChat')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarHistory />
      </SidebarContent>

      <SidebarUserNav user={user} />
    </Sidebar>
  )
}

export default AppSidebar
