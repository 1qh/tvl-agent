import { Button } from '@a/ui/button'
import Ic from '@svgr-iconkit/flat-color-icons'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { auth } from '~/auth/server'

const Page = () => (
  <div className='space-y-3 text-center'>
    <form>
      <Button
        className='rounded-xl transition-all duration-300 hover:scale-110 active:scale-75'
        formAction={async () => {
          'use server'
          const res = await auth.api.signInSocial({ body: { callbackURL: '/', provider: 'google' } })
          if (!res.url) throw new Error('No URL returned from signInSocial')
          redirect(res.url)
        }}
        size='lg'
        variant='outline'>
        <Ic className='size-5' name='google' />
        Continue with Google
      </Button>
    </form>
    <Link
      className='block text-sm font-light text-muted-foreground transition-all duration-300 hover:font-normal hover:text-foreground'
      href='/login/email'>
      Log in with password
    </Link>
  </div>
)

export default Page
