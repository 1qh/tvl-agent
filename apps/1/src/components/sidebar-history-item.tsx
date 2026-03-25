import type { Chat } from '@a/db/schema'

import { Button } from '@a/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@a/ui/dropdown-menu'
import { Bookmark, Copy, Ellipsis, Pencil, Trash } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useState } from 'react'

import { RenameChat } from './chat-actions'

interface ChatItemProps {
  chat: Chat
  isActive: boolean
  onClone: (chatId: string) => void
  onDelete: (chatId: string) => void
  onEdit: (chatId: string, title: string) => void
  onToggleBookmark: (chatId: string) => void
  setOpenMobile: (open: boolean) => void
}

const ChatItem = ({ chat, isActive, onClone, onDelete, onEdit, onToggleBookmark, setOpenMobile }: ChatItemProps) => {
  const [showEditDialog, setShowEditDialog] = useState(false),
    t = useTranslations()
  return (
    <>
      <div className='group/item relative flex items-center gap-2'>
        <Button asChild className='h-8 w-full justify-start truncate px-2' variant={isActive ? 'secondary' : 'ghost'}>
          <Link href={`/chat/${chat.id}`} onClick={() => setOpenMobile(false)}>
            {chat.title}
          </Link>
        </Button>
        <DropdownMenu modal>
          <DropdownMenuTrigger asChild>
            <Button className='absolute right-0 size-8 opacity-0 group-hover/item:opacity-100' size='icon' variant='ghost'>
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' side='right'>
            <DropdownMenuItem onSelect={() => setShowEditDialog(true)}>
              <Pencil />
              {t('edit')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onClone(chat.id)}>
              <Copy />
              {t('clone')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onToggleBookmark(chat.id)}>
              <Bookmark className={chat.isBookmarked ? 'fill-current' : ''} />
              {chat.isBookmarked ? t('unbookmark') : t('bookmark')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onDelete(chat.id)}>
              <Trash className='text-red-600' />
              <span className='text-red-600'>{t('delete')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <RenameChat
        initialTitle={chat.title}
        onOpenChange={setShowEditDialog}
        onSave={title => onEdit(chat.id, title)}
        open={showEditDialog}
      />
    </>
  )
}

export default ChatItem
