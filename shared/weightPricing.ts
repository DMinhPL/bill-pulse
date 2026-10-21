export type WeightUnit = 'g' | 'kg'

export type WeightPriceInput = {
  unit?: string
  quantity?: number
  unitPrice?: number
  totalPrice?: number
}

export type ComparablePrice = {
  value: number
  pricePerKg?: number
  unit: string
  isWeightNormalized: boolean
  quantityInKg?: number
}

const UNIT_TO_GRAMS: Record<string, number> = {
  g: 1,
  gram: 1,
  grams: 1,
  gam: 1,
  gr: 1,
  kg: 1000,
  kilogram: 1000,
  kilograms: 1000,
  kilo: 1000,
  ký: 1000,
  ky: 1000,
}

const normalizeUnit = (unit: string) => unit.trim().toLocaleLowerCase().replace(/\s+/g, ' ')

export function getWeightUnitGrams(unit?: string): number | null {
  if (!unit) return null
  return UNIT_TO_GRAMS[normalizeUnit(unit)] ?? null
}

export function getComparablePrice(item: WeightPriceInput): ComparablePrice {
  const quantity = Number(item.quantity) || 0
  const totalPrice = Number(item.totalPrice) || 0
  const gramsPerUnit = getWeightUnitGrams(item.unit)

  if (gramsPerUnit && quantity > 0 && totalPrice > 0) {
    const quantityInKg = (quantity * gramsPerUnit) / 1000
    return {
      value: totalPrice / quantityInKg,
      pricePerKg: totalPrice / quantityInKg,
      unit: 'kg',
      isWeightNormalized: true,
      quantityInKg,
    }
  }

  return {
    value: Number(item.unitPrice) || 0,
    unit: item.unit || 'cái',
    isWeightNormalized: false,
  }
}
