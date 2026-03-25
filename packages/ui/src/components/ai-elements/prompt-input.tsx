// oxlint-disable prefer-await-to-then, always-return, no-nesting, exports-last, group-exports, prefer-add-event-listener
/** biome-ignore-all lint/nursery/noFloatingPromises: x */
'use client'

import type { ChatStatus, FileUIPart } from 'ai'
import type {
  ChangeEvent,
  ChangeEventHandler,
  ClipboardEventHandler,
  ComponentProps,
  FormEvent,
  FormEventHandler,
  HTMLAttributes,
  KeyboardEventHandler,
  PropsWithChildren,
  ReactNode,
  RefObject
} from 'react'

import { cn } from '@a/ui'
import { Button } from '@a/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@a/ui/command'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@a/ui/dropdown-menu'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@a/ui/hover-card'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from '@a/ui/input-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@a/ui/select'
import {
  CornerDownLeftIcon,
  ImageIcon,
  Loader2Icon,
  MicIcon,
  PaperclipIcon,
  PlusIcon,
  SquareIcon,
  XIcon
} from 'lucide-react'
import { nanoid } from 'nanoid'
import Image from 'next/image'
import { Children, createContext, Fragment, use, useCallback, useEffect, useMemo, useRef, useState } from 'react'

export interface AttachmentsContext {
  add: (files: File[] | FileList) => void
  clear: () => void
  fileInputRef: RefObject<HTMLInputElement | null>
  files: (FileUIPart & { id: string })[]
  openFileDialog: () => void
  remove: (id: string) => void
}

export interface PromptInputControllerProps {
  __registerFileInput: (ref: RefObject<HTMLInputElement | null>, open: () => void) => void
  attachments: AttachmentsContext
  textInput: TextInputContext
}

export interface TextInputContext {
  clear: () => void
  setInput: (v: string) => void
  value: string
}

const PromptInputContext = createContext<null | PromptInputControllerProps>(null),
  ProviderAttachmentsContext = createContext<AttachmentsContext | null>(null)

export const usePromptInputController = () => {
  const ctx = use(PromptInputContext)
  if (!ctx) throw new Error('Wrap your component inside <PromptInputProvider> to use usePromptInputController().')

  return ctx
}

const useOptionalPromptInputController = () => use(PromptInputContext)

export const useProviderAttachments = () => {
  const ctx = use(ProviderAttachmentsContext)
  if (!ctx) throw new Error('Wrap your component inside <PromptInputProvider> to use useProviderAttachments().')

  return ctx
}

const useOptionalProviderAttachments = () => use(ProviderAttachmentsContext)

export type PromptInputProviderProps = PropsWithChildren<{
  initialInput?: string
}>

export const PromptInputProvider = ({ children, initialInput: initialTextInput = '' }: PromptInputProviderProps) => {
  const [textInput, setTextInput] = useState(initialTextInput),
    clearInput = useCallback(() => setTextInput(''), []),
    [attachmentFiles, setAttachmentFiles] = useState<(FileUIPart & { id: string })[]>([]),
    fileInputRef = useRef<HTMLInputElement | null>(null),
    openRef = useRef<() => void>(() => {
      //
    }),
    add = useCallback((files: File[] | FileList) => {
      const incoming = [...files]
      if (incoming.length === 0) return

      setAttachmentFiles(prev => [
        ...prev,
        ...incoming.map(file => ({
          filename: file.name,
          id: nanoid(),
          mediaType: file.type,
          type: 'file' as const,
          url: URL.createObjectURL(file)
        }))
      ])
    }, []),
    remove = useCallback((id: string) => {
      setAttachmentFiles(prev => {
        const found = prev.find(f => f.id === id)
        if (found?.url) URL.revokeObjectURL(found.url)

        return prev.filter(f => f.id !== id)
      })
    }, []),
    clear = useCallback(() => {
      setAttachmentFiles(prev => {
        for (const f of prev) if (f.url) URL.revokeObjectURL(f.url)

        return []
      })
    }, []),
    attachmentsRef = useRef(attachmentFiles)
  // eslint-disable-next-line react-hooks/refs
  attachmentsRef.current = attachmentFiles

  useEffect(
    () => () => {
      for (const f of attachmentsRef.current) if (f.url) URL.revokeObjectURL(f.url)
    },
    []
  )

  const openFileDialog = useCallback(() => {
      openRef.current()
    }, []),
    attachments = useMemo<AttachmentsContext>(
      () => ({
        add,
        clear,
        fileInputRef,
        files: attachmentFiles,
        openFileDialog,
        remove
      }),
      [attachmentFiles, add, remove, clear, openFileDialog]
    ),
    __registerFileInput = useCallback((ref: RefObject<HTMLInputElement | null>, open: () => void) => {
      fileInputRef.current = ref.current
      openRef.current = open
    }, []),
    controller = useMemo<PromptInputControllerProps>(
      () => ({
        __registerFileInput,
        attachments,
        textInput: {
          clear: clearInput,
          setInput: setTextInput,
          value: textInput
        }
      }),
      [textInput, clearInput, attachments, __registerFileInput]
    )

  return (
    <PromptInputContext value={controller}>
      <ProviderAttachmentsContext value={attachments}>{children}</ProviderAttachmentsContext>
    </PromptInputContext>
  )
}

