import type {
  CallRecord,
  Sentiment,
  TranscriptSubmission,
} from '../types'
import { isCallNotesAgentConfigured, runCallNotesAgent } from './neuralseek'

const positiveWords = ['win', 'great', 'excited', 'happy', 'value', 'success']
const negativeWords = ['concern', 'risk', 'delay', 'blocker', 'issue', 'problem']

const objectionTriggers = [
  'pricing',
  'timeline',
  'security',
  'support',
  'integration',
]

const defaultNextSteps = [
  'Send meeting recap with next steps',
  'Confirm stakeholders for follow-up',
  'Schedule next checkpoint',
]

const createId = () =>
  typeof globalThis !== 'undefined' &&
  globalThis.crypto &&
  'randomUUID' in globalThis.crypto
    ? globalThis.crypto.randomUUID()
    : `call-${Math.random().toString(36).slice(2, 8)}`

const splitSentences = (text: string) =>
  text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)

const detectSentiment = (text: string): { sentiment: Sentiment; score: number } => {
  const lower = text.toLowerCase()
  const positivity =
    positiveWords.reduce(
      (score, word) => (lower.includes(word) ? score + 1 : score),
      0,
    ) || 0
  const negativity =
    negativeWords.reduce(
      (score, word) => (lower.includes(word) ? score + 1 : score),
      0,
    ) || 0
  const score = positivity - negativity

  if (score >= 2) return { sentiment: 'Positive', score: 0.8 }
  if (score <= -1) return { sentiment: 'Negative', score: -0.4 }
  return { sentiment: 'Neutral', score: 0.2 }
}

const deriveNextSteps = (sentences: string[]) => {
  const steps = sentences
    .filter((sentence) => /need|action|follow|next/i.test(sentence))
    .map((sentence) => sentence.replace(/(^-?\s*)/g, '').trim())

  if (steps.length >= 2) return steps.slice(0, 4)
  return defaultNextSteps
}

const deriveObjections = (text: string) => {
  const lower = text.toLowerCase()
  const matches = objectionTriggers
    .filter((keyword) => lower.includes(keyword))
    .map(
      (keyword) =>
        `Client raised a concern regarding ${keyword.toUpperCase()} requirements`,
    )

  if (matches.length > 0) return matches
  return ['No critical objections captured.']
}

const deriveTags = (record: TranscriptSubmission['metadata'], text: string) => {
  const tags = [record.account, record.owner].filter(Boolean)
  if (/renewal|renew/i.test(text)) tags.push('Renewal')
  if (/onboard|launch/i.test(text)) tags.push('Onboarding')
  if (/risk|escalation/i.test(text)) tags.push('Escalation')
  return [...new Set(tags)]
}

export const buildCallFromTranscript = (
  submission: TranscriptSubmission,
): CallRecord => {
  const { transcript, metadata } = submission
  const sentences = splitSentences(transcript)
  const summary =
    sentences.slice(0, 3).join(' ') ||
    'Transcript processed successfully. No summary available.'
  const nextSteps = deriveNextSteps(sentences)
  const objections = deriveObjections(transcript)
  const { sentiment, score } = detectSentiment(transcript)
  const now = new Date().toISOString()

  return {
    id: createId(),
    title: metadata.title || 'Untitled Call',
    account: metadata.account || 'General',
    contact: metadata.contact || 'Unknown contact',
    owner: metadata.owner || 'Unassigned',
    summary,
    nextSteps,
    objections,
    sentiment,
    actionItems: [
      'Log call in CRM with AI-generated summary',
      'Align with account team on risk owners',
    ],
    tags: deriveTags(metadata, transcript),
    sentimentScore: score,
    status: 'Ready',
    transcriptSource: metadata.source,
    transcriptName: metadata.sourceName,
    durationMinutes: Math.max(15, Math.round(sentences.length / 2)),
    createdAt: now,
    updatedAt: now,
  }
}
export const buildCallFromNeuralSeek = async (
  submission: TranscriptSubmission,
): Promise<CallRecord> => {
  const fallbackRecord = buildCallFromTranscript(submission)
  const neuralSeekData = await runCallNotesAgent(submission)

  const mergeTags = () => {
    if (!neuralSeekData.tags?.length) return fallbackRecord.tags
    const combined = new Set([...neuralSeekData.tags, ...fallbackRecord.tags])
    return Array.from(combined)
  }

  const isNeuralSeekSentimentDefault =
    neuralSeekData.sentiment.label === 'Neutral' &&
    neuralSeekData.sentiment.score === 0

  return {
    ...fallbackRecord,
    summary: neuralSeekData.summary ?? fallbackRecord.summary,
    nextSteps: neuralSeekData.nextSteps ?? fallbackRecord.nextSteps,
    actionItems: neuralSeekData.actionItems ?? fallbackRecord.actionItems,
    objections: neuralSeekData.objections ?? fallbackRecord.objections,
    tags: mergeTags(),

    sentiment: isNeuralSeekSentimentDefault
      ? fallbackRecord.sentiment
      : neuralSeekData.sentiment.label,
      
    sentimentScore: isNeuralSeekSentimentDefault
      ? fallbackRecord.sentimentScore
      : neuralSeekData.sentiment.score,
      
    durationMinutes:
      neuralSeekData.durationMinutes ?? fallbackRecord.durationMinutes,
  }
}

export const buildCallRecord = async (submission: TranscriptSubmission) => {
  if (!isCallNotesAgentConfigured()) {
    return buildCallFromTranscript(submission)
  }
  return buildCallFromNeuralSeek(submission)
}
