'use client'

import type { MouseEvent, RefObject } from 'react'

import { MessageResponse } from '@a/ui/ai-elements/message'
import { Spinner } from '@a/ui/spinner'
import equal from 'fast-deep-equal'
import { FileText, Maximize } from 'lucide-react'
import { memo, useCallback, useEffect, useRef } from 'react'

import { useArtifact } from '~/hooks/use-artifact'

import type { UIArtifact } from './artifact'

interface ArtifactResult {
  id: string
  title: string
}

const PureHitboxLayer = ({
    hitboxRef,
    result,
    setArtifact
  }: {
    hitboxRef: RefObject<HTMLDivElement | null>
    result: ArtifactResult
    setArtifact: (updaterFn: ((currentArtifact: UIArtifact) => UIArtifact) | UIArtifact) => void
  }) => {
    const handleClick = useCallback(
      (event: MouseEvent<HTMLElement>) => {
        const bb = event.currentTarget.getBoundingClientRect()
        setArtifact(a =>
          a.status === 'streaming'
            ? { ...a, isVisible: true }
            : {
                ...a,
                boundingBox: { height: bb.height, left: bb.x, top: bb.y, width: bb.width },
                isVisible: true,
                title: result.title
              }
        )
      },
      [setArtifact, result]
    )
    return (
      <div
        aria-hidden='true'
        className='absolute top-0 left-0 z-1 size-full rounded-xl'
        onClick={handleClick}
        ref={hitboxRef}
        role='presentation'
      />
    )
  },
  HitboxLayer = memo(PureHitboxLayer, (prevProps, nextProps) => {
    if (!equal(prevProps.result, nextProps.result)) return false
    return true
  }),
  PureDocumentHeader = ({ isStreaming, title }: { isStreaming: boolean; title: string }) => (
    <div className='flex items-center gap-2 p-3 [&>svg]:stroke-1 [&>svg]:text-muted-foreground'>
      {isStreaming ? <Spinner /> : <FileText />}
      {title}
      <Maximize className='ml-auto transition-all duration-300 group-hover:scale-125 group-hover:stroke-2 group-hover:text-foreground' />
    </div>
  ),
  DocumentHeader = memo(PureDocumentHeader, (prevProps, nextProps) => {
    if (prevProps.title !== nextProps.title) return false
    if (prevProps.isStreaming !== nextProps.isStreaming) return false
    return true
  })

interface DocumentPreviewProps {
  args?: {
    content?: string
    error?: string
    id?: string
    isUpdate?: boolean
    title?: string
  }
  result?: ArtifactResult
}

const DocumentPreview = ({ args, result }: DocumentPreviewProps) => {
  const { artifact, setArtifact } = useArtifact(),
    hitboxRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const bb = hitboxRef.current?.getBoundingClientRect()
    if (bb) setArtifact(a => ({ ...a, boundingBox: { height: bb.height, left: bb.x, top: bb.y, width: bb.width } }))
  }, [setArtifact])
  if (artifact.isVisible) return null
  return args ? null : (
    <div className='group relative my-3 w-full cursor-pointer overflow-hidden rounded-2xl border bg-background shadow-sm transition-all duration-300 hover:scale-[101%] hover:shadow-2xl hover:drop-shadow-2xl'>
      <HitboxLayer hitboxRef={hitboxRef} result={result ?? { id: '', title: '' }} setArtifact={setArtifact} />
      <DocumentHeader isStreaming={artifact.status === 'streaming'} title={artifact.title} />
      <MessageResponse className='h-80 px-3 transition-all duration-300 sm:px-6'>{artifact.content}</MessageResponse>
    </div>
  )
}

export default DocumentPreview
