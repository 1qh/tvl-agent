/* eslint-disable max-statements */
import { NextResponse as R } from 'next/server'
import { object, z } from 'zod/v4'

import { getSession } from '~/auth/server'
import env from '~/env'
import { s3 } from '~/s3'

const fileSchema = object({
  file: z
    .instanceof(File)
    .refine(f => f.size <= 5 * 1024 * 1024, { message: 'File size should be less than 5MB' })
    .refine(f => ['image', 'pdf', 'text'].some(t => f.type.includes(t)), { message: 'Only images and PDFs are allowed' })
})

export const POST = async (request: Request) => {
  const session = await getSession()
  if (!session) return R.json({ error: 'Unauthorized' }, { status: 401 })
  if (request.body === null) return new Response('Request body is empty', { status: 400 })
  try {
    const fd = await request.formData(),
      f = fd.get('file') as File | null
    if (!f) return R.json({ error: 'No file uploaded' }, { status: 400 })
    const validFile = fileSchema.safeParse({ file: f })
    if (!validFile.success) {
      const errorMessage = validFile.error.issues.map(e => e.message).join(', ')
      return R.json({ error: errorMessage }, { status: 400 })
    }
    const { name, type } = f,
      pathname = `chat/${session.user.id}/${Date.now()}.${name.split('.').pop() ?? 'dat'}`
    try {
      await s3.write(pathname, f, { type })
      return R.json({
        contentType: type,
        pathname,
        url: `${env.S3_ENDPOINT}/${env.S3_BUCKET}/${pathname}`
      })
    } catch {
      return R.json({ error: 'Upload failed' }, { status: 500 })
    }
  } catch {
    return R.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
