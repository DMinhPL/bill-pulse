import { normalizeItemKey } from './utils/priceTracker';
import type { AppTab } from './types/navigation';

/** Paths used for links and redirects. */
export const ROUTES = {
  dashboard: '/',
  login: '/login',
  register: '/register',
  scan: '/scan',
  prices: '/prices',
  categories: '/categories',
  bills: '/bills',
  items: '/items',
} as const;

/**
 * Route patterns for React Router *and* Express (both understand ':param' and
 * optional ':param?'). One pattern per page, so opening a bill or switching
 * category keeps the page mounted. The server serves the app only for these
 * and answers 404 for anything else.
 */
export const ROUTE_PATTERNS = {
  dashboard: '/',
  login: '/login',
  register: '/register',
  scan: '/scan',
  prices: '/prices',
  categories: '/categories/:categorySlug?',
  bills: '/bills/:billId?',
  items: '/items/:itemSlug?',
} as const;

export const PAGE_ROUTE_PATTERNS: string[] = Object.values(ROUTE_PATTERNS);

/** 'Sữa tươi TH True Milk 1L' → 'sua-tuoi-th-true-milk-1l' */
export const toSlug = (name: string) => normalizeItemKey(name).replace(/ /g, '-');

export const categoryPath = (category: string | null) =>
  category ? `${ROUTES.categories}/${toSlug(category)}` : ROUTES.categories;
export const billPath = (billId: string) => `${ROUTES.bills}/${encodeURIComponent(billId)}`;
export const itemPath = (itemName: string) => `${ROUTES.items}/${toSlug(itemName)}`;

/** Finds the entry whose name produces the given slug. */
export function findBySlug<T>(entries: T[], slug: string | undefined, getName: (entry: T) => string): T | undefined {
  if (!slug) return undefined;
  return entries.find(entry => toSlug(getName(entry)) === slug);
}

/** For views that still navigate by tab name. */
export const pathForTab = (tab: AppTab): string =>
  ({
    dashboard: ROUTES.dashboard,
    scan: ROUTES.scan,
    watchlist: ROUTES.prices,
    categories: ROUTES.categories,
    bills: ROUTES.bills,
    deepdive: ROUTES.items,
  })[tab];

/** Only same-site paths are allowed as a post-login redirect. */
export const safeRedirect = (target: string | null) =>
  target && target.startsWith('/') && !target.startsWith('//') ? target : ROUTES.dashboard;
