interface OpenRouterChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenRouterChatOptions {
  apiKey: string
  model: string
  messages: OpenRouterChatMessage[]
}

export async function runOpenRouterChat(opts: OpenRouterChatOptions): Promise<string> {
  const apiKey = opts.apiKey.trim()
  if (!apiKey) {
    throw new Error('OpenRouter API key is missing. Add it in AI Models or Settings.')
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/Vindicter/vindicter',
      'X-Title': 'Vindicter',
    },
    body: JSON.stringify({
      model: opts.model || 'openai/gpt-4.1-mini',
      messages: opts.messages,
      temperature: 0.4,
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(detail || `OpenRouter returned HTTP ${response.status}`)
  }

  const data = await response.json()
  const text = data?.choices?.[0]?.message?.content
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('OpenRouter returned an empty response.')
  }

  return text
}
