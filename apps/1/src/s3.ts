export const getS3 = async () => {
  const { env, S3Client } = await import('bun')
  return new S3Client({
    accessKeyId: env.S3_ACCESS_KEY_ID,
    bucket: env.S3_BUCKET,
    endpoint: env.S3_ENDPOINT,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY
  })
}
