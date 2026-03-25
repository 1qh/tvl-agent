import { getSession } from '~/auth/server'
import { getChatById, updateChatFeedbackById } from '~/lib/db'
import ChatSDKError from '~/lib/errors'

const validateFeedback = (chatId?: string, text?: string) => {
    if (!(chatId && text))
      return new ChatSDKError('bad_request:api', 'Parameters chatId and text are required.').toResponse()
    return null
  },
  authorizeAndValidate = async (chatId: string) => {
    const session = await getSession()
    if (!session?.user) return new ChatSDKError('unauthorized:vote').toResponse()
    const chat = await getChatById({ id: chatId })
    if (!chat) return new ChatSDKError('not_found:chat').toResponse()
    if (chat.userId !== session.user.id) return new ChatSDKError('forbidden:vote').toResponse()
    return { chat, session }
  }

export const POST = async (request: Request) => {
  const { chatId, text, type } = (await request.json()) as {
      chatId: string
      text?: string
      type?: 'bug' | 'quality'
    },
    validationError = validateFeedback(chatId, text)
  if (validationError) return validationError
  const authResult = await authorizeAndValidate(chatId)
  if ('toResponse' in authResult) return authResult
  try {
    await updateChatFeedbackById({ chatId, text, type })
    return new Response('Feedback saved', { status: 200 })
  } catch {
    return new ChatSDKError('bad_request:database', 'Failed to save feedback').toResponse()
  }
}
