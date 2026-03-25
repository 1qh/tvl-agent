'use client'

import type { ComponentProps, HTMLAttributes } from 'react'
import type { BundledLanguage, ShikiTransformer } from 'shiki'

import { cn } from '@a/ui'
import { Button } from '@a/ui/button'
import { CheckIcon, CopyIcon } from 'lucide-react'
import { createContext, use, useEffect, useRef, useState } from 'react'
import { codeToHtml } from 'shiki'

interface CodeBlockContextType {
  code: string
}

type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
  code: string
  language: BundledLanguage
  showLineNumbers?: boolean
}

const CodeBlockContext = createContext<CodeBlockContextType>({
    code: ''
  }),
  lineNumberTransformer: ShikiTransformer = {
    line: (node, line) => {
      node.children.unshift({
        children: [{ type: 'text', value: String(line) }],
        properties: {
          className: ['inline-block', 'min-w-10', 'mr-4', 'text-right', 'select-none', 'text-muted-foreground']
        },
        tagName: 'span',
        type: 'element'
      })
    },
    name: 'line-numbers'
  }

export const highlightCode = async (code: string, language: BundledLanguage, showLineNumbers = false) => {
  const transformers: ShikiTransformer[] = showLineNumbers ? [lineNumberTransformer] : []

  return Promise.all([
    codeToHtml(code, {
      lang: language,
      theme: 'one-light',
      transformers
    }),
    codeToHtml(code, {
      lang: language,
      theme: 'one-dark-pro',
      transformers
    })
  ])
}

export const CodeBlock = ({ children, className, code, language, showLineNumbers = false, ...props }: CodeBlockProps) => {
  const [html, setHtml] = useState<string>(''),
    [darkHtml, setDarkHtml] = useState<string>(''),
    mounted = useRef(false)

  useEffect(() => {
    // oxlint-disable-next-line always-return, prefer-await-to-then, catch-or-return
    highlightCode(code, language, showLineNumbers).then(([light, dark]) => {
      if (!mounted.current) {
        setHtml(light)
        setDarkHtml(dark)
        mounted.current = true
      }
    })

    return () => {
      mounted.current = false
    }
  }, [code, language, showLineNumbers])

  return (
    <CodeBlockContext value={{ code }}>
      <div
        className={cn('group relative w-full overflow-hidden rounded-md border bg-background text-foreground', className)}
        {...props}>
        <div className='relative'>
          <div
            className='overflow-auto dark:hidden [&_code]:font-mono [&_code]:text-sm [&>pre]:m-0 [&>pre]:bg-background! [&>pre]:p-4 [&>pre]:text-sm [&>pre]:text-foreground!'
            // biome-ignore lint/security/noDangerouslySetInnerHtml: "this is needed."
            dangerouslySetInnerHTML={{ __html: html }}
          />
          <div
            className='hidden overflow-auto dark:block [&_code]:font-mono [&_code]:text-sm [&>pre]:m-0 [&>pre]:bg-background! [&>pre]:p-4 [&>pre]:text-sm [&>pre]:text-foreground!'
            // biome-ignore lint/security/noDangerouslySetInnerHtml: "this is needed."
            dangerouslySetInnerHTML={{ __html: darkHtml }}
          />
          {children ? <div className='absolute top-2 right-2 flex items-center gap-2'>{children}</div> : null}
        </div>
      </div>
    </CodeBlockContext>
  )
}

export type CodeBlockCopyButtonProps = ComponentProps<typeof Button> & {
  onCopy?: () => void
  onError?: (error: Error) => void
  timeout?: number
}

export const CodeBlockCopyButton = ({
  children,
  className,
  onCopy,
  onError,
  timeout = 2000,
  ...props
}: CodeBlockCopyButtonProps) => {
  const [isCopied, setIsCopied] = useState(false),
    { code } = use(CodeBlockContext),
    copyToClipboard = async () => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (typeof window === 'undefined' || !navigator?.clipboard?.writeText) {
        onError?.(new Error('Clipboard API not available'))
        return
      }

      try {
        await navigator.clipboard.writeText(code)
        setIsCopied(true)
        onCopy?.()
        setTimeout(() => setIsCopied(false), timeout)
      } catch (error) {
        onError?.(error as Error)
      }
    },
    Icon = isCopied ? CheckIcon : CopyIcon

  return (
    <Button className={cn('shrink-0', className)} onClick={copyToClipboard} size='icon' variant='ghost' {...props}>
      {children ?? <Icon size={14} />}
    </Button>
  )
}
