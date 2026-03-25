import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@a/ui/alert-dialog'
import { Button } from '@a/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@a/ui/dialog'
import { Input } from '@a/ui/input'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

interface RenameChatProps {
  initialTitle: string
  onOpenChange: (open: boolean) => void
  onSave: (title: string) => void
  open: boolean
}

const RenameChat = ({ initialTitle, onOpenChange, onSave, open }: RenameChatProps) => {
  const [title, setTitle] = useState(initialTitle),
    t = useTranslations(),
    handleSave = () => {
      if (title.trim() && title !== initialTitle) onSave(title.trim())
      onOpenChange(false)
    }

  useEffect(() => {
    if (open) setTitle(initialTitle)
  }, [open, initialTitle])

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('renameChat')}</DialogTitle>
        </DialogHeader>
        <Input
          autoFocus
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') onOpenChange(false)
          }}
          value={title}
        />
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant='outline'>
            {t('cancel')}
          </Button>
          <Button onClick={handleSave}>{t('save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface DeleteChatProps {
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
  open: boolean
}

const DeleteChat = ({ onConfirm, onOpenChange, open }: DeleteChatProps) => {
  const t = useTranslations()
  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('confirmActionTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('deleteDialogWarning')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{t('continue')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export { DeleteChat, RenameChat }
