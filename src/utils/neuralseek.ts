import type { Sentiment, TranscriptSubmission } from '../types'

type NeuralSeekVariableMap = Record<string, unknown>

type NeuralSeekVariablesExpanded = {
  name: string
  value: unknown
}

type NeuralSeekRawResponse = {
  answer?: string
  sourceParts?: unknown[]
  render?: unknown[]
  variables?: NeuralSeekVariableMap
  variablesExpanded?: NeuralSeekVariablesExpanded[]
}

export interface CallAgentResult {
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

export interface FinancialHealthInput {
  companyName: string
  reportingPeriod?: string
  balanceSheet: string
  incomeStatement: string
  cashflowStatement: string
}

export interface FinancialHealthReport {
  companyName: string
  reportingPeriod?: string
  summary: string
  status: string
  score: number
  strengths: string[]
  risks: string[]
  recommendations: string[]
  liquiditySignal?: string
  profitabilitySignal?: string
  runwaySignal?: string
  rawAnswer?: string
}

const baseUrl = import.meta.env.VITE_NEURALSEEK_BASE_URL?.replace(/\/$/, '')
const callAgentName = import.meta.env.VITE_NEURALSEEK_AGENT
const finAgentName = import.meta.env.VITE_NEURALSEEK_FIN_AGENT
const apiKey = import.meta.env.VITE_NEURALSEEK_API_KEY

type AgentParams = Array<{ name: string; value: string }>

const isBaseConfigured = () => Boolean(baseUrl && apiKey)

export const isCallNotesAgentConfigured = () =>
  Boolean(isBaseConfigured() && callAgentName)

export const isFinancialAgentConfigured = () =>
  Boolean(isBaseConfigured() && finAgentName)

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
      // swallow json parse error and fall through
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
    const containsPercent = value.includes('%')
    const wrappedNegative = /^\s*\(/.test(value) && /\)\s*$/.test(value)
    const cleaned = value.replace(/[, $%()]/g, '').trim()
    if (!cleaned) return undefined
    const parsed = Number(cleaned)
    if (Number.isNaN(parsed)) return undefined
    const signedValue = wrappedNegative ? -parsed : parsed
    return containsPercent ? signedValue / 100 : signedValue
  }
  return undefined
}

const getStringValue = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined

const toDisplayString = (value: unknown): string | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toString()
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed ? trimmed : undefined
  }
  return undefined
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const normalizeVariableKeys = (input: NeuralSeekVariableMap): NeuralSeekVariableMap => {
  const normalized: NeuralSeekVariableMap = { ...input }
  for (const [key, value] of Object.entries(input)) {
    const lowerKey = key.toLowerCase()
    if (!(lowerKey in normalized)) {
      normalized[lowerKey] = value
    }
  }
  return normalized
}

const normalizeRecord = (value: unknown): NeuralSeekVariableMap | undefined => {
  if (!isRecord(value)) return undefined
  return normalizeVariableKeys(value as NeuralSeekVariableMap)
}

