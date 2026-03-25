/* eslint-disable complexity, max-statements, @typescript-eslint/no-misused-promises */
'use client'
import type { UseChatHelpers } from '@ai-sdk/react'
import type { UIMessage } from 'ai'
import type { ChangeEvent, Dispatch, RefObject, SetStateAction } from 'react'
import type { AppUsage } from 'types'

import { cn } from '@a/ui'
import { Context, ContextContent, ContextTrigger } from '@a/ui/ai-elements/context'
import {
  PromptInput,
  PromptInputSelectTrigger,
  PromptInputSpeechButton,
  PromptInputSubmit,
  PromptInputTextarea
} from '@a/ui/ai-elements/prompt-input'
import { Button } from '@a/ui/button'
import { InputGroupAddon } from '@a/ui/input-group'
import { Progress } from '@a/ui/progress'
import { Select, SelectContent, SelectItem, SelectValue } from '@a/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@a/ui/tooltip'
import equal from 'fast-deep-equal'
import { Paperclip, StopCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { memo, startTransition, useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import type { Attachment, ChatMessage } from '~/types'

import { saveChatModelAsCookie } from '~/actions'
import { chatModels } from '~/ai/models'

import type { VisibilityType } from './visibility-selector'

import PreviewAttachment from './preview-attachment'

const MAX_TOKENS = 65_536,
  USAGE_WARNING_THRESHOLD = 0.8,
  TEXT_FILE_EXTENSIONS = new Set([
    'bash',
    'bat',
    'c',
    'cc',
    'cjs',
    'cmd',
    'conf',
    'cpp',
    'cs',
    'css',
    'csv',
    'cxx',
    'env',
    'fish',
    'go',
    'gql',
    'graphql',
    'h',
    'hpp',
    'htm',
    'html',
    'ini',
    'java',
    'js',
    'json',
    'jsonl',
    'jsx',
    'kt',
    'kts',
    'less',
    'log',
    'm',
    'markdown',
    'md',
    'mjs',
    'mm',
    'ndjson',
    'php',
    'proto',
    'ps1',
    'py',
    'rb',
    'rs',
    'sass',
    'scss',
    'sh',
    'sql',
    'swift',
    'toml',
    'ts',
    'tsv',
    'tsx',
    'txt',
    'xml',
    'yaml',
    'yml',
    'zsh'
  ]),
  TEXT_FILE_NAMES = new Set(['dockerfile', 'makefile']),
  TEXT_FILE_MIME_TYPES = new Set([
    'application/graphql',
    'application/javascript',
    'application/json',
    'application/sql',
    'application/typescript',
    'application/x-httpd-php',
    'application/x-javascript',
    'application/x-python-code',
    'application/x-ruby',
    'application/x-sh',
    'application/x-yaml',
    'application/xml',
    'application/yaml'
  ]),
  getFileExtension = (filename: string) => {
    const lastDot = filename.lastIndexOf('.')
    return lastDot === -1 ? '' : filename.slice(lastDot + 1)
  },
  isTextFile = (file: File) => {
    const type = file.type.toLowerCase()
    if (type.startsWith('text/')) return true
    if (TEXT_FILE_MIME_TYPES.has(type)) return true
    const name = file.name.toLowerCase()
    if (TEXT_FILE_NAMES.has(name)) return true
    const ext = getFileExtension(name)
    return ext ? TEXT_FILE_EXTENSIONS.has(ext) : false
  },
  splitFilesByType = (files: File[]) => {
    const textFiles: File[] = [],
      uploadableFiles: File[] = []
    for (const file of files)
      if (isTextFile(file)) textFiles.push(file)
      else uploadableFiles.push(file)
    return { textFiles, uploadableFiles }
  }

interface AttachmentsButtonProps {
  fileInputRef: RefObject<HTMLInputElement | null>
  selectedModelId: string
  status: UseChatHelpers<ChatMessage>['status']
}

const AttachmentsButton = ({ fileInputRef, selectedModelId, status }: AttachmentsButtonProps) => {
  const t = useTranslations()

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          disabled={status !== 'ready' || selectedModelId === 'reasoning-model'}
          onClick={e => {
            e.preventDefault()
            fileInputRef.current?.click()
          }}
          size='icon'
          variant='ghost'>
          <Paperclip />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{t('attachFile')}</TooltipContent>
    </Tooltip>
  )
}

interface ModelselectorCompactProps {
  onModelChange?: (modelId: string) => void
  selectedModelId: string
}

const ModelSelectorCompact = ({ onModelChange, selectedModelId }: ModelselectorCompactProps) => {
  const [optimisticModelId, setOptimisticModelId] = useState(selectedModelId),
    t = useTranslations()
  useEffect(() => {
    setOptimisticModelId(selectedModelId)
  }, [selectedModelId])
  const selectedModel = chatModels.find(m => m.id === optimisticModelId)
  return (
    <Select
      onValueChange={modelName => {
        const model = chatModels.find(m => m.name === modelName)
        if (model) {
          setOptimisticModelId(model.id)
          onModelChange?.(model.id)
          startTransition(() => {
            saveChatModelAsCookie(model.id)
          })
        }
      }}
      value={selectedModel?.name}>
      <PromptInputSelectTrigger className='gap-0 dark:bg-transparent [&>span]:text-[0px]'>
        <SelectValue />
      </PromptInputSelectTrigger>
      <SelectContent>
        {chatModels.map(m => (
          <SelectItem className='text-xs text-muted-foreground' key={m.id} value={m.name}>
            <span className='text-sm text-foreground'>{t(m.name)}</span>
            {t(m.description)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

interface CustomContextHeaderProps {
  usedTokens: number
}

const CustomContextHeader = ({ usedTokens }: CustomContextHeaderProps) => {
  const t = useTranslations(),
    usedPercent = usedTokens / MAX_TOKENS
  return (
    <div className='w-full space-y-2 p-3 pt-2'>
      <div className='flex items-center justify-between gap-3'>
        <p>{new Intl.NumberFormat('en-US', { maximumFractionDigits: 1, style: 'percent' }).format(usedPercent)}</p>
        {usedTokens}/{MAX_TOKENS} tokens
      </div>
      <div className='space-y-2'>
        <Progress value={usedPercent * 100} />
        {usedPercent > USAGE_WARNING_THRESHOLD ? <p className='text-xs text-amber-600'>{t('usageWarning')}</p> : null}
      </div>
    </div>
  )
}

interface MultimodalInputProps {
  attachments: Attachment[]
  autoFocus?: boolean
  chatId: string
  className?: string
  input: string
  isAnonymous?: boolean
  messages: UIMessage[]
  onModelChange?: (modelId: string) => void
  selectedModelId: string
  selectedVisibilityType: VisibilityType
  sendMessage: UseChatHelpers<ChatMessage>['sendMessage']
  setAttachments: Dispatch<SetStateAction<Attachment[]>>
  setInput: Dispatch<SetStateAction<string>>
  setMessages: UseChatHelpers<ChatMessage>['setMessages']
  status: UseChatHelpers<ChatMessage>['status']
  stop: () => void
  usage?: AppUsage
}

const PureMultimodalInput = ({
  attachments,
  autoFocus = true,
  chatId,
  className,
  input,
  isAnonymous,
  messages,
  onModelChange,
  selectedModelId,
  selectedVisibilityType,
  sendMessage,
  setAttachments,
  setInput,
  setMessages,
  status,
  stop,
  usage
}: MultimodalInputProps) => {
  console.log(selectedVisibilityType)
  const router = useRouter(),
    goToLogin = () => router.push('/login'),
    textareaRef = useRef<HTMLTextAreaElement>(null),
    t = useTranslations(),
    [isDragging, setIsDragging] = useState(false),
    fileInputRef = useRef<HTMLInputElement>(null),
    [uploadQueue, setUploadQueue] = useState<string[]>([]),
    submitForm = useCallback(() => {
      if (!input.trim() && attachments.length === 0) return
      if (isAnonymous) {
        const userMessageCount = messages.filter(m => m.role === 'user').length,
          hasAssistantMessages = messages.some(m => m.role === 'assistant')
        if (userMessageCount >= 1 && !hasAssistantMessages) {
          goToLogin()
          return
        }
      }
      globalThis.history.pushState({}, '', `/chat/${chatId}`)
      sendMessage({
        parts: [
          ...attachments.map(a => ({
            mediaType: a.contentType,
            name: a.name,
            type: 'file' as const,
            url: a.url
          })),
          { text: input, type: 'text' }
        ],
        role: 'user'
      })
      setAttachments([])
      setInput('')
    }, [input, setInput, attachments, sendMessage, setAttachments, chatId, isAnonymous, messages]),
    uploadFile = useCallback(async (file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      try {
        const response = await fetch('/api/files/upload', { body: fd, method: 'POST' })
        if (response.ok) {
          const data = (await response.json()) as {
              contentType: string
              pathname: string
              url: string
            },
            { contentType, pathname, url } = data
          return { contentType, name: pathname, url }
        }
        const { error } = (await response.json()) as { error: string }
        toast.error(error)
      } catch {
        toast.error('Failed to upload file, please try again!')
      }
    }, []),
    readTextFiles = useCallback(
      async (files: File[]) => {
        try {
          const contents = await Promise.all(files.map(async file => file.text())),
            combined = contents.filter(text => text.length > 0).join('\n\n')
          if (combined.length > 0) {
            setInput(prev => (prev ? `${prev}\n\n${combined}` : combined))
            textareaRef.current?.focus()
          }
        } catch {
          toast.error('Failed to read text file(s)')
        }
      },
      [setInput]
    ),
    handleFiles = useCallback(
      async (files: File[]) => {
        const { textFiles, uploadableFiles } = splitFilesByType(files)
        if (textFiles.length) await readTextFiles(textFiles)
        if (!uploadableFiles.length) return
        if (isAnonymous) {
          toast.error(t('loginToUploadAttachments'))
          goToLogin()
          return
        }
        setUploadQueue(uploadableFiles.map(f => f.name))
        try {
          const uploadPromises = uploadableFiles.map(async f => uploadFile(f)),
            uploadedAttachments = await Promise.all(uploadPromises),
            successfullyUploadedAttachments = uploadedAttachments.filter(a => a !== undefined)
          setAttachments(a => [...a, ...successfullyUploadedAttachments])
        } catch {
          //
        } finally {
          setUploadQueue([])
        }
      },
      [isAnonymous, readTextFiles, setAttachments, uploadFile, t]
    ),
    handleFileChange = useCallback(
      async (e: ChangeEvent<HTMLInputElement>) => {
        const files = [...(e.target.files ?? [])]
        if (!files.length) return
        await handleFiles(files)
        if (fileInputRef.current) fileInputRef.current.value = ''
      },
      [handleFiles]
    ),
    handleDrop = useCallback(
      async (e: React.DragEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsDragging(false)
        const files = [...e.dataTransfer.files]
        if (!files.length) return
        await handleFiles(files)
      },
      [handleFiles]
    ),
    handlePaste = useCallback(
      async (event: ClipboardEvent) => {
        const items = event.clipboardData?.items
        if (!items) return
        const files = [...items].filter(i => i.type.startsWith('image/'))
        if (!files.length) return
        if (isAnonymous) {
          event.preventDefault()
          toast.error(t('loginToUploadAttachments'))
          goToLogin()
          return
        }
        event.preventDefault()
        setUploadQueue(prev => [...prev, 'Pasted image'])
        try {
          const uploadPromises = files
              .map(f => f.getAsFile())
              .filter((f): f is File => f !== null)
              .map(async f => uploadFile(f)),
            uploadedAttachments = await Promise.all(uploadPromises),
            successfullyUploadedAttachments = uploadedAttachments.filter(a => a !== undefined)
          setAttachments(curr => [...curr, ...successfullyUploadedAttachments])
        } catch (error) {
          console.error('Error uploading pasted images:', error)
          toast.error('Failed to upload pasted image(s)')
        } finally {
          setUploadQueue([])
        }
      },
      [isAnonymous, setAttachments, t, uploadFile]
    )
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.addEventListener('paste', handlePaste)
    return () => textarea.removeEventListener('paste', handlePaste)
  }, [handlePaste])
  const usg = {
      ...usage,
      inputTokenDetails: usage?.inputTokenDetails ?? {
        cacheReadTokens: undefined,
        cacheWriteTokens: undefined,
        noCacheTokens: undefined
      },
      inputTokens: usage?.inputTokens ?? 0,
      outputTokenDetails: usage?.outputTokenDetails ?? {
        reasoningTokens: undefined,
        textTokens: undefined
      },
      outputTokens: usage?.outputTokens ?? 0,
      totalTokens: (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0)
    },
    usedTokens = usg.inputTokens + usg.outputTokens
  return (
    <>
      <input
        className='pointer-events-none fixed -top-4 -left-4 size-0.5 opacity-0'
        multiple
        onChange={handleFileChange}
        ref={fileInputRef}
        tabIndex={-1}
        type='file'
      />
      <PromptInput
        className={cn(
          'rounded-2xl bg-muted *:rounded-xl',
          messages.length === 0 && 'mt-3',
          isDragging && 'ring-2 ring-primary',
          className
        )}
        onDragLeave={() => setIsDragging(false)}
        onDragOver={e => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDrop={handleDrop}
        onSubmit={(_, e) => {
          e.preventDefault()
          if (status === 'ready') submitForm()
          else toast.error('Please wait for the model to finish its response!')
        }}>
        {attachments.length > 0 || uploadQueue.length > 0 ? (
          <div className='mt-3.5 flex w-full gap-2 px-3'>
            {attachments.map(as => (
              <PreviewAttachment
                attachment={as}
                key={as.url}
                onRemove={() => {
                  setAttachments(at => at.filter(a => a.url !== as.url))
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
              />
            ))}
            {uploadQueue.map(f => (
              <PreviewAttachment attachment={{ contentType: '', name: f, url: '' }} isUploading key={f} />
            ))}
          </div>
        ) : null}
        <PromptInputTextarea
          autoFocus={autoFocus}
          className='mt-0.5 px-4'
          onChange={e => setInput(e.target.value)}
          placeholder={t('sendMessagePlaceholder')}
          ref={textareaRef}
          rows={1}
          value={input}
        />
        <InputGroupAddon align='block-end' className='gap-0 px-1.5 pt-0 pb-1'>
          {messages.length ? null : (
            <ModelSelectorCompact onModelChange={onModelChange} selectedModelId={selectedModelId} />
          )}
          {usg.outputTokens ? (
            <Context maxTokens={MAX_TOKENS} modelId={usg.modelId} usage={usg} usedTokens={usedTokens}>
              <ContextTrigger />
              <ContextContent side='left' sideOffset={0}>
                <CustomContextHeader usedTokens={usedTokens} />
              </ContextContent>
            </Context>
          ) : null}
          <AttachmentsButton fileInputRef={fileInputRef} selectedModelId={selectedModelId} status={status} />
          <p className='grow' />
          <PromptInputSpeechButton onTranscriptionChange={setInput} textareaRef={textareaRef} />
          {status === 'submitted' ? (
            <Button
              onClick={e => {
                e.preventDefault()
                stop()
                setMessages(m => m)
              }}
              size='icon'
              variant='ghost'>
              <StopCircle />
            </Button>
          ) : (
            <PromptInputSubmit disabled={!input.trim() || uploadQueue.length > 0} status={status} variant='ghost' />
          )}
        </InputGroupAddon>
      </PromptInput>
    </>
  )
}

export default memo(PureMultimodalInput, (prevProps, nextProps) => {
  if (prevProps.input !== nextProps.input) return false
  if (prevProps.status !== nextProps.status) return false
  if (!equal(prevProps.attachments, nextProps.attachments)) return false
  if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) return false
  if (prevProps.selectedModelId !== nextProps.selectedModelId) return false
  return true
})
