'use client'

import type { MouseEvent } from 'react'

import { Spinner } from '@a/ui/spinner'
import { FileText } from 'lucide-react'
import { useTranslations } from 'next-intl'

import type { ParsedReport } from '~/lib/response-parser'

import { useArtifact } from '~/hooks/use-artifact'

interface ArtifactBadgeProps {
  isStreaming?: boolean
  report: ParsedReport
}

const ArtifactBadge = ({ isStreaming, report }: ArtifactBadgeProps) => {
  const { setArtifact } = useArtifact(),
    t = useTranslations(),
    handleClick = (e: MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect(),
        boundingBox = { height: rect.height, left: rect.left, top: rect.top, width: rect.width }
      setArtifact(a => ({
        ...a,
        boundingBox,
        content: report.content,
        isVisible: true,
        status: 'idle',
        title: report.title
      }))
    }
  return (
    <button
      className='mt-1 flex w-fit max-w-96 items-center gap-1 rounded-full border p-1 px-2 text-sm font-light tracking-tight text-muted-foreground transition-all duration-300 hover:scale-[102%] hover:bg-background hover:text-foreground [&>svg]:size-4 [&>svg]:stroke-1'
      onClick={handleClick}
      type='button'>
      {isStreaming ? <Spinner /> : <FileText />}
      {isStreaming ? t('creating') : t('created')}
      <span className='truncate font-semibold'>{report.title}</span>
    </button>
  )
}

export default ArtifactBadge
