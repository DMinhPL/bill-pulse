'use client'

import { useRowLabel } from '@payloadcms/ui'

type BillItemRow = {
  canonicalName?: string
  rawName?: string
}

export default function BillItemRowLabel() {
  const { data, rowNumber } = useRowLabel<BillItemRow>()
  const name = data?.rawName?.trim() || data?.canonicalName?.trim() || 'Item'

  return <div>{rowNumber + 1}. {name}</div>
}
