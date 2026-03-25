'use client'

import type { ReactNode } from 'react'

import { cn } from '@a/ui'
import { Check, TriangleAlert } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast as sonnerToast } from 'sonner'

const iconsByType: Record<'error' | 'success', ReactNode> = {
  error: <TriangleAlert />,
  success: <Check />
}

interface ToastProps {
  description: string
  id: number | string
  type: 'error' | 'success'
}

const Toast = (props: ToastProps) => {
  const { description, id, type } = props,
    descriptionRef = useRef<HTMLDivElement>(null),
    [multiLine, setMultiLine] = useState(false)

  useEffect(() => {
    const el = descriptionRef.current
    if (!el) return
    const update = () => {
      const lineHeight = Number.parseFloat(getComputedStyle(el).lineHeight),
        lines = Math.round(el.scrollHeight / lineHeight)
      setMultiLine(lines > 1)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div className='toast-mobile:w-[356px] flex w-full justify-center'>
      <div
        className={cn(
          'toast-mobile:w-fit flex w-full gap-3 rounded-lg border bg-popover p-3 text-popover-foreground shadow-md',
          multiLine ? 'items-start' : 'items-center'
        )}
        key={id}>
        <div
          className={cn('data-[type=error]:text-red-600 data-[type=success]:text-green-600', { 'pt-1': multiLine })}
          data-type={type}>
          {iconsByType[type]}
        </div>
        <div className='text-sm' ref={descriptionRef}>
          {description}
        </div>
      </div>
    </div>
  )
}

export const toast = (props: Omit<ToastProps, 'id'>) =>
  sonnerToast.custom(id => <Toast description={props.description} id={id} type={props.type} />)
