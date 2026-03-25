import { getSession } from '~/auth/server'
import { getChatById, getVotesByChatId, voteMessage } from '~/lib/db'
import ChatSDKError from '~/lib/errors'

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url),
    chatId = searchParams.get('chatId')
  if (!chatId) return new ChatSDKError('bad_request:api', 'Parameter chatId is required.').toResponse()
  const session = await getSession()
  if (!session?.user) return new ChatSDKError('unauthorized:vote').toResponse()
  const chat = await getChatById({ id: chatId })
  if (!chat) return new ChatSDKError('not_found:chat').toResponse()
  if (chat.userId !== session.user.id) return new ChatSDKError('forbidden:vote').toResponse()
  const votes = await getVotesByChatId({ id: chatId })
  return Response.json(votes, { status: 200 })
}
export const PATCH = async (request: Request) => {
  const { chatId, messageId, type } = (await request.json()) as {
    chatId: string
    messageId: string
    type: 'down' | 'up'
  }
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!(chatId && messageId && type))
    return new ChatSDKError('bad_request:api', 'Parameters chatId, messageId, and type are required.').toResponse()
  const session = await getSession()
  if (!session?.user) return new ChatSDKError('unauthorized:vote').toResponse()
  const chat = await getChatById({ id: chatId })
  if (!chat) return new ChatSDKError('not_found:vote').toResponse()
  if (chat.userId !== session.user.id) return new ChatSDKError('forbidden:vote').toResponse()
  await voteMessage({ chatId, messageId, type })
  return new Response('Message voted', { status: 200 })
}
