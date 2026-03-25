import { tool } from 'ai'
import { array, object, string } from 'zod/v4'

import { search } from '~/lib/tavily'

export default tool({
  description: 'High-precision web search tool to find relevant and up-to-date information from the internet.',
  execute: async ({ include_domains, query }) => {
    try {
      const response = await search(query, {
        include_domains: include_domains?.length ? include_domains : undefined,
        max_results: 7,
        search_depth: 'advanced',
        time_range: 'year'
      })
      return response
    } catch (error) {
      return { error }
    }
  },
  inputSchema: object({
    include_domains: array(string()).describe('Optional allow-list of domains to focus search on').optional(),
    query: string().describe('Search query')
  })
})
