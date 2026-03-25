/* eslint-disable @next/next/no-img-element */
/** biome-ignore-all lint/performance/noImgElement: x */
import { cn } from '@a/ui'
import { Loader } from '@a/ui/ai-elements/loader'
import { Button } from '@a/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@a/ui/dialog'
import { X } from 'lucide-react'

import type { Attachment } from '~/types'

const PreviewAttachment = ({
  attachment: { contentType, name, url },
  isUploading = false,
  onRemove
}: {
  attachment: Attachment
  isUploading?: boolean
  onRemove?: () => void
}) => {
  const t = contentType.includes('image') ? 'image' : contentType.includes('pdf') ? 'pdf' : 'file'
  return (
    <Dialog>
      <div className='group relative size-14'>
        <DialogTrigger className='size-14 overflow-hidden rounded-lg border'>
          {t === 'image' ? (
            <img alt={name.length ? name : ''} className='size-full object-cover' height={48} src={url} width={48} />
          ) : (
            <p className='flex size-full items-center justify-center text-xs text-muted-foreground'>{t}</p>
          )}
          {isUploading ? (
            <div className='absolute inset-0 flex items-center justify-center bg-black/50'>
              <Loader size={16} />
            </div>
          ) : null}
        </DialogTrigger>
        {onRemove && !isUploading ? (
          <Button
            className='absolute -top-1.5 -right-1.5 size-6 rounded-full opacity-0 group-hover:opacity-100'
            onClick={onRemove}
            size='icon'
            type='button'
            variant='outline'>
            <X className='size-3' />
          </Button>
        ) : null}
      </div>
      <DialogContent className={cn('border-none', t === 'pdf' ? 'h-[96vh] max-w-7xl p-0' : 'p-0')}>
        {isUploading ? null : t === 'image' ? (
          <img alt={name.length ? name : ''} className='size-full object-cover' height={500} src={url} width={500} />
        ) : t === 'pdf' ? (
          // eslint-disable-next-line react/iframe-missing-sandbox
          <iframe className='size-full bg-transparent' src={`${url}#toolbar=0`} title='pdf' />
        ) : (
          'preview not available'
        )}
      </DialogContent>
    </Dialog>
  )
}

export default PreviewAttachment
