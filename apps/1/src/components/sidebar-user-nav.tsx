'use client'

import type { User } from '@a/db/schema'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@a/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@a/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@a/ui/dropdown-menu'
import { Check, LogOut, Moon, Settings, Sun } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import authClient from '~/auth/client'
import { useNavigateToHome } from '~/hooks/use-navigation'
import { LangSwitchDrop } from '~/i18n/switch'
import { getUserInitials } from '~/utils'

interface SidebarUserNavProps {
  user: User
}

const SidebarUserNav = ({ user }: SidebarUserNavProps) => {
  const router = useRouter(),
    { resolvedTheme, setTheme } = useTheme(),
    [showLogoutDialog, setShowLogoutDialog] = useState(false),
    [isLoggingOut, setIsLoggingOut] = useState(false),
    navigateToHome = useNavigateToHome(),
    t = useTranslations(),
    displayName = user.isAnonymous ? 'Guest' : user.name || user.email,
    handleLogout = async () => {
      setIsLoggingOut(true)
      await authClient.signOut()
      setShowLogoutDialog(false)
      navigateToHome()
    }
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className='flex items-center p-1.5 hover:bg-muted'>
          <Avatar className='size-8.5 max-w-8.5 shrink-0'>
            <AvatarImage alt={displayName} src={user.image ?? undefined} />
            <AvatarFallback className='text-sm font-medium group-data-[collapsible=icon]:text-xs'>
              {getUserInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className='ml-1 flex min-w-0 flex-1 flex-col items-start gap-1 truncate text-left group-data-[collapsible=icon]:hidden'>
            <span className='w-full text-sm leading-none font-medium'>{displayName}</span>
            <span className='text-xs leading-none font-medium text-muted-foreground'>{user.email}</span>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='-ml-2' side='right' sideOffset={8}>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Settings />
              {t('settings')}
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <LangSwitchDrop />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    {resolvedTheme === 'dark' ? <Moon /> : <Sun />}
                    {t('theme')}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => setTheme('light')}>
                        <Sun />
                        {t('lightMode')}
                        {resolvedTheme === 'light' ? <Check className='ml-auto' /> : null}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme('dark')}>
                        <Moon />
                        {t('darkMode')}
                        {resolvedTheme === 'dark' ? <Check className='ml-auto' /> : null}
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuItem
            onClick={() => {
              if (user.isAnonymous) router.push('/login')
              else setShowLogoutDialog(true)
            }}>
            <LogOut />
            {user.isAnonymous ? t('logIn') : t('logOut')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog onOpenChange={setShowLogoutDialog} open={showLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('logoutConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('logoutConfirmDescription', { name: user.email })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction disabled={isLoggingOut} onClick={handleLogout}>
              {isLoggingOut ? t('loggingOut') : t('logOut')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default SidebarUserNav
