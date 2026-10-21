'use client'

import { FieldError, useField, useFormFields } from '@payloadcms/ui'
import type { TextFieldClientComponent } from 'payload'
import { useState } from 'react'

const InvitationCodeField: TextFieldClientComponent = ({ path }) => {
  const { disabled, setValue, showError, value } = useField<string>({ potentiallyStalePath: path })
  const consumedBy = useFormFields(([fields]) => fields.consumedBy?.value)
  const [generating, setGenerating] = useState(false)

  const handleGenerate = async () => {
    if (consumedBy) return

    setGenerating(true)
    try {
      const response = await fetch('/api/invitation-codes/generate', { method: 'POST', credentials: 'same-origin' })
      const data = (await response.json()) as { code?: string; error?: string }
      if (!response.ok || !data.code) throw new Error(data.error || 'Unable to generate code')
      setValue(data.code)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="field-type text">
      <label className="field-label" htmlFor={path}>
        Invitation code
      </label>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
        <input
          className="field-type__input"
          disabled={disabled || Boolean(consumedBy)}
          id={path}
          maxLength={8}
          onChange={event => setValue(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
          type="text"
          value={value || ''}
        />
        <button
          className="invitation-code-generate"
          disabled={disabled || generating || Boolean(consumedBy)}
          onClick={() => void handleGenerate()}
          type="button"
        >
          {generating ? 'Generating…' : 'Generate'}
        </button>
      </div>
      <FieldError path={path} showError={showError} />
    </div>
  )
}

export default InvitationCodeField
