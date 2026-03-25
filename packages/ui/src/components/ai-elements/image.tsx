import type { Experimental_GeneratedImage } from 'ai'

import { cn } from '@a/ui'
import NImage from 'next/image'

export type ImageProps = Experimental_GeneratedImage & {
  alt?: string
  className?: string
}

export const Image = ({ base64, mediaType, ...props }: ImageProps) => (
  <NImage
    {...props}
    alt={props.alt ?? ''}
    className={cn('h-auto max-w-full overflow-hidden rounded-md', props.className)}
    src={`data:${mediaType};base64,${base64}`}
  />
)
