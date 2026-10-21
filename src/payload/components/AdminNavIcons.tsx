'use client'

import {
  BotIcon,
  LayoutDashboardIcon,
  TextSearchIcon,
  FileTextIcon,
  PackageIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  TagsIcon,
  TicketIcon,
  UsersIcon,
} from '@animateicons/react/lucide'
import { createRoot, type Root } from 'react-dom/client'
import { useEffect } from 'react'

const ICONS = {
  'nav-dashboard': LayoutDashboardIcon,
  'nav-global-ai-settings': BotIcon,
  'nav-global-lookups': TextSearchIcon,
  'nav-admins': ShieldCheckIcon,
  'nav-users': UsersIcon,
  'nav-products': PackageIcon,
  'nav-bills': ReceiptIcon,
  'nav-sample-bills': FileTextIcon,
  'nav-bill-categories': TagsIcon,
  'nav-invitation-codes': TicketIcon,
} as const

const roots = new Map<Element, Root>()

function mountIcons() {
  for (const [id, Icon] of Object.entries(ICONS)) {
    const link = document.getElementById(id)
    if (!link || link.querySelector('[data-bill-pulse-nav-icon]')) continue

    const mount = document.createElement('span')
    mount.dataset.billPulseNavIcon = 'true'
    mount.className = 'nav__link-icon'
    link.prepend(mount)
    roots.set(mount, createRoot(mount))
    roots.get(mount)?.render(<Icon aria-hidden="true" className="nav__link-icon-svg" size={18} />)
  }
}

export function AdminNavIcons() {
  useEffect(() => {
    mountIcons()

    const observer = new MutationObserver(mountIcons)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      const mountedRoots = Array.from(roots)
      roots.clear()

      for (const [mount, root] of mountedRoots) {
        mount.remove()
        window.setTimeout(() => root.unmount(), 0)
      }
    }
  }, [])

  return null
}
