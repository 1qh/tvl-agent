'use client'

import { Button } from '@a/ui/button'
import { Input } from '@a/ui/input'
import { Spinner } from '@a/ui/spinner'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import authClient from '~/auth/client'

const Page = () => {
  const [name, setName] = useState(''),
    [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [pwConfirm, setPwConfirm] = useState(''),
    [loading, setLoading] = useState(false),
    router = useRouter()
  return (
    <div className='w-64 space-y-2 text-center'>
      <p className='mb-6 text-5xl font-extralight tracking-[-0.07em] text-muted-foreground/30 dark:text-muted'>Sign up</p>
      <Input onChange={e => setName(e.target.value)} placeholder='Your Name' required value={name} />
      <Input onChange={e => setEmail(e.target.value)} placeholder='your@email.com' required type='email' value={email} />
      <Input
        autoComplete='new-password'
        onChange={e => setPassword(e.target.value)}
        placeholder='Password'
        type='password'
        value={password}
      />
      <Input
        autoComplete='new-password'
        onChange={e => setPwConfirm(e.target.value)}
        placeholder='Confirm Password'
        type='password'
        value={pwConfirm}
      />
      <Button
        className='w-full'
        disabled={loading || !email || !password || !pwConfirm}
        onClick={async () => {
          if (password !== pwConfirm) {
            toast.error('Passwords do not match')
            return
          }
          await authClient.signUp.email({
            callbackURL: '/',
            email,
            fetchOptions: {
              onError: ctx => {
                toast.error(ctx.error.message)
              },
              onRequest: () => setLoading(true),
              onResponse: () => setLoading(false),
              // eslint-disable-next-line @typescript-eslint/require-await
              onSuccess: async () => router.push('/')
            },
            name,
            password
          })
        }}
        type='submit'>
        {loading ? <Spinner /> : 'Create an account'}
      </Button>
    </div>
  )
}
export default Page
