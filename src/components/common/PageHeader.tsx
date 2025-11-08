import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export const PageHeader = ({ title, subtitle, actions }: PageHeaderProps) => (
  <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <div>
      <p className="text-xs uppercase tracking-wider text-brand-500">
        Auto Notes to Sheets
      </p>
      <h2 className="text-3xl font-semibold text-slate-900">{title}</h2>
      {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
    </div>
    {actions && <div className="flex gap-3">{actions}</div>}
  </div>
)
