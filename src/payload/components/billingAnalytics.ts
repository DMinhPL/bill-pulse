import type { Payload } from 'payload'
import { getComparablePrice } from '../../../shared/weightPricing'

export type AnalyticsFilters = {
  userId?: string
  from?: string
  to?: string
}

export type AnalyticsData = {
  metrics: {
    users: number
    bills: number
    spend: number
    averageBill: number
    stores: number
    categories: number
    categorySpend: number
  }
  stores: {
    name: string
    orders: number
    amount: number
    bills: { id: string; billNumber?: string; date?: string; amount: number }[]
  }[]
  categories: { name: string; amount: number; quantity: number }[]
  trends: { month: string; orders: number; amount: number; quantity: number }[]
  prices: { name: string; category: string; unit: string; isWeightNormalized: boolean; points: { month: string; price: number; users: string[] }[] }[]
}

type BillItem = {
  canonicalName?: string
  rawName?: string
  category?: string
  unit?: string
  quantity?: number
  unitPrice?: number
  totalPrice?: number
}

type Bill = {
  id?: string
  billNumber?: string
  merchantName?: string
  date?: string
  totalAmount?: number
  user?: string | { id?: string }
  items?: BillItem[]
}

type User = { id: string; username?: string; displayName?: string }

const monthLabel = (date: string) => date.slice(0, 7)

const normalizeFromDate = (value?: string) => value && /^\d{4}-\d{2}$/.test(value) ? `${value}-01` : value

const normalizeToDate = (value?: string) => {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return value
  const [year, month] = value.split('-').map(Number)
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10)
}

export async function getBillingAnalytics(payload: Payload, filters: AnalyticsFilters = {}) {
  const where: Record<string, unknown>[] = []
  if (filters.userId) where.push({ user: { equals: filters.userId } })
  if (filters.from) where.push({ date: { greater_than_equal: normalizeFromDate(filters.from) } })
  if (filters.to) where.push({ date: { less_than_equal: normalizeToDate(filters.to) } })

  const [users, bills] = await Promise.all([
    payload.find({ collection: 'users', limit: 1000, depth: 0 }),
    payload.find({
      collection: 'bills',
      pagination: false,
      depth: 0,
      sort: '-date',
      where: where.length ? { and: where } : undefined,
    }),
  ])

  const storeMap = new Map<string, { orders: number; amount: number; bills: { id: string; billNumber?: string; date?: string; amount: number }[] }>()
  const categoryMap = new Map<string, { amount: number; quantity: number }>()
  const trendMap = new Map<string, { orders: number; amount: number; quantity: number }>()
  const priceMap = new Map<string, { name: string; category: string; unit: string; isWeightNormalized: boolean; months: Map<string, { total: number; count: number; users: Set<string> }> }>()
  const userNames = new Map((users.docs as User[]).map(user => [user.id, user.displayName || user.username || user.id]))
  let spend = 0

  for (const bill of bills.docs as Bill[]) {
    const store = bill.merchantName?.trim() || 'Unknown store'
    const amount = Number(bill.totalAmount) || 0
    const month = bill.date ? monthLabel(bill.date) : 'Unknown'
    const userId = typeof bill.user === 'string' ? bill.user : bill.user?.id
    const userName = userId ? userNames.get(userId) || userId : 'Unknown user'
    const storeStats = storeMap.get(store) || { orders: 0, amount: 0, bills: [] }
    storeStats.orders += 1
    storeStats.amount += amount
    if (bill.id) storeStats.bills.push({ amount, billNumber: bill.billNumber, date: bill.date, id: String(bill.id) })
    storeMap.set(store, storeStats)
    spend += amount

    const trend = trendMap.get(month) || { orders: 0, amount: 0, quantity: 0 }
    trend.orders += 1
    trend.amount += amount

    for (const item of bill.items || []) {
      const quantity = Number(item.quantity) || 0
      const itemAmount = Number(item.totalPrice) || 0
      const category = item.category?.trim() || 'Uncategorized'
      const categoryStats = categoryMap.get(category) || { amount: 0, quantity: 0 }
      categoryStats.amount += itemAmount
      categoryStats.quantity += quantity
      categoryMap.set(category, categoryStats)
      trend.quantity += quantity

      const product = item.canonicalName?.trim() || item.rawName?.trim() || 'Unknown product'
      const productCategory = item.category?.trim() || 'Uncategorized'
      const comparable = getComparablePrice(item)
      const productKey = `${productCategory}::${product}::${comparable.unit}`
      const productEntry = priceMap.get(productKey) || {
        name: product,
        category: productCategory,
        unit: comparable.unit,
        isWeightNormalized: comparable.isWeightNormalized,
        months: new Map<string, { total: number; count: number; users: Set<string> }>(),
      }
      const productMonths = productEntry.months
      const priceStats = productMonths.get(month) || { total: 0, count: 0, users: new Set<string>() }
      if (comparable.value > 0) {
        priceStats.total += comparable.value
        priceStats.count += 1
        priceStats.users.add(userName)
      }
      productMonths.set(month, priceStats)
      priceMap.set(productKey, productEntry)
    }

    trendMap.set(month, trend)
  }

  const stores = [...storeMap.entries()]
    .sort(([, a], [, b]) => b.orders - a.orders)
    .slice(0, 8)
    .map(([name, value]) => ({ name, ...value }))
  const categories = [...categoryMap.entries()]
    .sort(([, a], [, b]) => b.amount - a.amount)
    .slice(0, 8)
    .map(([name, value]) => ({ name, ...value }))
  const trends = [...trendMap.entries()]
    .filter(([month]) => month !== 'Unknown')
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, value]) => ({ month, ...value }))
  const prices = [...priceMap.values()]
    .map(({ name, category, unit, isWeightNormalized, months }) => ({
      name,
      category,
      unit,
      isWeightNormalized,
      points: [...months.entries()]
        .filter(([, value]) => value.count > 0)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([month, value]) => ({ month, price: value.total / value.count, users: [...value.users] })),
    }))
    .sort((a, b) => {
      const aChange = a.points.length > 1 ? Math.abs((a.points.at(-1)!.price - a.points[0].price) / a.points[0].price) : 0
      const bChange = b.points.length > 1 ? Math.abs((b.points.at(-1)!.price - b.points[0].price) / b.points[0].price) : 0
      return bChange - aChange
    })

  const data: AnalyticsData = {
    metrics: {
      users: filters.userId ? 1 : users.totalDocs,
      bills: bills.docs.length,
      spend,
      averageBill: bills.docs.length ? spend / bills.docs.length : 0,
      stores: storeMap.size,
      categories: categoryMap.size,
      categorySpend: [...categoryMap.values()].reduce((total, category) => total + category.amount, 0),
    },
    stores,
    categories,
    trends,
    prices,
  }

  return data
}
