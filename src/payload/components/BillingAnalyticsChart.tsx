'use client'

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { useState } from 'react'

import { ADMIN_ROUTE } from '../adminRoute'
import type { AnalyticsData } from './billingAnalytics'

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
)

const COLORS = ['#f59e0b', '#fb7185', '#22d3ee', '#a78bfa', '#34d399', '#60a5fa']
const currency = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 })

const money = (value: number) => `${currency.format(value)} đ`

const formatDate = (value?: string) => {
  if (!value) return 'Unknown date'
  const [year, month, day] = value.slice(0, 10).split('-')
  return year && month && day ? `${day}/${month}/${year}` : value
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
  },
  scales: {
    x: {
      grid: { color: 'rgba(148, 163, 184, 0.12)' },
      ticks: { color: '#94a3b8' },
    },
    y: {
      grid: { color: 'rgba(148, 163, 184, 0.12)' },
      ticks: { color: '#94a3b8' },
    },
  },
}

const currencyChartOptions = {
  ...chartOptions,
  plugins: {
    ...chartOptions.plugins,
    tooltip: {
      callbacks: {
        label: (context: { raw: unknown }) => money(Number(context.raw)),
      },
    },
  },
  scales: {
    ...chartOptions.scales,
    y: {
      ...chartOptions.scales.y,
      ticks: {
        ...chartOptions.scales.y.ticks,
        callback: (value: string | number) => money(Number(value)),
      },
    },
  },
}

