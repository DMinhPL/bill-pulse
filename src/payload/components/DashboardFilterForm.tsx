'use client'

import { type FormEvent, useEffect, useState } from 'react'

type UserOption = { id: string; username?: string; displayName?: string }
type MonthOption = { value: string; label: string }
type Filters = { userId: string; from: string; to: string }

export function DashboardFilterForm({
  from,
  isLoading,
  onApply,
  options,
  to,
  userId,
  users,
}: {
  from: string
  isLoading: boolean
  onApply: (filters: Filters) => void
  options: MonthOption[]
  to: string
  userId: string
  users: UserOption[]
}) {
  const [draft, setDraft] = useState<Filters>({ from, to, userId })

  useEffect(() => {
    setDraft({ from, to, userId })
  }, [from, to, userId])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onApply(draft)
  }

  return (
    <form className="bp-analytics-filters" onSubmit={handleSubmit}>
      <label>
        <span>User</span>
        <select disabled={isLoading} name="userId" onChange={event => setDraft({ ...draft, userId: event.target.value })} value={draft.userId}>
          <option value="">All users</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>{user.displayName || user.username}</option>
          ))}
        </select>
      </label>
      <label>
        <span>From</span>
        <select disabled={isLoading} name="from" onChange={event => setDraft({ ...draft, from: event.target.value })} value={draft.from}>
          <option value="">All months</option>
          {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
      <label>
        <span>To</span>
        <select disabled={isLoading} name="to" onChange={event => setDraft({ ...draft, to: event.target.value })} value={draft.to}>
          <option value="">All months</option>
          {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
      <button aria-busy={isLoading} className="bp-analytics-submit" disabled={isLoading} type="submit">
        {isLoading && <span aria-hidden="true" className="bp-analytics-submit__spinner" />}
        {isLoading ? 'Loading...' : 'Apply'}
      </button>
    </form>
  )
}
