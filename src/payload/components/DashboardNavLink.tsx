'use client'

import { usePathname } from 'next/navigation'

import { ADMIN_ROUTE } from '../adminRoute'

export default function DashboardNavLink() {
  const pathname = usePathname()
  const isActive = pathname === ADMIN_ROUTE || pathname === `${ADMIN_ROUTE}/`

  return (
    <a
      aria-current={isActive ? 'page' : undefined}
      className="nav__link nav__link--dashboard"
      href={ADMIN_ROUTE}
      id="nav-dashboard"
    >
      {isActive && <div className="nav__link-indicator" />}
      <span className="nav__link-label">Dashboard</span>
    </a>
  )
}
