import type React from 'react';
import {
  ScanLine,
  TrendingUp,
  History as HistoryIcon,
  LineChart,
  AlertTriangle,
  Tags,
} from 'lucide-react';
import { ROUTES } from '../../../../shared/routes';

export interface NavItem {
  /** BEM modifier, e.g. sidebar__link--prices / navbar__link--prices */
  key: string;
  to: string;
  /** Match only the exact path (for "/") */
  end?: boolean;
  label: (ctx: { totalBills: number }) => string;
  /** Shorter label for the compact mobile menu */
  shortLabel: (ctx: { totalBills: number }) => string;
  icon: React.ComponentType<{ className?: string }>;
  iconClass?: string;
  /** Active styles for the sidebar / desktop links (bordered) */
  active: string;
  /** Active and inactive styles for the compact mobile menu */
  mobileActive: string;
  mobileInactive?: string;
  badge?: 'increased' | 'pulse';
}

/** Single source for the sidebar (desktop) and the top menu (mobile). */
export const NAV_ITEMS: NavItem[] = [
  {
    key: 'dashboard',
    to: ROUTES.dashboard,
    end: true,
    label: () => 'Tổng quan',
    shortLabel: () => 'Tổng quan',
    icon: TrendingUp,
    active: 'bg-rose-500/15 text-rose-300 border-rose-500/30 shadow-sm shadow-rose-500/10',
    mobileActive: 'bg-rose-500/20 text-rose-300',
  },
  {
    key: 'scan',
    to: ROUTES.scan,
    label: () => 'Quét hóa đơn',
    shortLabel: () => 'Quét bill',
    icon: ScanLine,
    iconClass: 'text-emerald-400',
    active: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/10',
    mobileActive: 'bg-emerald-500/20 text-emerald-300 font-semibold',
    mobileInactive: 'text-emerald-400 font-semibold',
    badge: 'pulse',
  },
  {
    key: 'prices',
    to: ROUTES.prices,
    label: () => 'Biến động giá',
    shortLabel: () => 'Biến động',
    icon: AlertTriangle,
    iconClass: 'text-rose-400',
    active: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    mobileActive: 'bg-rose-500/20 text-rose-300',
    badge: 'increased',
  },
  {
    key: 'categories',
    to: ROUTES.categories,
    label: () => 'Danh mục',
    shortLabel: () => 'Danh mục',
    icon: Tags,
    iconClass: 'text-amber-400',
    active: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    mobileActive: 'bg-amber-500/20 text-amber-300',
  },
  {
    key: 'bills',
    to: ROUTES.bills,
    label: ({ totalBills }) => `Hóa đơn (${totalBills})`,
    shortLabel: ({ totalBills }) => `Hóa đơn (${totalBills})`,
    icon: HistoryIcon,
    active: 'bg-slate-800 text-white border-slate-700',
    mobileActive: 'bg-slate-800 text-white',
  },
  {
    key: 'items',
    to: ROUTES.items,
    label: () => 'Chi tiết mặt hàng',
    shortLabel: () => 'Chi tiết',
    icon: LineChart,
    iconClass: 'text-amber-400',
    active: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    mobileActive: 'bg-amber-500/20 text-amber-300',
  },
];