const LocalAttachmentsContext = createContext<AttachmentsContext | null>(null)

export const usePromptInputAttachments = () => {
  const provider = useOptionalProviderAttachments(),
    local = use(LocalAttachmentsContext),
    context = provider ?? local
  if (!context) throw new Error('usePromptInputAttachments must be used within a PromptInput or PromptInputProvider')

  return context
}

export type PromptInputActionAddAttachmentsProps = ComponentProps<typeof DropdownMenuItem> & {
  label?: string
}

export type PromptInputAttachmentProps = HTMLAttributes<HTMLDivElement> & {
  className?: string
  data: FileUIPart & { id: string }
}

export type PromptInputAttachmentsProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  children: (attachment: FileUIPart & { id: string }) => ReactNode
}

export const PromptInputAttachment = ({ className, data, ...props }: PromptInputAttachmentProps) => {
  const attachments = usePromptInputAttachments(),
    filename = data.filename ?? '',
    mediaType = data.mediaType.startsWith('image/') && data.url ? 'image' : 'file',
    isImage = mediaType === 'image',
    attachmentLabel = filename || (isImage ? 'Image' : 'Attachment')

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div
          className={cn(
            'group relative flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border px-1.5 text-sm font-medium transition-all select-none hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
            className
          )}
          key={data.id}
          {...props}>
          <div className='relative size-5 shrink-0'>
            <div className='absolute inset-0 flex size-5 items-center justify-center overflow-hidden rounded-sm bg-background transition-opacity group-hover:opacity-0'>
              {isImage ? (
                <Image
                  alt={filename || 'attachment'}
                  className='size-5 object-cover'
                  height={20}
                  src={data.url}
                  width={20}
                />
              ) : (
                <div className='flex size-5 items-center justify-center text-muted-foreground'>
                  <PaperclipIcon className='size-3' />
                </div>
              )}
            </div>
            <Button
              aria-label='Remove attachment'
              className='absolute inset-0 size-5 cursor-pointer rounded-sm p-0 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 [&>svg]:size-2.5'
              onClick={e => {
                e.stopPropagation()
                attachments.remove(data.id)
              }}
              type='button'
              variant='ghost'>
              <XIcon />
              <span className='sr-only'>Remove</span>
            </Button>
          </div>

          <span className='flex-1 truncate'>{attachmentLabel}</span>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className='w-auto p-2'>
        <div className='w-auto space-y-3'>
          {isImage ? (
            <div className='flex max-h-96 w-96 items-center justify-center overflow-hidden rounded-md border'>
              <Image
                alt={filename || 'attachment preview'}
                className='max-h-full max-w-full object-contain'
                height={384}
                src={data.url}
                width={448}
              />
            </div>
          ) : null}
          <div className='flex items-center gap-2.5'>
            <div className='min-w-0 flex-1 space-y-1 px-0.5'>
              <h4 className='truncate text-sm leading-none font-semibold'>
                {filename || (isImage ? 'Image' : 'Attachment')}
              </h4>
              {data.mediaType ? (
                <p className='truncate font-mono text-xs text-muted-foreground'>{data.mediaType}</p>
              ) : null}
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

export const PromptInputAttachments = ({ children, className, ...props }: PromptInputAttachmentsProps) => {
  const attachments = usePromptInputAttachments()

  if (!attachments.files.length) return null

  return (
    <div className={cn('flex w-full flex-wrap items-center gap-2 p-3', className)} {...props}>
      {attachments.files.map(file => (
        <Fragment key={file.id}>{children(file)}</Fragment>
      ))}
    </div>
  )
}

export const PromptInputActionAddAttachments = ({
  label = 'Add photos or files',
  ...props
}: PromptInputActionAddAttachmentsProps) => {
  const attachments = usePromptInputAttachments()

  return (
    <DropdownMenuItem
      {...props}
      onSelect={e => {
        e.preventDefault()
        attachments.openFileDialog()
      }}>
      <ImageIcon className='mr-2 size-4' /> {label}
    </DropdownMenuItem>
  )
}

export interface PromptInputMessage {
  files: FileUIPart[]
  text: string
}

export type PromptInputProps = Omit<HTMLAttributes<HTMLFormElement>, 'onError' | 'onSubmit'> & {
  accept?: string
  globalDrop?: boolean
  maxFiles?: number
  maxFileSize?: number
  multiple?: boolean
  onError?: (err: { code: 'accept' | 'max_file_size' | 'max_files'; message: string }) => void
  onSubmit: (message: PromptInputMessage, event: FormEvent<HTMLFormElement>) => Promise<void> | void
  syncHiddenInput?: boolean
}

const convertBlobUrlToDataUrl = async (url: string): Promise<null | string> => {
  try {
    const response = await fetch(url),
      blob = await response.blob()
    return await new Promise(resolve => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

export const PromptInput = ({
  accept,
  children,
  className,
  globalDrop,
  maxFiles,
  maxFileSize,
  multiple,
  onError,
  onSubmit,
  syncHiddenInput,
  ...props
}: PromptInputProps) => {
  // eslint-disable-next-line @typescript-eslint/non-nullable-type-assertion-style
  const controller = useOptionalPromptInputController() as PromptInputControllerProps,
    usingProvider = Boolean(controller),
    inputRef = useRef<HTMLInputElement | null>(null),
    formRef = useRef<HTMLFormElement | null>(null),
    [items, setItems] = useState<(FileUIPart & { id: string })[]>([]),
    files = usingProvider ? controller.attachments.files : items,
    filesRef = useRef(files)
  // eslint-disable-next-line react-hooks/refs
  filesRef.current = files

  const openFileDialogLocal = useCallback(() => {
      inputRef.current?.click()
    }, []),
    matchesAccept = useCallback(
      (f: File) => {
        if (!accept || accept.trim() === '') return true

        const patterns = accept
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)

        return patterns.some(pattern => {
          if (pattern.endsWith('/*')) {
            const prefix = pattern.slice(0, -1)
            return f.type.startsWith(prefix)
          }
          return f.type === pattern
        })
      },
      [accept]
    ),
    addLocal = useCallback(
      (fileList: File[] | FileList) => {
        const incoming = [...fileList],
          accepted = incoming.filter(f => matchesAccept(f))
        if (incoming.length && accepted.length === 0) {
          onError?.({
            code: 'accept',
            message: 'No files match the accepted types.'
          })
          return
        }
        const withinSize = (f: File) => (maxFileSize ? f.size <= maxFileSize : true),
          sized = accepted.filter(withinSize)
        if (accepted.length > 0 && sized.length === 0) {
          onError?.({
            code: 'max_file_size',
            message: 'All files exceed the maximum size.'
          })
          return
        }

        setItems(prev => {
          const capacity = typeof maxFiles === 'number' ? Math.max(0, maxFiles - prev.length) : undefined,
            capped = typeof capacity === 'number' ? sized.slice(0, capacity) : sized
          if (typeof capacity === 'number' && sized.length > capacity)
            onError?.({
              code: 'max_files',
              message: 'Too many files. Some were not added.'
            })

          const next: (FileUIPart & { id: string })[] = []
          for (const file of capped)
            next.push({
              filename: file.name,
              id: nanoid(),
              mediaType: file.type,
              type: 'file',
              url: URL.createObjectURL(file)
            })

          return [...prev, ...next]
        })
      },
      [matchesAccept, maxFiles, maxFileSize, onError]
    ),
    removeLocal = useCallback(
      (id: string) =>
        setItems(prev => {
          const found = prev.find(file => file.id === id)
          if (found?.url) URL.revokeObjectURL(found.url)

          return prev.filter(file => file.id !== id)
        }),
      []
    ),
    clearLocal = useCallback(
      () =>
        setItems(prev => {
          for (const file of prev) if (file.url) URL.revokeObjectURL(file.url)

          return []
        }),
      []
    ),
    add = usingProvider ? controller.attachments.add : addLocal,
    remove = usingProvider ? controller.attachments.remove : removeLocal,
    clear = usingProvider ? controller.attachments.clear : clearLocal,
    openFileDialog = usingProvider ? controller.attachments.openFileDialog : openFileDialogLocal

  useEffect(() => {
    if (!usingProvider) return
    controller.__registerFileInput(inputRef, () => inputRef.current?.click())
  }, [usingProvider, controller])

  useEffect(() => {
    if (syncHiddenInput && inputRef.current && files.length === 0) inputRef.current.value = ''
  }, [files, syncHiddenInput])

  useEffect(() => {
    const form = formRef.current
    if (!form) return
    if (globalDrop) return

    const onDragOver = (e: DragEvent) => {
        if (e.dataTransfer?.types.includes('Files')) e.preventDefault()
      },
      onDrop = (e: DragEvent) => {
        if (e.dataTransfer?.types.includes('Files')) e.preventDefault()

        if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) add(e.dataTransfer.files)
      }
    form.addEventListener('dragover', onDragOver)
    form.addEventListener('drop', onDrop)
    return () => {
      form.removeEventListener('dragover', onDragOver)
      form.removeEventListener('drop', onDrop)
    }
  }, [add, globalDrop])

  useEffect(() => {
    if (!globalDrop) return

    const onDragOver = (e: DragEvent) => {
        if (e.dataTransfer?.types.includes('Files')) e.preventDefault()
      },
      onDrop = (e: DragEvent) => {
        if (e.dataTransfer?.types.includes('Files')) e.preventDefault()

        if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) add(e.dataTransfer.files)
      }
    document.addEventListener('dragover', onDragOver)
    document.addEventListener('drop', onDrop)
    return () => {
      document.removeEventListener('dragover', onDragOver)
      document.removeEventListener('drop', onDrop)
    }
  }, [add, globalDrop])

  useEffect(
    () => () => {
      if (!usingProvider) for (const f of filesRef.current) if (f.url) URL.revokeObjectURL(f.url)
    },

    [usingProvider]
  )

  const handleChange: ChangeEventHandler<HTMLInputElement> = event => {
      if (event.currentTarget.files) add(event.currentTarget.files)

      event.currentTarget.value = ''
    },
    ctx = useMemo<AttachmentsContext>(
      () => ({
        add,
        clear,
        fileInputRef: inputRef,
        files: files.map(item => ({ ...item, id: item.id })),
        openFileDialog,
        remove
      }),
      [files, add, remove, clear, openFileDialog]
    ),
    handleSubmit: FormEventHandler<HTMLFormElement> = event => {
      event.preventDefault()

      const form = event.currentTarget,
        text = usingProvider
          ? controller.textInput.value
          : (() => {
              const formData = new FormData(form)
              return (formData.get('message') as string) || ''
            })()

      if (!usingProvider) form.reset()

      Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        files.map(async ({ id, ...item }) => {
          if (item.url.startsWith('blob:')) {
            const dataUrl = await convertBlobUrlToDataUrl(item.url)
            return {
              ...item,
              url: dataUrl ?? item.url
            }
          }
          return item
        })
      )
        .then((convertedFiles: FileUIPart[]) => {
          try {
            const result = onSubmit({ files: convertedFiles, text }, event)

            if (result instanceof Promise)
              result
                .then(() => {
                  clear()
                  if (usingProvider) controller.textInput.clear()
                })
                .catch(() => {
                  //
                })
            else {
              clear()
              if (usingProvider) controller.textInput.clear()
            }
          } catch {
            //
          }
        })
        .catch(() => {
          //
        })
    },
    inner = (
      <>
        <input
          accept={accept}
          aria-label='Upload files'
          className='hidden'
          multiple={multiple}
          onChange={handleChange}
          ref={inputRef}
          title='Upload files'
          type='file'
        />
        <form className={cn('w-full', className)} onSubmit={handleSubmit} ref={formRef} {...props}>
          <InputGroup className='overflow-hidden'>{children}</InputGroup>
        </form>
      </>
    )

  return usingProvider ? inner : <LocalAttachmentsContext value={ctx}>{inner}</LocalAttachmentsContext>
}

