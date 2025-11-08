import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { mockCalls } from '../data/mockCalls'
import type {
  CallRecord,
  IntegrationHealth,
  SheetSettings,
  TranscriptSubmission,
} from '../types'
import { buildCallRecord } from '../utils/transcript'
import { downloadCsv, serializeCallsToCsv } from '../utils/csv'

interface CallsContextValue {
  calls: CallRecord[]
  isProcessing: boolean
  sheetSettings: SheetSettings
  integrationHealth: IntegrationHealth
  processTranscript: (input: TranscriptSubmission) => Promise<CallRecord>
  getCallById: (id: string) => CallRecord | undefined
  exportCalls: () => void
  updateSheetSettings: (updates: Partial<SheetSettings>) => void
  triggerHealthCheck: () => Promise<void>
}

const defaultSettings: SheetSettings = {
  sheetId: '1A2B3C4D5E6F7G8H9I',
  worksheetName: 'Auto Notes',
  shareEmail: 'revops@autonotes.team',
  autoSync: true,
  syncFrequency: 'hourly',
}

const defaultHealth: IntegrationHealth = {
  status: 'connected',
  message: 'Ready to sync with Google Sheets',
  lastChecked: new Date().toISOString(),
  latencyMs: 210,
}

const CallsContext = createContext<CallsContextValue | undefined>(undefined)

export const CallsProvider = ({ children }: { children: ReactNode }) => {
  const [calls, setCalls] = useState<CallRecord[]>(mockCalls)
  const [isProcessing, setIsProcessing] = useState(false)
  const [sheetSettings, setSheetSettings] =
    useState<SheetSettings>(defaultSettings)
  const [integrationHealth, setIntegrationHealth] =
    useState<IntegrationHealth>(defaultHealth)

  const getCallById = useCallback(
    (id: string) => calls.find((call) => call.id === id),
    [calls],
  )

  const processTranscript = useCallback(
    async (input: TranscriptSubmission) => {
      setIsProcessing(true)
      try {
        const record = await buildCallRecord(input)
        setCalls((prev) => [record, ...prev])
        return record
      } finally {
        setIsProcessing(false)
      }
    },
    [],
  )

  const exportCalls = useCallback(() => {
    const csv = serializeCallsToCsv(calls)
    downloadCsv(csv, 'auto-notes-calls.csv')
  }, [calls])

  const updateSheetSettings = useCallback((updates: Partial<SheetSettings>) => {
    setSheetSettings((prev) => ({ ...prev, ...updates }))
  }, [])

  const triggerHealthCheck = useCallback(async () => {
    setIntegrationHealth((prev) => ({
      ...prev,
      status: 'warning',
      message: 'Running diagnostics...',
      lastChecked: new Date().toISOString(),
    }))
    await new Promise((resolve) => setTimeout(resolve, 800))
    const latency = Math.floor(200 + Math.random() * 120)
    setIntegrationHealth({
      status: latency < 290 ? 'connected' : 'warning',
      message:
        latency < 290
          ? 'Google Sheets API responding normally'
          : 'Sheets API responding slower than usual',
      lastChecked: new Date().toISOString(),
      latencyMs: latency,
    })
  }, [])

  const value = useMemo(
    () => ({
      calls,
      isProcessing,
      sheetSettings,
      integrationHealth,
      processTranscript,
      getCallById,
      exportCalls,
      updateSheetSettings,
      triggerHealthCheck,
    }),
    [
      calls,
      exportCalls,
      getCallById,
      integrationHealth,
      isProcessing,
      processTranscript,
      sheetSettings,
      triggerHealthCheck,
      updateSheetSettings,
    ],
  )

  return <CallsContext.Provider value={value}>{children}</CallsContext.Provider>
}

export const useCalls = () => {
  const context = useContext(CallsContext)
  if (!context) {
    throw new Error('useCalls must be used within a CallsProvider')
  }
  return context
}
