import { env, S3Client } from 'bun'

export const s3 = new S3Client({
  accessKeyId: env.S3_ACCESS_KEY_ID,
  bucket: env.S3_BUCKET,
  endpoint: env.S3_ENDPOINT,
  secretAccessKey: env.S3_SECRET_ACCESS_KEY
})
