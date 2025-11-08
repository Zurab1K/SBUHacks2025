import type { CallRecord } from '../types'

export const mockCalls: CallRecord[] = [
  {
    id: 'call-101',
    title: 'Q1 Renewal Strategy',
    account: 'Northwind Traders',
    contact: 'Danielle Flores',
    owner: 'Alex Chen',
    summary:
      'Discussed renewal strategy for Q1, aligned on pricing guardrails, and outlined technical blockers that need product feedback.',
    nextSteps: [
      'Send recap email with highlighted blockers',
      'Schedule security review follow-up',
      'Share updated pricing grid by Friday',
    ],
    sentiment: 'Positive',
    objections: [
      'Need assurance on roadmap timelines',
      'Concerned about provisioning SLAs during spikes',
    ],
    actionItems: [
      'Product to confirm roadmap deliverables',
      'CSM to involve solutions architect for security review',
    ],
    tags: ['Renewal', 'Enterprise', 'Security'],
    sentimentScore: 0.76,
    status: 'Ready',
    transcriptSource: 'upload',
    transcriptName: 'northwind_renewal_call.mp3',
    durationMinutes: 42,
    createdAt: '2025-02-04T15:10:00Z',
    updatedAt: '2025-02-04T16:02:00Z',
  },
  {
    id: 'call-102',
    title: 'Post-Onboarding Success Review',
    account: 'Acme Analytics',
    contact: 'Priya Shah',
    owner: 'Morgan Lee',
    summary:
      'Validated onboarding outcomes, measured adoption goals, and mapped co-marketing opportunity for April launch.',
    nextSteps: [
      'Compile adoption dashboard for executive sponsor',
      'Draft co-marketing brief and share timeline',
    ],
    sentiment: 'Positive',
    objections: ['Need clearer visibility into support backlog'],
    actionItems: [
      'Support lead to share backlog snapshot weekly',
      'Success team to highlight VIP tickets during stand-up',
    ],
    tags: ['Onboarding', 'Adoption'],
    sentimentScore: 0.64,
    status: 'Ready',
    transcriptSource: 'paste',
    durationMinutes: 35,
    createdAt: '2025-02-03T17:00:00Z',
    updatedAt: '2025-02-03T17:38:00Z',
  },
  {
    id: 'call-103',
    title: 'Risk Escalation Sync',
    account: 'Globex Retail',
    contact: 'Michael Ortiz',
    owner: 'Jamie Rivera',
    summary:
      'Escalated shipping delays impacting adoption and reviewed remediation plan with ops and finance stakeholders.',
    nextSteps: [
      'Deliver updated implementation calendar',
      'Provide interim reporting template',
      'Loop finance partner for concession approval',
    ],
    sentiment: 'Neutral',
    objections: [
      'Delayed feature parity between regions',
      'Lack of real-time SLA dashboards',
    ],
    actionItems: [
      'Ops to publish weekly readiness scorecard',
      'Finance to confirm concession envelope',
    ],
    tags: ['Escalation', 'Logistics'],
    sentimentScore: 0.1,
    status: 'Ready',
    transcriptSource: 'upload',
    transcriptName: 'globex_escalation.wav',
    durationMinutes: 48,
    createdAt: '2025-02-01T14:30:00Z',
    updatedAt: '2025-02-01T15:20:00Z',
  },
]
