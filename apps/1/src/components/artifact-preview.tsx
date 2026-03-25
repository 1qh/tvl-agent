'use client'

import type { MouseEvent } from 'react'

import { MessageResponse } from '@a/ui/ai-elements/message'
import { Spinner } from '@a/ui/spinner'
import { FileText, Maximize } from 'lucide-react'
import { motion } from 'motion/react'
import { useCallback, useRef } from 'react'

import type { ParsedReport } from '~/lib/response-parser'

import { useArtifact } from '~/hooks/use-artifact'

interface ArtifactPreviewProps {
  isStreaming?: boolean
  report: ParsedReport
}

const ArtifactPreview = ({ isStreaming, report }: ArtifactPreviewProps) => {
  const { artifact, setArtifact } = useArtifact(),
    hitboxRef = useRef<HTMLDivElement>(null),
    handleClick = useCallback(
      (event: MouseEvent<HTMLElement>) => {
        const bb = event.currentTarget.getBoundingClientRect()
        setArtifact(a =>
          a.status === 'streaming'
            ? { ...a, isVisible: true }
            : {
                ...a,
                boundingBox: { height: bb.height, left: bb.x, top: bb.y, width: bb.width },
                content: report.content,
                isVisible: true,
                status: 'idle',
                title: report.title
              }
        )
      },
      [setArtifact, report]
    )

  if (artifact.isVisible) return null

  return (
    <div className='group relative my-3 w-full cursor-pointer overflow-hidden rounded-2xl border bg-background shadow-lg transition-all duration-300 hover:scale-[101%] hover:border-transparent hover:shadow-2xl hover:drop-shadow-2xl'>
      <div
        aria-hidden='true'
        className='absolute top-0 left-0 z-1 size-full rounded-xl'
        onClick={handleClick}
        ref={hitboxRef}
        role='presentation'
      />
      <div className='flex items-center gap-2 p-3 text-muted-foreground [&>svg]:stroke-1'>
        {isStreaming ? <Spinner /> : <FileText />}
        {report.title}
        <Maximize className='ml-auto transition-all duration-300 group-hover:scale-125 group-hover:stroke-2 group-hover:text-foreground' />
      </div>
      <motion.div
        animate={{ height: 320 }}
        className='overflow-hidden'
        initial={{ height: 0 }}
        transition={{ damping: 25, duration: 0.5, stiffness: 300, type: 'spring' }}>
        <MessageResponse className='h-80 px-3 transition-all duration-300 sm:px-6'>{report.content}</MessageResponse>
      </motion.div>
    </div>
  )
}

export default ArtifactPreview
