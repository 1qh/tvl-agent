'use client'

import { useCallback, useMemo } from 'react'
import useSWR from 'swr'

import type { UIArtifact } from '~/components/artifact'

export const initialArtifactData: UIArtifact = {
    boundingBox: { height: 0, left: 0, top: 0, width: 0 },
    content: '',
    isVisible: false,
    status: 'idle',
    title: ''
  },
  useArtifact = () => {
    const { data: localArtifact, mutate: setLocalArtifact } = useSWR<UIArtifact>('artifact', null, {
        fallbackData: initialArtifactData
      }),
      artifact = useMemo(() => localArtifact ?? initialArtifactData, [localArtifact]),
      setArtifact = useCallback(
        (updaterFn: ((currentArtifact: UIArtifact) => UIArtifact) | UIArtifact) => {
          setLocalArtifact(currentArtifact => {
            const artifactToUpdate = currentArtifact ?? initialArtifactData
            if (typeof updaterFn === 'function') return updaterFn(artifactToUpdate)
            return updaterFn
          })
        },
        [setLocalArtifact]
      )
    return useMemo(
      () => ({
        artifact,
        setArtifact
      }),
      [artifact, setArtifact]
    )
  }
