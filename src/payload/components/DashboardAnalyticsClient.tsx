'use client'

import { useState } from 'react'

import { BillingAnalyticsChart } from './BillingAnalyticsChart'
import { DashboardFilterForm } from './DashboardFilterForm'
import type { AnalyticsData } from './billingAnalytics'

type UserOption = { id: string; username?: string; displayName?: string }
type MonthOption = { value: string; label: string }
type Filters = { userId: string; from: string; to: string }

const currency = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 })

const shiftMonth = (value: string, amount: number) => {
  const [year, month] = value.split('-').map(Number)
  const date = new Date(year, month - 1 + amount, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function DashboardAnalyticsClient({
  initialData,
  initialFrom,
  initialTo,
  options,
  users,
}: {
  initialData: AnalyticsData
  initialFrom: string
  initialTo: string
  options: MonthOption[]
  users: UserOption[]
}) {
  const [data, setData] = useState(initialData)
  const [filters, setFilters] = useState<Filters>({ from: initialFrom, to: initialTo, userId: '' })
  const [range, setRange] = useState('6m')
  const [isLoading, setIsLoading] = useState(false)

  const loadAnalytics = async (nextFilters: Filters, nextRange: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/dashboard-analytics', {
        body: JSON.stringify(nextFilters),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      if (!response.ok) throw new Error('Unable to load analytics data.')
      setData(await response.json() as AnalyticsData)
      setFilters(nextFilters)
      setRange(nextRange)
    } finally {
      setIsLoading(false)
    }
  }

  const applyPreset = (value: string) => {
    const nextFilters = value === 'all'
      ? { ...filters, from: '', to: '' }
      : { ...filters, from: shiftMonth(initialTo, -(Number(value) - 1)), to: initialTo }
    void loadAnalytics(nextFilters, value === 'all' ? 'all' : `${value}m`)
  }

  const handleApply = (nextFilters: Filters) => {
    void loadAnalytics(nextFilters, 'custom')
  }

  return (
    <>
      <div className="bp-analytics-date-presets">
        <span>Date range</span>
        {[
          ['3', '3 months'],
          ['6', '6 months'],
          ['12', '12 months'],
          ['all', 'All time'],
        ].map(([value, label]) => (
          <button className={range === (value === 'all' ? 'all' : `${value}m`) ? 'is-active' : ''} disabled={isLoading} key={value} onClick={() => applyPreset(value)} type="button">
            {label}
          </button>
        ))}
      </div>

      <DashboardFilterForm
        from={filters.from}
        isLoading={isLoading}
        onApply={handleApply}
        options={options}
        to={filters.to}
        userId={filters.userId}
        users={users}
      />

      <div className="bp-analytics-filter-summary">
        {filters.userId ? 'Filtered by selected user' : 'All users'}
        {filters.from && ` · from ${filters.from.slice(5)}/${filters.from.slice(0, 4)}`}
        {filters.to && ` · to ${filters.to.slice(5)}/${filters.to.slice(0, 4)}`}
        {range === 'all' && ' · all time'}
      </div>

      <div className="bp-analytics-metrics">
        <div><span>Users</span><strong>{data.metrics.users.toLocaleString('vi-VN')}</strong></div>
        <div><span>Bills</span><strong>{data.metrics.bills.toLocaleString('vi-VN')}</strong></div>
        <div><span>Total spending</span><strong>{currency.format(data.metrics.spend)} đ</strong></div>
        <div><span>Average per bill</span><strong>{currency.format(data.metrics.averageBill)} đ</strong></div>
      </div>

      <BillingAnalyticsChart data={data} />

      {isLoading && (
        <div aria-label="Loading data" aria-live="polite" className="bp-analytics-loading-overlay" role="status">
          <span aria-hidden="true" className="bp-analytics-loading-overlay__spinner" />
          <span>Loading data...</span>
        </div>
      )}
    </>
  )
}
