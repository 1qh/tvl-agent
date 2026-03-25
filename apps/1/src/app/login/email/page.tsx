'use client'

import { Button } from '@a/ui/button'
import { Input } from '@a/ui/input'
import Link from 'next/link'
import { useState } from 'react'

import authClient from '~/auth/client'

const Page = () => {
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState('')
  return (
    <div className='w-64 space-y-2 text-center'>
      <Input onChange={e => setEmail(e.target.value)} placeholder='your@email.com' required type='email' value={email} />
      <Input
        autoComplete='password'
        onChange={e => setPassword(e.target.value)}
        placeholder='password'
        type='password'
        value={password}
      />
      <Button
        className='w-full'
        disabled={!(email && password)}
        onClick={async () => authClient.signIn.email({ callbackURL: '/', email, password })}
        type='submit'>
        Log in
      </Button>
      <Link
        className='block text-xs font-light text-muted-foreground transition-all duration-300 hover:text-foreground'
        href='/login/new'>
        Don&#39;t have an account? Sign up
      </Link>
    </div>
  )
}
export default Page
