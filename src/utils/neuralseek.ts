import type { Sentiment, TranscriptSubmission } from '../types'

interface NeuralSeekVariableMap {
  [key: string]: unknown
}

interface NeuralSeekVariablesExpanded {
  name: string
  value: unknown
}

interface NeuralSeekRawResponse {
  answer?: string
  sourceParts?: unknown[]
  render?: unknown[]
  variables?: NeuralSeekVariableMap
  variablesExpanded?: NeuralSeekVariablesExpanded[]
}

export interface NeuralSeekAgentResult {
  summary?: string
  nextSteps?: string[]
  actionItems?: string[]
  objections?: string[]
  tags?: string[]
  sentiment: {
    label: Sentiment
    score: number
  }
  durationMinutes?: number
}

const envBaseUrl = import.meta.env.VITE_NEURALSEEK_BASE_URL?.replace(/\/$/, '')
const envAgentName = import.meta.env.VITE_NEURALSEEK_AGENT
const envApiKey = import.meta.env.VITE_NEURALSEEK_API_KEY

export const isNeuralSeekConfigured = () =>
  Boolean(envBaseUrl && envAgentName && envApiKey)

const parseArrayValue = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map(String).map((entry) => entry.trim()).filter(Boolean)
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []

    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed.map(String).map((entry) => entry.trim()).filter(Boolean)
      }
    } catch {
      // Swallow JSON.parse errors and fall through to delimiter split.
    }

    return trimmed
      .split(/\r?\n|•|- |\u2022/g)
      .map((entry) => entry.replace(/^[\s-•]+/, '').trim())
      .filter(Boolean)
  }

  return []
}

const parseNumberValue = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (!Number.isNaN(parsed)) return parsed
  }
  return undefined
}

const parseSentimentValue = (value: unknown): { label: Sentiment; score: number } => {
  if (
    typeof value === 'object' &&
    value !== null &&
    'label' in value &&
    typeof (value as { label: unknown }).label === 'string'
  ) {
    const label = normalizeSentimentLabel((value as { label: string }).label)
    const score = parseNumberValue((value as { score?: unknown }).score) ?? defaultSentiment(label)
    return { label, score }
  }

  if (typeof value === 'string') {
    const label = normalizeSentimentLabel(value)
    const scoreMatch = value.match(/-?\d+(\.\d+)?/)
    const score =
      (scoreMatch ? Number(scoreMatch[0]) : undefined) ?? defaultSentiment(label)
    return { label, score }
  }

  return { label: 'Neutral', score: 0 }
}

const normalizeSentimentLabel = (input: string): Sentiment => {
  const lower = input.toLowerCase()
  if (lower.includes('positive')) return 'Positive'
  if (lower.includes('negative')) return 'Negative'
  if (lower.includes('neutral')) return 'Neutral'
  return 'Neutral'
}

const defaultSentiment = (label: Sentiment) => {
  if (label === 'Positive') return 0.6
  if (label === 'Negative') return -0.6
  return 0
}

const extractVariables = (response: NeuralSeekRawResponse): NeuralSeekVariableMap => {
  const combined: NeuralSeekVariableMap = { ...(response.variables ?? {}) }
  for (const entry of response.variablesExpanded ?? []) {
    combined[entry.name] = entry.value
  }
  return combined
}

const buildParams = (submission: TranscriptSubmission) => {
  const { metadata } = submission
  return [
    { name: 'callTranscript', value: submission.transcript },
    { name: 'callTitle', value: metadata.title ?? '' },
    { name: 'callAccount', value: metadata.account ?? '' },
    { name: 'callContact', value: metadata.contact ?? '' },
    { name: 'callOwner', value: metadata.owner ?? '' },
    { name: 'callSource', value: metadata.source },
    { name: 'callSourceName', value: metadata.sourceName ?? '' },
    {
      name: 'callMetadata',
      value: JSON.stringify(metadata),
    },
  ]
}

const normalizeSummary = (
  variables: NeuralSeekVariableMap,
  fallback?: string,
  answer?: string,
) => {
  const summaryCandidate =
    variables.summary ??
    variables.callSummary ??
    variables.executiveSummary ??
    answer

  if (typeof summaryCandidate === 'string' && summaryCandidate.trim()) {
    return summaryCandidate.trim()
  }

  return fallback
}

export const runNeuralSeekAgent = async (
  submission: TranscriptSubmission,
): Promise<NeuralSeekAgentResult> => {
  if (!isNeuralSeekConfigured()) {
    throw new Error('NeuralSeek env variables are not configured.')
  }

  const requestBody = {
    ntl: '',
    agent: envAgentName,
    params: buildParams(submission),
    options: {
      streaming: false,
      user_id: submission.metadata.owner || 'AutoNotesUser',
      lastTurn: [],
    },
    returnVariables: true,
    returnVariablesExpanded: true,
    returnRender: false,
    returnSource: false,
    maxRecursion: 10,
  }

  const response = await fetch(`${envBaseUrl}/maistro`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${envApiKey}`,
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(
      `NeuralSeek request failed with ${response.status}: ${detail || 'Unknown error'}`,
    )
  }

  const raw = (await response.json()) as NeuralSeekRawResponse
  const variables = extractVariables(raw)

  const normalizeArray = (value: unknown) => {
    const parsed = parseArrayValue(value)
    return parsed.length ? parsed : undefined
  }

  return {
    summary: normalizeSummary(variables, undefined, raw.answer),
    nextSteps: normalizeArray(
      variables.nextSteps ?? variables.nextsteps ?? variables.followUps,
    ),
    actionItems: normalizeArray(
      variables.actionItems ?? variables.actionitems ?? variables.nextSteps,
    ),
    objections: normalizeArray(
      variables.objections ?? variables.concerns ?? variables.risks,
    ),
    tags: normalizeArray(variables.tags ?? variables.labels),
    sentiment: parseSentimentValue(
      variables.sentiment ?? variables.sentimentAnalysis,
    ),
    durationMinutes:
      parseNumberValue(
        variables.durationMinutes ?? variables.estimatedDurationMinutes,
      ) ?? undefined,
  }
}
