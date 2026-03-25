'use client'

import { cn } from '@a/ui'
import { buttonVariants } from '@a/ui/button'
import { AlertDialog as AlertDialogPrimitive } from 'radix-ui'

const AlertDialog = ({ ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Root>) => (
    <AlertDialogPrimitive.Root data-slot='alert-dialog' {...props} />
  ),
  AlertDialogTrigger = ({ ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) => (
    <AlertDialogPrimitive.Trigger data-slot='alert-dialog-trigger' {...props} />
  ),
  AlertDialogPortal = ({ ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) => (
    <AlertDialogPrimitive.Portal data-slot='alert-dialog-portal' {...props} />
  ),
  AlertDialogOverlay = ({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) => (
    <AlertDialogPrimitive.Overlay
      className={cn(
        'fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
        className
      )}
      data-slot='alert-dialog-overlay'
      {...props}
    />
  ),
  AlertDialogContent = ({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Content>) => (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        className={cn(
          'fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-[-50%] gap-4 rounded-lg border bg-background p-6 shadow-lg duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:max-w-lg',
          className
        )}
        data-slot='alert-dialog-content'
        {...props}
      />
    </AlertDialogPortal>
  ),
  AlertDialogHeader = ({ className, ...props }: React.ComponentProps<'div'>) => (
    <div
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
      data-slot='alert-dialog-header'
      {...props}
    />
  ),
  AlertDialogFooter = ({ className, ...props }: React.ComponentProps<'div'>) => (
    <div
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      data-slot='alert-dialog-footer'
      {...props}
    />
  ),
  AlertDialogTitle = ({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Title>) => (
    <AlertDialogPrimitive.Title
      className={cn('text-lg font-semibold', className)}
      data-slot='alert-dialog-title'
      {...props}
    />
  ),
  AlertDialogDescription = ({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Description>) => (
    <AlertDialogPrimitive.Description
      className={cn('text-sm text-muted-foreground', className)}
      data-slot='alert-dialog-description'
      {...props}
    />
  ),
  AlertDialogAction = ({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Action>) => (
    <AlertDialogPrimitive.Action className={cn(buttonVariants(), className)} {...props} />
  ),
  AlertDialogCancel = ({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) => (
    <AlertDialogPrimitive.Cancel className={cn(buttonVariants({ variant: 'outline' }), className)} {...props} />
  )

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger
}
