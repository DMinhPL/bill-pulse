'use client'

import { DefaultCell, toast } from '@payloadcms/ui'
import type { DefaultCellComponentProps, TextFieldClient } from 'payload'
import { useState } from 'react'

const InvitationCodeCell = (props: DefaultCellComponentProps<TextFieldClient>) => {
  const [copied, setCopied] = useState(false)
  const code = props.cellData

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Unable to copy invitation code')
    }
  }

  return (
    <div style={{ alignItems: 'center', display: 'flex', gap: '0.75rem' }}>
      <DefaultCell {...props} />
      <button
        aria-label={`Copy invitation code ${code}`}
        onClick={event => {
          event.stopPropagation()
          void handleCopy()
        }}
        style={{
          background: 'var(--theme-elevation-100)',
          border: '1px solid var(--theme-elevation-300)',
          borderRadius: '4px',
          color: 'inherit',
          cursor: 'pointer',
          padding: '0.25rem 0.5rem',
          whiteSpace: 'nowrap',
        }}
        type="button"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}

export default InvitationCodeCell