const stripFence = (input: string): string => {
  const trimmed = input.trim()
  const fencePattern = /^([`']{3})(?:\s*json)?\s*([\s\S]*?)\1$/i
  const match = trimmed.match(fencePattern)
  if (match) {
    return match[2].trim()
  }
  if (/^([`']{3})/i.test(trimmed)) {
    return trimmed.replace(/^([`']{3})(?:\s*json)?/i, '').trim()
  }
  return trimmed
}

const extractJsonObjectFromAnswer = (
  answer?: string,
): NeuralSeekVariableMap | undefined => {
  if (!answer || typeof answer !== 'string') return undefined
  const stripped = stripFence(answer)
  if (!stripped) return undefined

  const parseCandidate = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return undefined
    try {
      const parsed = JSON.parse(trimmed)
      return isRecord(parsed) ? (parsed as NeuralSeekVariableMap) : undefined
    } catch {
      return undefined
    }
  }

  const direct = parseCandidate(stripped)
  if (direct) return direct

  const firstBrace = stripped.indexOf('{')
  const lastBrace = stripped.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const inner = stripped.slice(firstBrace, lastBrace + 1)
    return parseCandidate(inner)
  }
  return undefined
}

const collectUniqueList = (...sources: unknown[]): string[] => {
  const seen = new Set<string>()
  for (const source of sources) {
    for (const entry of parseArrayValue(source)) {
      if (!seen.has(entry)) {
        seen.add(entry)
      }
    }
  }
  return Array.from(seen)
}

const pickFirstNumber = (...values: unknown[]): number | undefined => {
  for (const value of values) {
    const parsed = parseNumberValue(value)
    if (typeof parsed === 'number') return parsed
  }
  return undefined
}

const pickFirstString = (...values: unknown[]): string | undefined => {
  for (const value of values) {
    const parsed = getStringValue(value)
    if (parsed) return parsed
  }
  return undefined
}

const scoreFromGrade = (grade?: string): number | undefined => {
  if (!grade) return undefined
  const normalized = grade.trim().toUpperCase()
  const table: Record<string, number> = {
    'A+': 0.95,
    A: 0.9,
    'A-': 0.87,
    'B+': 0.82,
    B: 0.76,
    'B-': 0.72,
    'C+': 0.66,
    C: 0.58,
    'C-': 0.52,
    'D+': 0.46,
    D: 0.4,
    'D-': 0.35,
    E: 0.3,
    F: 0.2,
  }
  return table[normalized]
}

const statusFromGrade = (grade?: string): string | undefined => {
  if (!grade) return undefined
  const normalized = grade.trim().toUpperCase()
  if (normalized.startsWith('A')) return 'Strong'
  if (normalized.startsWith('B')) return 'Stable'
  if (normalized.startsWith('C')) return 'Watch'
  return 'At Risk'
}

const normalizeSentimentLabel = (input: string): Sentiment => {
  const lower = input.toLowerCase()
  if (lower.includes('positive')) return 'Positive'
  if (lower.includes('negative')) return 'Negative'
  if (lower.includes('neutral')) return 'Neutral'
  return 'Neutral'
}

const defaultSentimentScore = (label: Sentiment) => {
  if (label === 'Positive') return 0.6
  if (label === 'Negative') return -0.6
  return 0
}

const parseSentimentValue = (
  value: unknown,
): { label: Sentiment; score: number } => {
  if (
    typeof value === 'object' &&
    value !== null &&
    'label' in value &&
    typeof (value as { label: unknown }).label === 'string'
  ) {
    const label = normalizeSentimentLabel((value as { label: string }).label)
    const score =
      parseNumberValue((value as { score?: unknown }).score) ??
      defaultSentimentScore(label)
    return { label, score }
  }

  if (typeof value === 'string') {
    const label = normalizeSentimentLabel(value)
    const scoreMatch = value.match(/-?\d+(?:\.\d+)?/)
    const score =
      (scoreMatch ? Number(scoreMatch[0]) : undefined) ??
      defaultSentimentScore(label)
    return { label, score }
  }

  return { label: 'Neutral', score: 0 }
}

const extractVariables = (response: NeuralSeekRawResponse): NeuralSeekVariableMap => {
  const combined: NeuralSeekVariableMap = { ...(response.variables ?? {}) }
  for (const entry of response.variablesExpanded ?? []) {
    combined[entry.name] = entry.value
  }
  return combined
}

const callMaistro = async (
  agent: string | undefined,
  params: AgentParams,
  userId = 'AutoNotesUser',
): Promise<NeuralSeekRawResponse> => {
  if (!isBaseConfigured()) {
    throw new Error('NeuralSeek base URL or API key missing')
  }
  if (!agent) {
    throw new Error('NeuralSeek agent name is missing')
  }

  const response = await fetch(`${baseUrl}/maistro`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      ntl: '',
      agent,
      params,
      options: {
        streaming: false,
        user_id: userId,
        lastTurn: [],
      },
      returnVariables: true,
      returnVariablesExpanded: true,
      returnRender: false,
      returnSource: false,
      maxRecursion: 10,
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(
      `NeuralSeek request failed with ${response.status}: ${detail || 'Unknown error'}`,
    )
  }

  return (await response.json()) as NeuralSeekRawResponse
}

const buildCallParams = (submission: TranscriptSubmission): AgentParams => {
  const { metadata } = submission
  return [
    { name: 'callTranscript', value: submission.transcript },
    { name: 'callTitle', value: metadata.title ?? '' },
    { name: 'callAccount', value: metadata.account ?? '' },
    { name: 'callContact', value: metadata.contact ?? '' },
    { name: 'callOwner', value: metadata.owner ?? '' },
    { name: 'callSource', value: metadata.source },
    { name: 'callSourceName', value: metadata.sourceName ?? '' },
    { name: 'callMetadata', value: JSON.stringify(metadata) },
  ]
}

export const runCallNotesAgent = async (
  submission: TranscriptSubmission,
): Promise<CallAgentResult> => {
  const raw = await callMaistro(
    callAgentName,
    buildCallParams(submission),
    submission.metadata.owner || 'AutoNotesUser',
  )
  const variables = extractVariables(raw)

  const normalizeArray = (value: unknown) => {
    const parsed = parseArrayValue(value)
    return parsed.length ? parsed : undefined
  }

  return {
    summary: getStringValue(
      variables.summary ?? variables.callSummary ?? raw.answer,
    ),
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

const buildFinancialParams = (input: FinancialHealthInput): AgentParams => [
  { name: 'companyName', value: input.companyName },
  { name: 'reportingPeriod', value: input.reportingPeriod ?? '' },
  { name: 'balanceSheet', value: input.balanceSheet },
  { name: 'incomeStatement', value: input.incomeStatement },
  { name: 'cashflowStatement', value: input.cashflowStatement },
]

const deriveHealthStatus = (score: number | undefined, fallback?: string) => {
  if (fallback) return fallback
  if (typeof score !== 'number') return 'Unknown'
  if (score >= 0.75) return 'Strong'
  if (score >= 0.55) return 'Stable'
  if (score >= 0.35) return 'Watch'
  return 'At Risk'
}

export const runFinancialHealthAgent = async (
  input: FinancialHealthInput,
): Promise<FinancialHealthReport> => {
  const raw = await callMaistro(
    finAgentName,
    buildFinancialParams(input),
    input.companyName || 'FinanceUser',
  )
  const variables = normalizeVariableKeys({
    ...extractVariables(raw),
    ...(extractJsonObjectFromAnswer(raw.answer) ?? {}),
  })
  const keyRatios = normalizeRecord(variables.keyratios)
  const optionalInsights = normalizeRecord(
    variables.optionalinsights ?? variables.insights,
  )
  const futurePlan = normalizeRecord(
    optionalInsights?.futureplan ?? variables.futureplan,
  )

  const grade = pickFirstString(variables.healthgrade, variables.grade)
  const score =
    pickFirstNumber(
      variables.healthScore,
      variables.overallHealthScore,
      variables.healthscore,
      variables.overallhealthscore,
      variables.score,
    ) ?? scoreFromGrade(grade)
  const summary =
    pickFirstString(
      variables.healthSummary,
      variables.healthsummary,
      variables.summary,
      variables.overview,
      variables.analysis,
      raw.answer,
    ) ?? 'NeuralSeek did not return a summary.'

  const strengths = collectUniqueList(
    variables.strengths,
    variables.highlights,
    variables.positives,
    keyRatios?.strengths,
    optionalInsights?.strengths,
  )
  const risks = collectUniqueList(
    variables.risks,
    variables.riskalerts,
    variables.concerns,
    variables.weaknesses,
    optionalInsights?.financialredflags,
    optionalInsights?.redflags,
  )
  const recommendationSources = [
    variables.recommendations,
    variables.improvementactions,
    variables.nextsteps,
    optionalInsights?.recommendations,
  ]
  if (futurePlan) {
    recommendationSources.push(
      futurePlan.shorttermgoals,
      futurePlan.mediumtermgoals,
      futurePlan.longtermgoals,
    )
  }
  const recommendations = collectUniqueList(...recommendationSources)

  const liquidityFromRatios =
    toDisplayString(keyRatios?.currentratio) ??
    toDisplayString(keyRatios?.quickratio)
  const profitabilityFromRatios =
    toDisplayString(keyRatios?.netprofitmargin) ??
    toDisplayString(keyRatios?.operatingmargin) ??
    toDisplayString(keyRatios?.ebitdamargin)
  const runwayFromRatios =
    toDisplayString(keyRatios?.freecashflow) ??
    toDisplayString(optionalInsights?.runwaysignal)

  const explicitStatus = pickFirstString(
    variables.healthstatus,
    variables.status,
    variables.financialhealth,
  )
  const fallbackStatus = explicitStatus ?? statusFromGrade(grade)

  return {
    companyName: input.companyName,
    reportingPeriod: input.reportingPeriod,
    summary,
    status: deriveHealthStatus(
      score,
      fallbackStatus,
    ),
    score: typeof score === 'number' ? score : 0,
    strengths,
    risks,
    recommendations,
    liquiditySignal:
      getStringValue(
        variables.liquiditySignal ?? variables.liquidity ?? variables.cash,
      ) ||
      (liquidityFromRatios ? `Current ratio ${liquidityFromRatios}` : undefined),
    profitabilitySignal:
      getStringValue(
        variables.profitabilitySignal ??
          variables.profitability ??
          variables.marginTrend,
      ) ||
      (profitabilityFromRatios
        ? `Profitability ${profitabilityFromRatios}`
        : undefined),
    runwaySignal:
      getStringValue(
        variables.runwaySignal ?? variables.cashRunway ?? variables.burn,
      ) ||
      (runwayFromRatios ? `Free cash flow ${runwayFromRatios}` : undefined),
    rawAnswer: raw.answer,
  }
}

const splitLines = (input: string) =>
  input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

const extractNumberFromLine = (line: string): number | undefined => {
  const sanitized = line.replace(/[$€£,]/g, '')
  const match = sanitized.match(/-?\(?\d+(?:\.\d+)?\)?/)
  if (!match || match.index === undefined) return undefined

  const raw = match[0]
  let value = Number(raw.replace(/[()]/g, ''))
  if (raw.includes('(') && raw.includes(')')) value = -value
  if (!Number.isFinite(value)) return undefined

  const suffixContext = sanitized.slice(match.index + raw.length).toLowerCase()
  const prefixContext = sanitized.slice(0, match.index).toLowerCase()
  const context = `${prefixContext} ${suffixContext}`

  if (/\b(billion|bn)\b/.test(context)) {
    value *= 1_000_000_000
  } else if (/\b(million|mm|mn|millions)\b/.test(context)) {
    value *= 1_000_000
  } else if (/\b(thousand|k|thousands)\b/.test(context)) {
    value *= 1_000
  }

  return value
}

const findMetricValue = (text: string, keywords: string[]): number | undefined => {
  const lines = splitLines(text)
  for (const line of lines) {
    const lower = line.toLowerCase()
    if (keywords.some((keyword) => lower.includes(keyword))) {
      const value = extractNumberFromLine(line)
      if (typeof value === 'number') {
        return value
      }
    }
  }
  return undefined
}

const clampScore = (value: number) => Math.min(0.98, Math.max(0.05, value))

const formatCurrency = (value: number) => {
  const abs = Math.abs(value)
  let divisor = 1
  let suffix = ''

  if (abs >= 1_000_000_000) {
    divisor = 1_000_000_000
    suffix = 'B'
  } else if (abs >= 1_000_000) {
    divisor = 1_000_000
    suffix = 'M'
  } else if (abs >= 1_000) {
    divisor = 1_000
    suffix = 'K'
  }

  const scaled = abs / divisor
  const precision = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2
  const formatted = scaled.toFixed(precision)
  const sign = value < 0 ? '-' : ''

  return `${sign}$${formatted}${suffix}`
}

const estimateRunwayMonths = (cash: number | undefined, monthlyBurn: number | undefined) => {
  if (!cash || !monthlyBurn || monthlyBurn <= 0) return undefined
  return cash / monthlyBurn
}

export const buildMockFinancialReport = (
  input: FinancialHealthInput,
): FinancialHealthReport => {
  const balance = input.balanceSheet ?? ''
  const income = input.incomeStatement ?? ''
  const cashflow = input.cashflowStatement ?? ''

  const revenue = findMetricValue(income, ['total revenue', 'revenue', 'net sales'])
  const netIncome = findMetricValue(income, ['net income', 'profit', 'earnings'])
  const operatingExpenses = findMetricValue(income, [
    'operating expenses',
    'total operating expenses',
    'opex',
  ])

  const cash = findMetricValue(balance, [
    'cash and cash equivalents',
    'cash & equivalents',
    'cash balance',
    'cash',
  ])
  const currentAssets = findMetricValue(balance, [
    'current assets',
    'total current assets',
  ])
  const currentLiabilities = findMetricValue(balance, [
    'current liabilities',
    'total current liabilities',
  ])
  const totalDebt = findMetricValue(balance, ['total debt', 'long-term debt', 'debt'])

  const operatingCashFlow = findMetricValue(cashflow, [
    'operating cash flow',
    'cash from operations',
  ])
  const freeCashFlow = findMetricValue(cashflow, ['free cash flow'])

  const liquidityRatio =
    currentAssets && currentLiabilities && currentLiabilities !== 0
      ? currentAssets / currentLiabilities
      : undefined
  const netMargin =
    revenue && revenue !== 0 && typeof netIncome === 'number'
      ? netIncome / revenue
      : undefined

  const monthlyBurn =
    operatingCashFlow && operatingCashFlow < 0
      ? Math.abs(operatingCashFlow) / 3
      : operatingExpenses
        ? Math.max(operatingExpenses / 12, 1)
        : freeCashFlow && freeCashFlow < 0
          ? Math.abs(freeCashFlow) / 3
          : undefined

  const runwayMonths = estimateRunwayMonths(cash, monthlyBurn)

  const score = clampScore(
    0.5 +
      (typeof netIncome === 'number' ? (netIncome > 0 ? 0.15 : -0.15) : 0) +
      (typeof operatingCashFlow === 'number'
        ? operatingCashFlow > 0
          ? 0.15
          : -0.15
        : 0) +
      (typeof liquidityRatio === 'number'
        ? liquidityRatio >= 1.5
          ? 0.1
          : liquidityRatio < 1
            ? -0.1
            : 0
        : 0) +
      (typeof runwayMonths === 'number'
        ? runwayMonths >= 12
          ? 0.1
          : runwayMonths < 6
            ? -0.1
            : 0
        : 0) +
      (typeof cash === 'number' && typeof totalDebt === 'number'
        ? cash > totalDebt
          ? 0.05
          : -0.05
        : 0),
  )

  const strengths: string[] = []
  if (typeof netIncome === 'number' && netIncome > 0) {
    strengths.push(`Net income of ${formatCurrency(netIncome)} indicates profitability.`)
  }
  if (typeof netMargin === 'number' && netMargin > 0.15) {
    strengths.push(`Net margin of ${(netMargin * 100).toFixed(1)}% shows healthy leverage.`)
  }
  if (typeof liquidityRatio === 'number' && liquidityRatio >= 1.5) {
    strengths.push(`Current ratio at ${liquidityRatio.toFixed(1)}x reflects solid liquidity.`)
  }
  if (typeof operatingCashFlow === 'number' && operatingCashFlow > 0) {
    strengths.push(`Operations generated ${formatCurrency(operatingCashFlow)} in cash.`)
  }
  if (typeof runwayMonths === 'number' && runwayMonths >= 12) {
    strengths.push(`Cash runway extends roughly ${runwayMonths.toFixed(0)} months.`)
  }
  if (!strengths.length) {
    strengths.push('Statements look complete, enabling quick diagnostics even without AI output.')
  }

  const risks: string[] = []
  if (typeof netIncome === 'number' && netIncome < 0) {
    risks.push(`Net losses of ${formatCurrency(netIncome)} are pressuring profitability.`)
  }
  if (typeof netMargin === 'number' && netMargin < 0.05) {
    risks.push('Net margin is thin, leaving little buffer for volatility.')
  }
  if (typeof liquidityRatio === 'number' && liquidityRatio < 1) {
    risks.push(`Current ratio of ${liquidityRatio.toFixed(2)}x signals working-capital stress.`)
  }
  if (typeof operatingCashFlow === 'number' && operatingCashFlow < 0) {
    risks.push(`Operating cash burn of ${formatCurrency(operatingCashFlow)} this period.`)
  }
  if (typeof runwayMonths === 'number' && runwayMonths < 6) {
    risks.push(`Cash runway is only ${runwayMonths.toFixed(1)} months at current burn.`)
  }
  if (typeof totalDebt === 'number' && typeof cash === 'number' && totalDebt > cash) {
    risks.push('Debt exceeds cash, creating refinancing exposure.')
  }
  if (!risks.length) {
    risks.push('No acute risks detected from the text provided.')
  }

  const recommendations: string[] = []
  if (typeof netIncome === 'number' && netIncome < 0) {
    recommendations.push('Tighten expense controls or improve pricing to return to profitability.')
  }
  if (typeof operatingCashFlow === 'number' && operatingCashFlow < 0) {
    recommendations.push('Stabilize working capital to reduce operating cash burn.')
  }
  if (typeof liquidityRatio === 'number' && liquidityRatio < 1.2) {
    recommendations.push('Build short-term liquidity through credit facilities or slower spend.')
  }
  if (typeof runwayMonths === 'number' && runwayMonths < 9) {
    recommendations.push('Secure additional capital to extend runway beyond nine months.')
  }
  if (
    typeof totalDebt === 'number' &&
    typeof cash === 'number' &&
    totalDebt > cash * 1.2
  ) {
    recommendations.push('Evaluate refinancing or debt reduction options to lighten leverage.')
  }
  if (!recommendations.length) {
    recommendations.push('Maintain current plan; monitor cash trends monthly to stay ahead of shifts.')
  }

  const summaryParts: string[] = []
  if (typeof netIncome === 'number') {
    summaryParts.push(
      `${input.companyName || 'The company'} posted ${
        netIncome >= 0 ? 'net income' : 'a loss'
      } of ${formatCurrency(netIncome)}${
        revenue ? ` on ${formatCurrency(revenue)} of revenue` : ''
      }.`,
    )
  } else {
    summaryParts.push(
      `${input.companyName || 'The company'} financials were analyzed with local heuristics.`,
    )
  }
  if (typeof liquidityRatio === 'number') {
    summaryParts.push(`Current ratio sits near ${liquidityRatio.toFixed(1)}x.`)
  }
  if (typeof operatingCashFlow === 'number') {
    summaryParts.push(
      operatingCashFlow >= 0
        ? 'Operations generated positive cash.'
        : 'Operations consumed cash this period.',
    )
  }
  if (typeof runwayMonths === 'number') {
    summaryParts.push(`Estimated runway ~${runwayMonths.toFixed(0)} months.`)
  }

  const summary = summaryParts.join(' ')

  const liquiditySignal =
    typeof liquidityRatio === 'number'
      ? liquidityRatio >= 1
        ? `Current ratio ~${liquidityRatio.toFixed(2)}x`
        : `Current ratio under 1.0 (${liquidityRatio.toFixed(2)}x)`
      : typeof cash === 'number'
        ? `Cash balance around ${formatCurrency(cash)}`
        : undefined

  const profitabilitySignal =
    typeof netIncome === 'number'
      ? netMargin
        ? `Net margin ${(netMargin * 100).toFixed(1)}%`
        : `Net ${netIncome >= 0 ? 'income' : 'loss'} ${formatCurrency(netIncome)}`
      : undefined

  const runwaySignal =
    typeof runwayMonths === 'number'
      ? runwayMonths >= 12
        ? `~${runwayMonths.toFixed(0)} months runway`
        : `Runway near ${runwayMonths.toFixed(0)} months`
      : undefined

  return {
    companyName: input.companyName,
    reportingPeriod: input.reportingPeriod,
    summary,
    status: deriveHealthStatus(score),
    score,
    strengths,
    risks,
    recommendations,
    liquiditySignal,
    profitabilitySignal,
    runwaySignal,
    rawAnswer: 'Generated locally from pasted statements.',
  }
}
