import React from 'react';
import { Link } from 'react-router';
import { SearchX } from 'lucide-react';

interface NotFoundStateProps {
  title?: string;
  message: string;
  backTo: string;
  backLabel: string;
}

/** In-page "not found" block, e.g. for a bill or product URL that no longer exists. */
export const NotFoundState: React.FC<NotFoundStateProps> = ({ title = 'Không tìm thấy', message, backTo, backLabel }) => (
  <div className="not-found text-center py-16 bg-slate-900/60 rounded-2xl border border-slate-800">
    <SearchX className="w-8 h-8 text-slate-500 mx-auto" />
    <h2 className="not-found__title text-lg font-bold text-white mt-3">{title}</h2>
    <p className="not-found__message text-sm text-slate-400 mt-1">{message}</p>
    <Link
      to={backTo}
      className="not-found__back inline-flex mt-5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
    >
      {backLabel}
    </Link>
  </div>
);
