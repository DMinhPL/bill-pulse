import React from 'react';
import { Link } from 'react-router';
import { Receipt } from 'lucide-react';
import { ROUTES } from '../../routes';

interface BrandProps {
  /** Shows the tagline under the name */
  withTagline?: boolean;
  className?: string;
}

/** Logo + name, linking to the dashboard. Used by the sidebar and the mobile header. */
export const Brand: React.FC<BrandProps> = ({ withTagline = false, className = '' }) => (
  <Link to={ROUTES.dashboard} className={`brand flex items-center gap-3 shrink-0 ${className}`} aria-label="BillPulse75 - Tổng quan">
    <div className="brand__logo w-10 h-10 shrink-0 rounded-xl bg-gradient-to-tr from-rose-500 via-amber-500 to-emerald-400 p-0.5 shadow-lg shadow-rose-500/20">
      <div className="brand__logo-mark w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
        <Receipt className="w-5 h-5 text-amber-400" />
      </div>
    </div>
    <div className="brand__text min-w-0">
      <div className="brand__row flex items-center gap-2">
        <span className="brand__name font-bold text-lg tracking-tight whitespace-nowrap bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
          BillPulse75
        </span>
        <span className="brand__currency px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase whitespace-nowrap rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
          ₫ VND
        </span>
      </div>
      {withTagline && (
        <p className="brand__tagline text-xs text-slate-400 truncate">Quét hóa đơn & Theo dõi biến động giá</p>
      )}
    </div>
  </Link>
);
