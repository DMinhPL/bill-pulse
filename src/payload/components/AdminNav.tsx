import { DefaultNav } from '@payloadcms/next/rsc'
import type React from 'react'

import { AdminNavIcons } from './AdminNavIcons'

export default function AdminNav(props: React.ComponentProps<typeof DefaultNav>) {
  return (
    <>
      <DefaultNav {...props} />
      <AdminNavIcons />
    </>
  )
}
