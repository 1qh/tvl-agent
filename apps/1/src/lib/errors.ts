/* eslint-disable @typescript-eslint/explicit-member-accessibility */

const getStatusCodeByType = (type: ErrorType) => {
  switch (type) {
    case 'bad_request':
      return 400
    case 'forbidden':
      return 403
    case 'not_found':
      return 404
    case 'offline':
      return 503
    case 'rate_limit':
      return 429
    case 'unauthorized':
      return 401
    default:
      return 500
  }
}

type ErrorCode = `${ErrorType}:${Surface}`
type ErrorType = 'bad_request' | 'forbidden' | 'not_found' | 'offline' | 'rate_limit' | 'unauthorized'
type ErrorVisibility = 'log' | 'none' | 'response'
type Surface = 'api' | 'auth' | 'chat' | 'database' | 'document' | 'history' | 'stream' | 'vote'

const visibilityBySurface: Record<Surface, ErrorVisibility> = {
    api: 'response',
    auth: 'response',
    chat: 'response',
    database: 'log',
    document: 'response',
    history: 'response',
    stream: 'response',
    vote: 'response'
  },
  getMessageByErrorCode = (errorCode: ErrorCode): string => {
    if (errorCode.includes('database')) return 'An error occurred while executing a database query.'

    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
    switch (errorCode) {
      case 'bad_request:api':
        return "The request couldn't be processed. Please check your input and try again."
      case 'forbidden:chat':
        return 'This chat belongs to another user. Please check the chat ID and try again.'
      case 'forbidden:document':
        return 'This document belongs to another user. Please check the document ID and try again.'
      case 'not_found:chat':
        return 'The requested chat was not found. Please check the chat ID and try again.'
      case 'not_found:document':
        return 'The requested document was not found. Please check the document ID and try again.'
      case 'offline:chat':
        return "We're having trouble sending your message. Please check your internet connection and try again."
      case 'rate_limit:chat':
        return 'You have exceeded your maximum number of messages for the day. Please try again later.'
      case 'unauthorized:chat':
        return 'You need to sign in to view this chat. Please sign in and try again.'
      case 'unauthorized:document':
        return 'You need to sign in to view this document. Please sign in and try again.'
      default:
        return 'Something went wrong. Please try again later.'
    }
  }

class ChatSDKError extends Error {
  statusCode: number
  surface: Surface
  type: ErrorType

  constructor(errorCode: ErrorCode, cause?: string) {
    super()
    const [type, surface] = errorCode.split(':')
    this.type = type as ErrorType
    this.cause = cause
    this.surface = surface as Surface
    this.message = getMessageByErrorCode(errorCode)
    this.statusCode = getStatusCodeByType(this.type)
  }
  toResponse() {
    const code: ErrorCode = `${this.type}:${this.surface}`,
      visibility = visibilityBySurface[this.surface],
      { cause, message, statusCode } = this
    if (visibility === 'log') {
      console.error({ cause, code, message })
      return Response.json({ code: '', message: 'Something went wrong. Please try again later.' }, { status: statusCode })
    }
    return Response.json({ cause, code, message }, { status: statusCode })
  }
}

export default ChatSDKError
