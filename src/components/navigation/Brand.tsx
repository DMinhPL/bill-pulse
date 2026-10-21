import React from 'react';
import { Link } from 'react-router';
import { ROUTES } from '../../../shared/routes';
import logo from '../../assets/images/logo.png';

interface BrandProps {
  /** Shows the tagline under the name */
  withTagline?: boolean;
  className?: string;
}

/** Logo + name, linking to the dashboard. Used by the sidebar and the mobile header. */
export const Brand: React.FC<BrandProps> = ({ withTagline = false, className = '' }) => (
  // min-w-0 so the mobile header can squeeze the brand instead of overflowing the
  // viewport; the badge and tagline only appear from sm, where there is room
  <Link to={ROUTES.dashboard} className={`brand flex items-center gap-2 sm:gap-3 min-w-0 ${className}`} aria-label="BillPulse75 - Tổng quan">
    <div className="brand__logo w-9 h-9 sm:w-10 sm:h-10 shrink-0 bg-linear-to-tr p-0.5">
      <div className="brand__logo-mark w-full h-full flex items-center justify-center">
        <img src={logo} alt="" className="w-full h-full object-cover" draggable={false} />
      </div>
    </div>
    <div className="brand__text min-w-0">
      <div className="brand__row flex items-center gap-2 min-w-0">
        <span className="brand__name font-bold text-base sm:text-lg tracking-tight truncate bg-linear-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
          BillPulse75
        </span>
        <span className="brand__currency hidden sm:inline px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase whitespace-nowrap rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
          ₫ VND
        </span>
      </div>
      {withTagline && (
        <p className="brand__tagline hidden sm:block text-xs text-slate-400 truncate">Quét hóa đơn & Theo dõi biến động giá</p>
      )}
    </div>
  </Link>
);
