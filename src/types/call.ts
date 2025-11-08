export type Sentiment = 'Positive' | 'Neutral' | 'Negative'

export type ProcessingStatus = 'Ready' | 'Processing' | 'Failed'

export interface CallRecord {
  id: string
  title: string
  account: string
  contact: string
  owner: string
  summary: string
  nextSteps: string[]
  sentiment: Sentiment
  objections: string[]
  actionItems: string[]
  tags: string[]
  sentimentScore: number
  status: ProcessingStatus
  transcriptSource: 'upload' | 'paste'
  transcriptName?: string
  durationMinutes?: number
  createdAt: string
  updatedAt: string
}

export interface TranscriptMetadata {
  title: string
  account: string
  contact: string
  owner: string
  source: 'upload' | 'paste'
  sourceName?: string
}

export interface TranscriptSubmission {
  transcript: string
  metadata: TranscriptMetadata
}

export interface SheetSettings {
  sheetId: string
  worksheetName: string
  shareEmail: string
  autoSync: boolean
  syncFrequency: 'manual' | 'hourly' | 'daily'
}

export type IntegrationStatus = 'connected' | 'warning' | 'error'

export interface IntegrationHealth {
  status: IntegrationStatus
  message: string
  lastChecked: string
  latencyMs: number
}
