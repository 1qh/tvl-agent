'use client'

import { Button } from '@a/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@a/ui/dialog'
import { Label } from '@a/ui/label'
import { RadioGroup, RadioGroupItem } from '@a/ui/radio-group'
import { Textarea } from '@a/ui/textarea'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useSWRConfig } from 'swr'
import { unstable_serialize } from 'swr/infinite'

import { getChatHistoryPaginationKey } from './sidebar-history'
import { toast } from './toast'

interface FeedbackDialogProps {
  chatId: string
  onOpenChange: (open: boolean) => void
  open: boolean
}

const FeedbackDialog = ({ chatId, onOpenChange, open }: FeedbackDialogProps) => {
  const [feedbackType, setFeedbackType] = useState<'bug' | 'quality'>('bug'),
    [feedbackText, setFeedbackText] = useState(''),
    [isSubmitting, setIsSubmitting] = useState(false),
    t = useTranslations(),
    { mutate } = useSWRConfig(),
    submitFeedback = async () =>
      fetch('/api/feedback', {
        body: JSON.stringify({ chatId, text: feedbackText, type: feedbackType }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST'
      }),
    // eslint-disable-next-line max-statements
    handleSubmit = async () => {
      if (!feedbackText.trim()) {
        toast({ description: t('feedbackEnterPrompt'), type: 'error' })
        return
      }

      setIsSubmitting(true)

      try {
        const res = await submitFeedback()
        if (!res.ok) {
          toast({ description: t('feedbackSubmitFailed'), type: 'error' })
          return
        }
        try {
          await mutate(unstable_serialize(getChatHistoryPaginationKey))
        } catch {
          //
        }
        toast({ description: t('feedbackSubmitted'), type: 'success' })
        setFeedbackText('')
        setFeedbackType('bug')
        onOpenChange(false)
      } catch {
        toast({ description: t('feedbackSubmitFailed'), type: 'error' })
      } finally {
        setIsSubmitting(false)
      }
    }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>{t('reportConversationTitle')}</DialogTitle>
          <DialogDescription>{t('reportConversationDescription')}</DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='space-y-3'>
            <Label>{t('reportReasonLabel')}</Label>
            <RadioGroup onValueChange={value => setFeedbackType(value as 'bug' | 'quality')} value={feedbackType}>
              <div className='flex items-center space-x-2'>
                <RadioGroupItem id='bug' value='bug' />
                <Label className='font-normal' htmlFor='bug'>
                  {t('bugReport')}
                </Label>
              </div>
              <div className='flex items-center space-x-2'>
                <RadioGroupItem id='quality' value='quality' />
                <Label className='font-normal' htmlFor='quality'>
                  {t('qualityFeedback')}
                </Label>
              </div>
            </RadioGroup>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='feedback'>{t('yourFeedback')}</Label>
            <Textarea
              className='min-h-[100px]'
              id='feedback'
              onChange={e => setFeedbackText(e.target.value)}
              placeholder={t('reportFeedbackPlaceholder')}
              value={feedbackText}
            />
          </div>
        </div>
        <div className='flex justify-end gap-2'>
          <Button disabled={isSubmitting} onClick={() => onOpenChange(false)} type='button' variant='outline'>
            {t('cancel')}
          </Button>
          <Button disabled={isSubmitting} onClick={handleSubmit} type='button'>
            {t('submit')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default FeedbackDialog