export type PromptInputBodyProps = HTMLAttributes<HTMLDivElement>

export const PromptInputBody = ({ className, ...props }: PromptInputBodyProps) => (
  <div className={cn('contents', className)} {...props} />
)

export type PromptInputTextareaProps = ComponentProps<typeof InputGroupTextarea>

export const PromptInputTextarea = ({
  className,
  onChange,
  placeholder = 'What would you like to know?',
  ...props
}: PromptInputTextareaProps) => {
  const controller = useOptionalPromptInputController(),
    attachments = usePromptInputAttachments(),
    [isComposing, setIsComposing] = useState(false),
    // eslint-disable-next-line max-statements
    handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = e => {
      if (e.key === 'Enter') {
        if (isComposing || e.nativeEvent.isComposing) return

        if (e.shiftKey) return

        e.preventDefault()

        const { form } = e.currentTarget,
          submitButton = form?.querySelector('button[type="submit"]') as HTMLButtonElement | null
        if (submitButton?.disabled) return

        form?.requestSubmit()
      }

      if (e.key === 'Backspace' && e.currentTarget.value === '' && attachments.files.length > 0) {
        e.preventDefault()
        const lastAttachment = attachments.files.at(-1)
        if (lastAttachment) attachments.remove(lastAttachment.id)
      }
    },
    handlePaste: ClipboardEventHandler<HTMLTextAreaElement> = event => {
      const { items } = event.clipboardData

      if (!items.length) return

      const files: File[] = []

      for (const item of items)
        if (item.kind === 'file') {
          const file = item.getAsFile()
          if (file) files.push(file)
        }

      if (files.length > 0) {
        event.preventDefault()
        attachments.add(files)
      }
    },
    controlledProps = controller
      ? {
          onChange: (e: ChangeEvent<HTMLTextAreaElement>) => {
            controller.textInput.setInput(e.currentTarget.value)
            onChange?.(e)
          },
          value: controller.textInput.value
        }
      : {
          onChange
        }

  return (
    <InputGroupTextarea
      className={cn('field-sizing-content max-h-48 min-h-16', className)}
      name='message'
      onCompositionEnd={() => setIsComposing(false)}
      onCompositionStart={() => setIsComposing(true)}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      placeholder={placeholder}
      {...props}
      {...controlledProps}
    />
  )
}

