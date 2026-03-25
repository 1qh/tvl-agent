/** biome-ignore-all lint/nursery/noContinue: x */
'use client'

import { useEffect } from 'react'
import { useSWRConfig } from 'swr'
import { unstable_serialize } from 'swr/infinite'

import { initialArtifactData, useArtifact } from '~/hooks/use-artifact'
import textArtifact from '~/lib/artifact'

import { useDataStream } from './data-stream-provider'
import { getChatHistoryPaginationKey } from './sidebar-history'

const DataStreamHandler = () => {
  const { dataStream, setDataStream } = useDataStream(),
    { mutate } = useSWRConfig(),
    { artifact, setArtifact } = useArtifact()

  useEffect(() => {
    if (!dataStream.length) return
    const newDeltas = [...dataStream]
    setDataStream([])

    for (const delta of newDeltas) {
      if (delta.type === 'data-chat-title') {
        mutate(unstable_serialize(getChatHistoryPaginationKey))
        // eslint-disable-next-line no-continue
        continue
      }
      textArtifact.onStreamPart({
        setArtifact,
        streamPart: delta
      })
      setArtifact(a => {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!a) return { ...initialArtifactData, status: 'streaming' }
        // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
        switch (delta.type) {
          case 'data-clear':
            return { ...a, content: '', status: 'streaming' }
          case 'data-finish':
            return { ...a, status: 'idle' }
          case 'data-title':
            return { ...a, status: 'streaming', title: delta.data }
          default:
            return a
        }
      })
    }
  }, [dataStream, setArtifact, artifact, setDataStream, mutate])

  return null
}

export default DataStreamHandler
