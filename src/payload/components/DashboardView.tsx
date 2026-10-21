import type { ServerProps } from 'payload'

import { DashboardAnalyticsClient } from './DashboardAnalyticsClient'
import { getBillingAnalytics } from './billingAnalytics'

type UserOption = { id: string; username?: string; displayName?: string }

const monthValue = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

const shiftMonth = (date: Date, amount: number) => new Date(date.getFullYear(), date.getMonth() + amount, 1)

const monthOptions = (current: Date) => Array.from({ length: 36 }, (_, index) => {
  const date = shiftMonth(current, -index)
  const value = monthValue(date)
  return { value, label: `${value.slice(5)}/${value.slice(0, 4)}` }
})

export default async function DashboardView({ payload }: ServerProps) {
  const currentMonth = new Date()
  const from = monthValue(shiftMonth(currentMonth, -5))
  const to = monthValue(currentMonth)
  const options = monthOptions(currentMonth)
  const [users, data] = await Promise.all([
    payload.find({ collection: 'users', limit: 1000, depth: 0, sort: 'username' }),
    getBillingAnalytics(payload, { from, to }),
  ])

  return (
    <div className="bp-analytics-widget">
      <div className="bp-analytics-heading">
        <div>
          <p className="bp-analytics-eyebrow">BillPulse75</p>
          <h2>Operations overview</h2>
          <p>Monitor users, bills, stores, categories, and price changes.</p>
        </div>
        <span className="bp-analytics-heading__badge">Current data</span>
      </div>

      <DashboardAnalyticsClient
        initialData={data}
        initialFrom={from}
        initialTo={to}
        options={options}
        users={users.docs as UserOption[]}
      />
    </div>
  )
}