export type PromptInputHeaderProps = Omit<ComponentProps<typeof InputGroupAddon>, 'align'>

export const PromptInputHeader = ({ className, ...props }: PromptInputHeaderProps) => (
  <InputGroupAddon align='block-end' className={cn('order-first flex-wrap gap-1', className)} {...props} />
)

export type PromptInputFooterProps = Omit<ComponentProps<typeof InputGroupAddon>, 'align'>

export const PromptInputFooter = ({ className, ...props }: PromptInputFooterProps) => (
  <InputGroupAddon align='block-end' className={cn('justify-between gap-1', className)} {...props} />
)

export type PromptInputToolsProps = HTMLAttributes<HTMLDivElement>

export const PromptInputTools = ({ className, ...props }: PromptInputToolsProps) => (
  <div className={cn('flex items-center gap-1', className)} {...props} />
)

export type PromptInputButtonProps = ComponentProps<typeof InputGroupButton>

export const PromptInputButton = ({ className, size, variant = 'ghost', ...props }: PromptInputButtonProps) => {
  const newSize = size ?? (Children.count(props.children) > 1 ? 'sm' : 'icon-sm')

  return <InputGroupButton className={cn(className)} size={newSize} type='button' variant={variant} {...props} />
}

export type PromptInputActionMenuProps = ComponentProps<typeof DropdownMenu>
export const PromptInputActionMenu = (props: PromptInputActionMenuProps) => <DropdownMenu {...props} />

