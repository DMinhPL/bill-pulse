'use client'

import { useField } from '@payloadcms/ui'
import type { NumberFieldClientComponent } from 'payload'

const currency = new Intl.NumberFormat('vi-VN', {
  currency: 'VND',
  maximumFractionDigits: 0,
  style: 'currency',
})

const CurrencyField: NumberFieldClientComponent = ({ field, path }) => {
  const { value } = useField<number>({ potentiallyStalePath: path })
  const label = typeof field.label === 'string' ? field.label : path.split('.').at(-1)
  const formattedValue = value === null || value === undefined
    ? '—'
    : currency.format(Number(value))

  return (
    <div className={`field-type number bp-currency-field ${path.endsWith('totalAmount') ? 'bp-currency-field--total' : ''}`}>
      <label className="field-label" htmlFor={path}>{label}</label>
      <output className="bp-currency-field__value" id={path}>{formattedValue}</output>
    </div>
  )
}

export default CurrencyField
