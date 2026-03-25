/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import type { DataUIPart } from 'ai'
import type { Dispatch, SetStateAction } from 'react'

import type { CustomUIDataTypes } from '~/types'

import type { UIArtifact } from '../components/artifact'

interface ArtifactAction {
  description: string
  isDisabled?: (context: ArtifactActionContext) => boolean
  onClick: (context: ArtifactActionContext) => Promise<void> | void
}

interface ArtifactActionContext {
  chatId: string
  content: string
  handleToggleBookmark: (chatId: string) => void
  isBookmarked: boolean
}

interface ArtifactConfig {
  actions: ArtifactAction[]
  onStreamPart: (args: {
    setArtifact: Dispatch<SetStateAction<UIArtifact>>
    // @ts-expect-error: x
    streamPart: DataUIPart<CustomUIDataTypes>
  }) => void
}

class Artifact {
  actions: ArtifactAction[]
  onStreamPart: (args: {
    setArtifact: Dispatch<SetStateAction<UIArtifact>>
    // @ts-expect-error: x
    streamPart: DataUIPart<CustomUIDataTypes>
  }) => void

  constructor(config: ArtifactConfig) {
    this.actions = config.actions
    this.onStreamPart = config.onStreamPart
  }
}

export default new Artifact({
  actions: [
    {
      description: 'bookmark',
      onClick: ({ chatId, handleToggleBookmark }) => handleToggleBookmark(chatId)
    },
    {
      description: 'copy',
      onClick: ({ content }) => {
        navigator.clipboard.writeText(content)
      }
    }
  ],
  onStreamPart: ({ setArtifact, streamPart }) => {
    if (streamPart.type === 'data-textDelta')
      setArtifact(a => ({
        ...a,
        content: a.content + streamPart.data,
        isVisible: a.status === 'streaming' && a.content.length > 400 && a.content.length < 450 ? true : a.isVisible,
        status: 'streaming'
      }))
  }
})

export type { ArtifactActionContext }