export type PromptInputActionMenuTriggerProps = PromptInputButtonProps

export const PromptInputActionMenuTrigger = ({ children, className, ...props }: PromptInputActionMenuTriggerProps) => (
  <DropdownMenuTrigger asChild>
    <PromptInputButton className={className} {...props}>
      {children ?? <PlusIcon className='size-4' />}
    </PromptInputButton>
  </DropdownMenuTrigger>
)

export type PromptInputActionMenuContentProps = ComponentProps<typeof DropdownMenuContent>
export const PromptInputActionMenuContent = ({ className, ...props }: PromptInputActionMenuContentProps) => (
  <DropdownMenuContent align='start' className={cn(className)} {...props} />
)

export type PromptInputActionMenuItemProps = ComponentProps<typeof DropdownMenuItem>
export const PromptInputActionMenuItem = ({ className, ...props }: PromptInputActionMenuItemProps) => (
  <DropdownMenuItem className={cn(className)} {...props} />
)

export type PromptInputSubmitProps = ComponentProps<typeof InputGroupButton> & {
  status?: ChatStatus
}

export const PromptInputSubmit = ({
  children,
  className,
  size = 'icon-sm',
  status,
  variant = 'default',
  ...props
}: PromptInputSubmitProps) => {
  let Icon = <CornerDownLeftIcon className='size-4' />

  if (status === 'submitted') Icon = <Loader2Icon className='size-4 animate-spin' />
  else if (status === 'streaming') Icon = <SquareIcon className='size-4' />
  else if (status === 'error') Icon = <XIcon className='size-4' />

  return (
    <InputGroupButton aria-label='Submit' className={cn(className)} size={size} type='submit' variant={variant} {...props}>
      {children ?? Icon}
    </InputGroupButton>
  )
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onend: ((this: SpeechRecognition, ev: Event) => unknown) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => unknown) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => unknown) | null
  onstart: ((this: SpeechRecognition, ev: Event) => unknown) | null
  start: () => void
  stop: () => void
}

