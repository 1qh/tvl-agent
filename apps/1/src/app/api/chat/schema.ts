import type { z } from 'zod/v4'

import { any, array, object, string, union, url, uuid, enum as zenum } from 'zod/v4'

const textPartSchema = object({
    text: string(),
    type: zenum(['text'])
  }),
  filePartSchema = object({
    mediaType: string(),
    name: string().min(1).max(100),
    type: zenum(['file']),
    url: url()
  }),
  partSchema = union([textPartSchema, filePartSchema]),
  userMessageSchema = object({
    id: uuid(),
    parts: array(partSchema),
    role: zenum(['user'])
  }),
  messageSchema = object({
    id: string(),
    parts: array(any()),
    role: string()
  })

export const postRequestBodySchema = object({
  id: uuid(),
  message: userMessageSchema.optional(),
  messages: array(messageSchema).optional(),
  selectedChatModel: string(),
  selectedVisibilityType: zenum(['public', 'private'])
})

export type PostRequestBody = z.infer<typeof postRequestBodySchema>
