import { refreshAllUsage } from '~/lib/tavily-key-manager'

export const maxDuration = 30

export const GET = async () => {
  try {
    const result = await refreshAllUsage()
    return Response.json(result, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
