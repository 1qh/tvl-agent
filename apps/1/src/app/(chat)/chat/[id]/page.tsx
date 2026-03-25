import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { Suspense } from 'react'

import { DEFAULT_CHAT_MODEL } from '~/ai/models'
import { getSession } from '~/auth/server'
import Chat from '~/components/chat'
import DataStreamHandler from '~/components/data-stream-handler'
import { getChatById, getMessagesByChatId } from '~/lib/db'
import { convertToUIMessages } from '~/utils'

const ChatPage = async ({ params }: PageProps) => {
  const { id } = await params,
    chat = await getChatById({ id })

  if (!chat) redirect('/')

  const session = await getSession()

  if (!session) redirect(`/api/guest?redirectUrl=${encodeURIComponent(`/chat/${id}`)}`)

  if (chat.visibility === 'private' && session.user.id !== chat.userId) return notFound()

  const messagesFromDb = await getMessagesByChatId({ id }),
    uiMessages = convertToUIMessages(messagesFromDb),
    cookieStore = await cookies(),
    chatModelFromCookie = cookieStore.get('chat-model')

  return (
    <>
      <Chat
        autoResume
        id={chat.id}
        initialChatModel={chatModelFromCookie?.value ?? DEFAULT_CHAT_MODEL}
        initialLastContext={chat.lastContext ?? undefined}
        initialMessages={uiMessages}
        initialVisibilityType={chat.visibility}
        isAnonymous={Boolean(session.user.isAnonymous)}
        isReadonly={session.user.id !== chat.userId}
      />
      <DataStreamHandler />
    </>
  )
}

interface PageProps {
  params: Promise<{ id: string }>
}

const Page = ({ params }: PageProps) => (
  <Suspense fallback={<div className='flex h-dvh' />}>
    <ChatPage params={params} />
  </Suspense>
)

export default Page