export function BillingAnalyticsChart({ data }: { data: AnalyticsData }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProductName, setSelectedProductName] = useState(data.prices[0]?.name || '')
  const [selectedStoreName, setSelectedStoreName] = useState('')
  const selectedProduct = data.prices.find(product => product.name === selectedProductName) || data.prices[0]
  const selectedStore = data.stores.find(store => store.name === selectedStoreName)
  const filteredPrices = data.prices.filter(product => product.name.toLocaleLowerCase().includes(searchTerm.toLocaleLowerCase()))
  const storeData = {
    labels: data.stores.map(store => store.name),
    datasets: [{
      data: data.stores.map(store => store.orders),
      backgroundColor: COLORS,
      borderRadius: 6,
      maxBarThickness: 30,
    }],
  }

  const categoryData = {
    labels: data.categories.map(category => category.name),
    datasets: [{
      data: data.categories.map(category => category.amount),
      backgroundColor: COLORS,
      borderColor: '#0f172a',
      borderWidth: 3,
    }],
  }

  const categoryTotal = data.metrics.categorySpend || 1
  const categoryPercent = (amount: number) => `${((amount / categoryTotal) * 100).toFixed(1)}%`
  const categoryOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      tooltip: {
        callbacks: {
          label: (context: { dataIndex: number; raw: unknown }) => {
            const category = data.categories[context.dataIndex]
            return `${category.name}: ${money(Number(context.raw))} (${categoryPercent(Number(context.raw))})`
          },
        },
      },
    },
  }

  const trendData = {
    labels: data.trends.map(trend => trend.month),
    datasets: [{
      label: 'Spending',
      data: data.trends.map(trend => trend.amount),
      borderColor: '#f59e0b',
      backgroundColor: 'rgba(245, 158, 11, 0.14)',
      fill: true,
      tension: 0.35,
    }],
  }

  const selectedPriceData = selectedProduct ? {
    labels: selectedProduct.points.map(point => point.month),
    datasets: [{
      label: selectedProduct.name,
      data: selectedProduct.points.map(point => point.price),
      borderColor: '#f59e0b',
      backgroundColor: 'rgba(245, 158, 11, 0.14)',
      fill: true,
      tension: 0.35,
    }],
  } : undefined

  const priceOptions = {
    ...currencyChartOptions,
    plugins: {
      ...currencyChartOptions.plugins,
      tooltip: {
        callbacks: {
          label: (context: { dataIndex: number; raw: unknown }) => {
            const point = selectedProduct?.points[context.dataIndex]
            return [
              money(Number(context.raw)),
              `Price basis: ${selectedProduct?.isWeightNormalized ? 'đ/kg' : selectedProduct?.unit || 'unit'}`,
              `Buyer: ${point?.users.join(', ') || 'Unknown'}`,
            ]
          },
        },
      },
    },
  }

  const priceChange = selectedProduct && selectedProduct.points.length > 1
    ? ((selectedProduct.points.at(-1)!.price - selectedProduct.points[0].price) / selectedProduct.points[0].price) * 100
    : 0

  return (
    <div className="bp-analytics-chart-grid">
      <section className="bp-analytics-card">
        <div className="bp-analytics-card__header">
          <div>
            <p className="bp-analytics-eyebrow">By store</p>
            <h3>Bill volume by store</h3>
          </div>
          <span>{data.stores.length} stores</span>
        </div>
        <div className="bp-analytics-chart bp-analytics-chart--bar">
          <Bar data={storeData} options={chartOptions} />
        </div>
        <div className="bp-analytics-ranking">
          {data.stores.slice(0, 5).map((store, index) => (
            <button
              aria-expanded={selectedStore?.name === store.name}
              className={`bp-analytics-ranking__row ${selectedStore?.name === store.name ? 'is-selected' : ''}`}
              key={store.name}
              onClick={() => setSelectedStoreName(store.name)}
              type="button"
            >
              <span><b>{index + 1}</b>{store.name}</span>
              <strong>{store.orders} bills · {money(store.amount)}</strong>
            </button>
          ))}
        </div>
      </section>

      {selectedStore && (
        <div
          aria-labelledby="bp-analytics-store-dialog-title"
          aria-modal="true"
          className="bp-analytics-dialog-backdrop"
          onClick={event => {
            if (event.target === event.currentTarget) setSelectedStoreName('')
          }}
          role="dialog"
        >
          <div className="bp-analytics-dialog">
            <div className="bp-analytics-dialog__header">
              <div>
                <span>Store bills</span>
                <h3 id="bp-analytics-store-dialog-title">{selectedStore.name}</h3>
              </div>
              <button aria-label="Close dialog" className="bp-analytics-dialog__close" onClick={() => setSelectedStoreName('')} type="button">×</button>
            </div>
            <div className="bp-analytics-store-bills__header">
              <strong>{selectedStore.bills.length} bills</strong>
              <span>Click a bill to open its details</span>
            </div>
            <div className="bp-analytics-store-bills">
              {selectedStore.bills.length ? selectedStore.bills.map(bill => (
                <a className="bp-analytics-store-bill" href={`${ADMIN_ROUTE}/collections//bills/${encodeURIComponent(bill.id)}`} key={bill.id}>
                  <span>
                    <b>{bill.billNumber || `Bill ${bill.id.slice(0, 8)}`}</b>
                    <small>{formatDate(bill.date)}</small>
                  </span>
                  <strong>{money(bill.amount)}</strong>
                </a>
              )) : <p className="bp-analytics-empty">No bills found for this store.</p>}
            </div>
          </div>
        </div>
      )}

      <section className="bp-analytics-card">
        <div className="bp-analytics-card__header">
          <div>
            <p className="bp-analytics-eyebrow">Categories</p>
            <h3>Spending share</h3>
          </div>
        </div>
        <div className="bp-analytics-chart bp-analytics-chart--donut">
          <Doughnut data={categoryData} options={categoryOptions} />
        </div>
        <div className="bp-analytics-legend">
          {data.categories.slice(0, 6).map((category, index) => (
            <span key={category.name}>
              <i style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              {category.name}: {money(category.amount)} ({categoryPercent(category.amount)})
            </span>
          ))}
        </div>
      </section>

      <section className="bp-analytics-card bp-analytics-card--wide">
        <div className="bp-analytics-card__header">
          <div>
            <p className="bp-analytics-eyebrow">Over time</p>
            <h3>Spending trend</h3>
          </div>
          <span>{data.trends.length} months</span>
        </div>
        <div className="bp-analytics-chart">
          <Line data={trendData} options={currencyChartOptions} />
        </div>
      </section>

      <section className="bp-analytics-card bp-analytics-card--wide">
        <div className="bp-analytics-card__header">
          <div>
            <p className="bp-analytics-eyebrow">Products</p>
            <h3>Recent price changes</h3>
          </div>
          <input
            aria-label="Search products"
            className="bp-analytics-price-search"
            onChange={event => setSearchTerm(event.target.value)}
            placeholder="Search products"
            type="search"
            value={searchTerm}
          />
        </div>
        <div className="bp-analytics-price-layout">
          <div className="bp-analytics-price-list">
            {filteredPrices.map((product, index) => {
              const first = product.points[0]?.price || 0
              const last = product.points.at(-1)?.price || first
              const change = first && product.points.length > 1 ? ((last - first) / first) * 100 : 0
              const state = change > 0 ? 'is-up' : change < 0 ? 'is-down' : 'is-stable'

              return (
                <button
                  aria-pressed={selectedProduct?.name === product.name}
                  className={`bp-analytics-price-row ${selectedProduct?.name === product.name ? 'is-selected' : ''}`}
                  key={`${product.name}-${product.unit}-${index}`}
                  onClick={() => setSelectedProductName(product.name)}
                  type="button"
                >
                  <span>{product.name}</span>
                  <strong className={state}>
                    {change > 0 ? '+' : ''}{change.toFixed(1)}%
                  </strong>
                </button>
              )
            })}
            {!filteredPrices.length && <p className="bp-analytics-empty">No products found.</p>}
          </div>

          <div className="bp-analytics-price-timeline">
            {selectedProduct && selectedPriceData ? (
              <>
                <div className="bp-analytics-price-timeline__header">
                  <div>
                    <span>Monthly price history</span>
                    <strong>{selectedProduct.name}</strong>
                    <small>Compared by {selectedProduct.isWeightNormalized ? 'price per kg' : `price per ${selectedProduct.unit}`}</small>
                  </div>
                  <b className={priceChange > 0 ? 'is-up' : priceChange < 0 ? 'is-down' : 'is-stable'}>
                    {priceChange > 0 ? '+' : ''}{priceChange.toFixed(1)}%
                  </b>
                </div>
                <div className="bp-analytics-chart bp-analytics-chart--price">
                  <Line data={selectedPriceData} options={priceOptions} />
                </div>
              </>
            ) : (
              <p className="bp-analytics-empty">Select a product to view its timeline.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