interface SpeechRecognitionAlternative {
  confidence: number
  transcript: string
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
  item: (index: number) => SpeechRecognitionAlternative
  readonly length: number
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult
  item: (index: number) => SpeechRecognitionResult
  readonly length: number
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

export type PromptInputSpeechButtonProps = ComponentProps<typeof PromptInputButton> & {
  onTranscriptionChange?: (text: string) => void
  textareaRef?: RefObject<HTMLTextAreaElement | null>
}

export const PromptInputSpeechButton = ({
  className,
  onTranscriptionChange,
  textareaRef,
  ...props
}: PromptInputSpeechButtonProps) => {
  const [isListening, setIsListening] = useState(false),
    [recognition, setRecognition] = useState<null | SpeechRecognition>(null),
    recognitionRef = useRef<null | SpeechRecognition>(null)

  // eslint-disable-next-line max-statements
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      const SpeechRecog = window.SpeechRecognition || window.webkitSpeechRecognition,
        speechRecognition = new SpeechRecog()

      speechRecognition.continuous = true
      speechRecognition.interimResults = true
      speechRecognition.lang = 'en-US'

      speechRecognition.onstart = () => {
        setIsListening(true)
      }

      speechRecognition.onend = () => {
        setIsListening(false)
      }

      speechRecognition.onresult = event => {
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i]
          if (result?.isFinal) finalTranscript += result[0]?.transcript ?? ''
        }

        if (finalTranscript.length && textareaRef?.current) {
          const textarea = textareaRef.current,
            currentValue = textarea.value,
            newValue = currentValue + (currentValue ? ' ' : '') + finalTranscript

          textarea.value = newValue
          textarea.dispatchEvent(new Event('input', { bubbles: true }))
          onTranscriptionChange?.(newValue)
        }
      }

      speechRecognition.onerror = event => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }

      recognitionRef.current = speechRecognition
      setRecognition(speechRecognition)
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop()
    }
  }, [textareaRef, onTranscriptionChange])

  const toggleListening = useCallback(() => {
    if (!recognition) return

    if (isListening) recognition.stop()
    else recognition.start()
  }, [recognition, isListening])

  return (
    <PromptInputButton
      className={cn(
        'relative transition-all duration-200',
        isListening && 'animate-pulse bg-accent text-accent-foreground',
        className
      )}
      disabled={!recognition}
      onClick={toggleListening}
      {...props}>
      <MicIcon className='size-4' />
    </PromptInputButton>
  )
}

export type PromptInputSelectProps = ComponentProps<typeof Select>

export const PromptInputSelect = (props: PromptInputSelectProps) => <Select {...props} />

export type PromptInputSelectTriggerProps = ComponentProps<typeof SelectTrigger>

export const PromptInputSelectTrigger = ({ className, ...props }: PromptInputSelectTriggerProps) => (
  <SelectTrigger
    className={cn(
      'border-none bg-transparent font-medium text-muted-foreground shadow-none transition-colors',
      'hover:bg-accent hover:text-foreground aria-expanded:bg-accent aria-expanded:text-foreground',
      className
    )}
    {...props}
  />
)

