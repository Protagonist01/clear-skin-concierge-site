const OPENAI_EMBEDDINGS_URL = 'https://api.openai.com/v1/embeddings'
const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small'
const DEFAULT_EMBEDDING_TIMEOUT_MS = 5000

interface EmbeddingResponse {
  data?: Array<{
    embedding?: number[]
    index?: number
  }>
  usage?: {
    prompt_tokens?: number
    total_tokens?: number
  }
}

export function hasEmbeddingCredentials() {
  return Boolean(process.env.OPENAI_API_KEY)
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

export async function createEmbeddings(input: string[]) {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set')
  }

  const model = process.env.OPENAI_EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL
  const configuredDimensions = Number.parseInt(
    process.env.OPENAI_EMBEDDING_DIMENSIONS || '',
    10,
  )
  const timeoutMs = getPositiveInteger(process.env.OPENAI_EMBEDDING_TIMEOUT_MS, DEFAULT_EMBEDDING_TIMEOUT_MS)
  const timeout = createTimeoutSignal(timeoutMs)

  let response: Response

  try {
    response = await fetch(OPENAI_EMBEDDINGS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input,
        encoding_format: 'float',
        ...(Number.isFinite(configuredDimensions) && configuredDimensions > 0
          ? { dimensions: configuredDimensions }
          : {}),
      }),
      signal: timeout.signal,
    })
  } catch (error) {
    throw timeout.signal.aborted
      ? new Error(`OpenAI embeddings request timed out after ${timeoutMs}ms`)
      : error
  } finally {
    timeout.cancel()
  }

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI embeddings error ${response.status}: ${errorText}`)
  }

  const payload = await response.json() as EmbeddingResponse
  const embeddings = (payload.data || [])
    .sort((a, b) => (a.index || 0) - (b.index || 0))
    .map((item) => item.embedding || [])

  if (embeddings.length !== input.length || embeddings.some((embedding) => !embedding.length)) {
    throw new Error('OpenAI embeddings response did not include all vectors')
  }

  return embeddings
}

export function dotProduct(a: number[], b: number[]) {
  const length = Math.min(a.length, b.length)
  let score = 0

  for (let index = 0; index < length; index += 1) {
    score += a[index] * b[index]
  }

  return score
}
