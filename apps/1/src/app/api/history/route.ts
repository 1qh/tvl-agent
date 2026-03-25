import type { NextRequest } from 'next/server'

import { getSession } from '~/auth/server'
import { deleteAllChatsByUserId, getChatsByUserId } from '~/lib/db'
import ChatSDKError from '~/lib/errors'

export const GET = async (request: NextRequest) => {
  const { searchParams } = request.nextUrl,
    limit = Number.parseInt(searchParams.get('limit') ?? '10', 10),
    startingAfter = searchParams.get('starting_after'),
    endingBefore = searchParams.get('ending_before')
  if (startingAfter && endingBefore)
    return new ChatSDKError('bad_request:api', 'Only one of starting_after or ending_before can be provided.').toResponse()
  const session = await getSession()
  if (!session?.user) return new ChatSDKError('unauthorized:chat').toResponse()
  const chats = await getChatsByUserId({ endingBefore, id: session.user.id, limit, startingAfter })
  return Response.json(chats)
}
export const DELETE = async () => {
  const session = await getSession()
  if (!session?.user) return new ChatSDKError('unauthorized:chat').toResponse()
  const result = await deleteAllChatsByUserId({ userId: session.user.id })
  return Response.json(result, { status: 200 })
}
