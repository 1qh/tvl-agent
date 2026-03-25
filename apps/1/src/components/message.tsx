'use client'

import type { Vote } from '@a/db/schema'
import type { ToolUIPart } from 'ai'

import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from '@a/ui/ai-elements/tool'

import type { ChatMessage } from '~/types'

import { useDataStream } from './data-stream-provider'
import Actions from './message-actions'
import MessageReasoning from './message-reasoning'
import MessageTextPart from './message-text-part'
import PreviewAttachment from './preview-attachment'

interface PreviewMessageProps {
  chatId: string
  isLoading: boolean
  isReadonly: boolean
  message: ChatMessage
  vote?: Vote
}

const PreviewMessage = ({ chatId, isLoading, isReadonly, message, vote }: PreviewMessageProps) => {
  const attachments = message.parts.filter(p => p.type === 'file')
  useDataStream()
  return (
    <>
      {attachments.length ? (
        <div className='flex justify-end gap-2'>
          {attachments.map(a => (
            <PreviewAttachment
              attachment={{ contentType: a.mediaType, name: a.filename ?? 'file', url: a.url }}
              key={a.url}
            />
          ))}
        </div>
      ) : null}
      {message.parts.map((part, index) => {
        const { type } = part,
          key = `${message.id}-part-${index}`
        if (type === 'reasoning' && part.text.trim().length > 0)
          return <MessageReasoning isLoading={isLoading} key={key} reasoning={part.text} />
        if (type === 'text')
          return (
            <MessageTextPart
              isLoading={isLoading}
              key={key}
              messageId={message.id}
              messageRole={message.role}
              text={part.text}
            />
          )
        if (type.startsWith('tool-')) {
          const p = part as unknown as {
              input: ToolUIPart['input']
              output: ToolUIPart['output']
              state: 'input-available' | 'output-available'
              toolCallId: string
            },
            { state, toolCallId } = p
          return (
            <Tool key={toolCallId}>
              <ToolHeader state={state} type={type as ToolUIPart['type']} />
              <ToolContent>
                <ToolInput input={p.input} />
                {state === 'output-available' && (
                  <ToolOutput
                    errorText={undefined}
                    output={
                      'error' in (p.output as { error: unknown }) ? (
                        <div className='rounded-sm border p-2 text-red-500'>
                          Error: {String((p.output as { error: unknown }).error)}
                        </div>
                      ) : (
                        JSON.stringify(p.output, null, 2)
                      )
                    }
                  />
                )}
              </ToolContent>
            </Tool>
          )
        }
        return null
      })}
      {!isReadonly && message.role !== 'user' && (
        <Actions chatId={chatId} isLoading={isLoading} key={`action-${message.id}`} message={message} vote={vote} />
      )}
    </>
  )
}

export default PreviewMessage
