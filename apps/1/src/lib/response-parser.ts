/* eslint-disable max-statements */
/** biome-ignore-all lint/performance/useTopLevelRegex: x */
import { randomId } from '~/utils'
const THINKING_START = ':::start_thinking:::',
  THINKING_END = ':::end_thinking:::',
  REPORT_START = ':::start_report:::',
  REPORT_END = ':::end_report:::',
  SHORT_END = ':::',
  H1_PATTERN = /^#\s+(?<title>.+)$/mu,
  CUSTOM_TAG_PATTERN = /^:::[a-zA-Z_][a-zA-Z0-9_]*:::/u
interface ParsedBlock {
  content: string
  position: number
  type: 'report' | 'text' | 'thinking'
}
interface ParsedReport {
  content: string
  id: string
  title: string
}
interface ParsedResponse {
  blocks: ParsedBlock[]
  hasPartialReport: boolean
  hasPartialThinking: boolean
  report?: ParsedReport
  thinking?: string
}
const extractTitle = (content: string): string => H1_PATTERN.exec(content)?.groups?.title?.trim() ?? 'Report',
  isStandaloneShortEnd = (text: string, pos: number): boolean => {
    const remaining = text.slice(pos)
    if (
      remaining.startsWith(THINKING_START) ||
      remaining.startsWith(THINKING_END) ||
      remaining.startsWith(REPORT_START) ||
      remaining.startsWith(REPORT_END)
    )
      return false
    if (CUSTOM_TAG_PATTERN.test(remaining)) return false
    const afterMarker = remaining.slice(SHORT_END.length)
    if (afterMarker.length === 0) return true
    const [firstChar] = afterMarker
    if (!firstChar) return true
    return /[\s\n\r]/u.test(firstChar) || !/[a-zA-Z_]/u.test(firstChar)
  },
  findBlockEnd = (
    text: string,
    startPos: number,
    fullEndMarker: string,
    blockType: 'report' | 'thinking'
    // eslint-disable-next-line @typescript-eslint/max-params
  ): null | { continuePos: number; endPos: number } => {
    const fullEndPos = text.indexOf(fullEndMarker, startPos),
      nextThinkingStart = text.indexOf(THINKING_START, startPos),
      nextReportStart = text.indexOf(REPORT_START, startPos)
    let validShortEndPos = -1,
      searchPos = startPos
    while (searchPos < text.length) {
      const shortEndPos = text.indexOf(SHORT_END, searchPos)
      if (shortEndPos === -1) break
      if (isStandaloneShortEnd(text, shortEndPos)) {
        validShortEndPos = shortEndPos
        break
      }
      searchPos = shortEndPos + 1
    }
    const candidates: { continuePos: number; endPos: number }[] = []
    if (fullEndPos !== -1) candidates.push({ continuePos: fullEndPos + fullEndMarker.length, endPos: fullEndPos })
    if (validShortEndPos !== -1)
      candidates.push({ continuePos: validShortEndPos + SHORT_END.length, endPos: validShortEndPos })
    if (blockType === 'thinking' && nextThinkingStart !== -1)
      candidates.push({ continuePos: nextThinkingStart, endPos: nextThinkingStart })
    if (blockType === 'report' && nextReportStart !== -1)
      candidates.push({ continuePos: nextReportStart, endPos: nextReportStart })
    if (blockType === 'thinking' && nextReportStart !== -1)
      candidates.push({ continuePos: nextReportStart, endPos: nextReportStart })
    if (blockType === 'report' && nextThinkingStart !== -1)
      candidates.push({ continuePos: nextThinkingStart, endPos: nextThinkingStart })
    if (candidates.length === 0) return null
    candidates.sort((a, b) => a.endPos - b.endPos)
    return candidates[0] ?? null
  }
export const parseResponse = (text: string, existingReportId?: string): ParsedResponse => {
  const blocks: ParsedBlock[] = [],
    thinkingParts: string[] = []
  let report: ParsedReport | undefined,
    currentPos = 0,
    hasPartialThinking = false,
    hasPartialReport = false
  while (currentPos < text.length) {
    const thinkingStartPos = text.indexOf(THINKING_START, currentPos),
      reportStartPos = text.indexOf(REPORT_START, currentPos)
    let nextStartPos = -1,
      nextStartType: 'report' | 'thinking' | null = null
    if (thinkingStartPos !== -1 && (reportStartPos === -1 || thinkingStartPos < reportStartPos)) {
      nextStartPos = thinkingStartPos
      nextStartType = 'thinking'
    } else if (reportStartPos !== -1) {
      nextStartPos = reportStartPos
      nextStartType = 'report'
    }
    if (nextStartPos === -1) {
      const remainingText = text.slice(currentPos).trim()
      if (remainingText.length > 0)
        blocks.push({
          content: remainingText,
          position: currentPos,
          type: 'text'
        })
      break
    }
    if (currentPos < nextStartPos) {
      const textContent = text.slice(currentPos, nextStartPos).trim()
      if (textContent.length > 0)
        blocks.push({
          content: textContent,
          position: currentPos,
          type: 'text'
        })
    }
    if (nextStartType === 'thinking') {
      const contentStart = nextStartPos + THINKING_START.length,
        endMarker = findBlockEnd(text, contentStart, THINKING_END, 'thinking')
      if (endMarker) {
        const thinkingContent = text.slice(contentStart, endMarker.endPos).trim()
        if (thinkingContent.length > 0) {
          thinkingParts.push(thinkingContent)
          blocks.push({
            content: thinkingContent,
            position: contentStart,
            type: 'thinking'
          })
        }
        currentPos = endMarker.continuePos
      } else {
        hasPartialThinking = true
        const partialContent = text.slice(contentStart).trim()
        if (partialContent.length > 0) {
          thinkingParts.push(partialContent)
          blocks.push({
            content: partialContent,
            position: contentStart,
            type: 'thinking'
          })
        }
        break
      }
    } else if (nextStartType === 'report') {
      const contentStart = nextStartPos + REPORT_START.length,
        endMarker = findBlockEnd(text, contentStart, REPORT_END, 'report')
      if (endMarker) {
        const reportContent = text.slice(contentStart, endMarker.endPos).trim(),
          reportTitle = extractTitle(reportContent)
        report = {
          content: reportContent,
          id: existingReportId ?? randomId(),
          title: reportTitle
        }
        blocks.push({
          content: reportContent,
          position: contentStart,
          type: 'report'
        })
        currentPos = endMarker.continuePos
      } else {
        hasPartialReport = true
        const partialContent = text.slice(contentStart).trim()
        if (partialContent.length > 0) {
          const partialTitle = extractTitle(partialContent)
          report = {
            content: partialContent,
            id: existingReportId ?? randomId(),
            title: partialTitle
          }
          blocks.push({
            content: partialContent,
            position: contentStart,
            type: 'report'
          })
        }
        break
      }
    }
  }
  const thinking = thinkingParts.length > 0 ? thinkingParts.join('\n\n') : undefined
  return { blocks, hasPartialReport, hasPartialThinking, report, thinking }
}
export type { ParsedReport }
