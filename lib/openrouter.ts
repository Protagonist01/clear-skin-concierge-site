const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini'
const DEFAULT_OPENROUTER_MAX_ATTEMPTS = 1
const DEFAULT_OPENROUTER_TIMEOUT_MS = 12000

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_call_id?: string
  tool_calls?: OpenRouterToolCall[]
}

export interface OpenRouterToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export interface OpenRouterToolDefinition {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

interface OpenRouterOptions {
  messages: OpenRouterMessage[]
  max_tokens?: number
  response_format?: { type: 'json_object' }
  tools?: OpenRouterToolDefinition[]
  tool_choice?: 'auto' | 'none'
}

interface OpenRouterCompletionResult {
  content: string
  message?: OpenRouterMessage
  tool_calls?: OpenRouterToolCall[]
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
  raw: unknown
}

function wait(milliseconds: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

function getPositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value || '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function createTimeoutSignal(timeoutMs: number) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  return {
    signal: controller.signal,
    cancel: () => clearTimeout(timer),
  }
}

async function postOpenRouter(payload: Record<string, unknown>, headers: Record<string, string>) {
  let lastError: unknown
  const maxAttempts = getPositiveInteger(process.env.OPENROUTER_MAX_ATTEMPTS, DEFAULT_OPENROUTER_MAX_ATTEMPTS)
  const timeoutMs = getPositiveInteger(process.env.OPENROUTER_TIMEOUT_MS, DEFAULT_OPENROUTER_TIMEOUT_MS)

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const timeout = createTimeoutSignal(timeoutMs)

    try {
      const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: timeout.signal,
      })

      if (response.ok || (response.status < 500 && response.status !== 429)) {
        return response
      }

      lastError = new Error(`OpenRouter transient error ${response.status}: ${await response.text()}`)
    } catch (error) {
      lastError = timeout.signal.aborted
        ? new Error(`OpenRouter request timed out after ${timeoutMs}ms`)
        : error
    } finally {
      timeout.cancel()
    }

    if (attempt < maxAttempts) {
      await wait(450 * attempt)
    }
  }

  throw lastError instanceof Error ? lastError : new Error('OpenRouter request failed')
}

export async function openRouterChatCompletion({
  messages,
  max_tokens = 400,
  response_format,
  tools,
  tool_choice,
}: OpenRouterOptions): Promise<OpenRouterCompletionResult> {
  const apiKey = process.env.OPENROUTER_API_KEY

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set')
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  }

  if (process.env.OPENROUTER_SITE_URL) {
    headers['HTTP-Referer'] = process.env.OPENROUTER_SITE_URL
  }

  if (process.env.OPENROUTER_APP_NAME) {
    headers['X-OpenRouter-Title'] = process.env.OPENROUTER_APP_NAME
  }

  const response = await postOpenRouter({
    model: OPENROUTER_MODEL,
    max_tokens,
    response_format,
    tools,
    tool_choice,
    messages,
  }, headers)

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenRouter error ${response.status}: ${errorText}`)
  }

  const data = await response.json()
  const message = data.choices?.[0]?.message
  return {
    content: message?.content ?? '',
    message,
    tool_calls: message?.tool_calls,
    usage: data.usage,
    raw: data,
  }
}

export async function openRouterChat({ messages, max_tokens = 400, response_format, tools, tool_choice }: OpenRouterOptions) {
  const completion = await openRouterChatCompletion({
    messages,
    max_tokens,
    response_format,
    tools,
    tool_choice,
  })

  return completion.content
}

export async function openRouterChatCompletionStream({
  messages,
  max_tokens = 500,
  response_format,
}: OpenRouterOptions): Promise<Response> {
  const apiKey = process.env.OPENROUTER_API_KEY

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set')
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  }

  if (process.env.OPENROUTER_SITE_URL) {
    headers['HTTP-Referer'] = process.env.OPENROUTER_SITE_URL
  }

  if (process.env.OPENROUTER_APP_NAME) {
    headers['X-OpenRouter-Title'] = process.env.OPENROUTER_APP_NAME
  }

  return fetch(OPENROUTER_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      max_tokens,
      response_format,
      messages,
      stream: true,
    }),
  })
}
