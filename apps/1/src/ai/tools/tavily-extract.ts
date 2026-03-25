import { tool } from 'ai'
import { array, object, url } from 'zod/v4'

import { extract } from '~/lib/tavily'

export default tool({
  description:
    'Extract and clean full content from selected URLs for synthesis. Use after search when deeper reading is needed or user input website URLs.',
  execute: async ({ urls }) => {
    try {
      const response = await extract(urls, { extract_depth: 'advanced' })
      return response
    } catch (error) {
      return { error }
    }
  },
  inputSchema: object({ urls: array(url()).min(1).describe('URLs to extract content from') })
})
