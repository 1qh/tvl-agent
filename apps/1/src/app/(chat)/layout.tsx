import type { User } from '@a/db/schema'
import type { ReactNode } from 'react'

import { cn } from '@a/ui'
import { buttonVariants } from '@a/ui/button'
import { SidebarInset, SidebarProvider } from '@a/ui/sidebar'
import { getTranslations } from 'next-intl/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Suspense } from 'react'

import { getSession } from '~/auth/server'
import AppSidebar from '~/components/app-sidebar'
import { DataStreamProvider } from '~/components/data-stream-provider'
import { LangSwitch } from '~/i18n/switch'

const SidebarWrapper = async ({ children }: { children: ReactNode }) => {
  const [session, cookieStore] = await Promise.all([getSession(), cookies()]),
    user = session?.user as undefined | User,
    isCollapsed = cookieStore.get('sidebar_state')?.value !== 'true',
    guest = !session || user?.isAnonymous,
    t = await getTranslations()
  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <AppSidebar user={session?.user as User} />
      <SidebarInset>
        {guest ? (
          <div className='fixed top-2 right-2 z-2 flex items-center gap-2'>
            <LangSwitch />
            <Link className={cn(buttonVariants(), 'cursor-pointer rounded-full')} href='/login'>
              {t('logIn')}
            </Link>
          </div>
        ) : null}
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}

interface LayoutProps {
  children: ReactNode
}

const Layout = ({ children }: LayoutProps) => (
  <DataStreamProvider>
    <Suspense fallback={<div className='flex h-dvh' />}>
      <SidebarWrapper>{children}</SidebarWrapper>
    </Suspense>
  </DataStreamProvider>
)

export default Layout
