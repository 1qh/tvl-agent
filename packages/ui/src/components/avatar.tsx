'use client'

import { cn } from '@a/ui'
import { Avatar as AvatarPrimitive } from 'radix-ui'

const Avatar = ({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Root>) => (
    <AvatarPrimitive.Root
      className={cn('relative flex size-8 shrink-0 overflow-hidden rounded-full', className)}
      data-slot='avatar'
      {...props}
    />
  ),
  AvatarImage = ({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) => (
    <AvatarPrimitive.Image className={cn('aspect-square size-full', className)} data-slot='avatar-image' {...props} />
  ),
  AvatarFallback = ({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Fallback>) => (
    <AvatarPrimitive.Fallback
      className={cn('flex size-full items-center justify-center rounded-full bg-muted', className)}
      data-slot='avatar-fallback'
      {...props}
    />
  )

export { Avatar, AvatarFallback, AvatarImage }