export type PromptInputSelectContentProps = ComponentProps<typeof SelectContent>

export const PromptInputSelectContent = ({ className, ...props }: PromptInputSelectContentProps) => (
  <SelectContent className={cn(className)} {...props} />
)

export type PromptInputSelectItemProps = ComponentProps<typeof SelectItem>

export const PromptInputSelectItem = ({ className, ...props }: PromptInputSelectItemProps) => (
  <SelectItem className={cn(className)} {...props} />
)

export type PromptInputSelectValueProps = ComponentProps<typeof SelectValue>

export const PromptInputSelectValue = ({ className, ...props }: PromptInputSelectValueProps) => (
  <SelectValue className={cn(className)} {...props} />
)

export type PromptInputHoverCardProps = ComponentProps<typeof HoverCard>

export const PromptInputHoverCard = ({ closeDelay = 0, openDelay = 0, ...props }: PromptInputHoverCardProps) => (
  <HoverCard closeDelay={closeDelay} openDelay={openDelay} {...props} />
)

export type PromptInputHoverCardTriggerProps = ComponentProps<typeof HoverCardTrigger>

export const PromptInputHoverCardTrigger = (props: PromptInputHoverCardTriggerProps) => <HoverCardTrigger {...props} />

export type PromptInputHoverCardContentProps = ComponentProps<typeof HoverCardContent>

export const PromptInputHoverCardContent = ({ align = 'start', ...props }: PromptInputHoverCardContentProps) => (
  <HoverCardContent align={align} {...props} />
)

export type PromptInputTabsListProps = HTMLAttributes<HTMLDivElement>

export const PromptInputTabsList = ({ className, ...props }: PromptInputTabsListProps) => (
  <div className={cn(className)} {...props} />
)

export type PromptInputTabProps = HTMLAttributes<HTMLDivElement>

export const PromptInputTab = ({ className, ...props }: PromptInputTabProps) => (
  <div className={cn(className)} {...props} />
)

export type PromptInputTabBodyProps = HTMLAttributes<HTMLDivElement>

export const PromptInputTabBody = ({ className, ...props }: PromptInputTabBodyProps) => (
  <div className={cn('space-y-1', className)} {...props} />
)

export type PromptInputTabItemProps = HTMLAttributes<HTMLDivElement>

export const PromptInputTabItem = ({ className, ...props }: PromptInputTabItemProps) => (
  <div className={cn('flex items-center gap-2 px-3 py-2 text-xs hover:bg-accent', className)} {...props} />
)

export type PromptInputCommandProps = ComponentProps<typeof Command>

export const PromptInputCommand = ({ className, ...props }: PromptInputCommandProps) => (
  <Command className={cn(className)} {...props} />
)

export type PromptInputCommandInputProps = ComponentProps<typeof CommandInput>

export const PromptInputCommandInput = ({ className, ...props }: PromptInputCommandInputProps) => (
  <CommandInput className={cn(className)} {...props} />
)

export type PromptInputCommandListProps = ComponentProps<typeof CommandList>

export const PromptInputCommandList = ({ className, ...props }: PromptInputCommandListProps) => (
  <CommandList className={cn(className)} {...props} />
)

export type PromptInputCommandEmptyProps = ComponentProps<typeof CommandEmpty>

export const PromptInputCommandEmpty = ({ className, ...props }: PromptInputCommandEmptyProps) => (
  <CommandEmpty className={cn(className)} {...props} />
)

export type PromptInputCommandGroupProps = ComponentProps<typeof CommandGroup>

export const PromptInputCommandGroup = ({ className, ...props }: PromptInputCommandGroupProps) => (
  <CommandGroup className={cn(className)} {...props} />
)

export type PromptInputCommandItemProps = ComponentProps<typeof CommandItem>

export const PromptInputCommandItem = ({ className, ...props }: PromptInputCommandItemProps) => (
  <CommandItem className={cn(className)} {...props} />
)

export type PromptInputCommandSeparatorProps = ComponentProps<typeof CommandSeparator>

export const PromptInputCommandSeparator = ({ className, ...props }: PromptInputCommandSeparatorProps) => (
  <CommandSeparator className={cn(className)} {...props} />
)
