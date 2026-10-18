import React from 'react';
import { Link } from 'react-router';
import { usePageTitle } from '../context/AppDataContext';
import { ROUTES } from '../routes';

/** Client-side fallback; the server already answers 404 for unknown URLs. */
export const NotFoundPage: React.FC = () => {
  usePageTitle('Không tìm thấy trang');
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-center px-4">
      <div>
        <p className="text-5xl font-extrabold text-white">404</p>
        <p className="text-slate-300 mt-2 mb-6">Không tìm thấy trang bạn yêu cầu.</p>
        <Link to={ROUTES.dashboard} className="text-emerald-400 font-semibold hover:text-emerald-300">
          ← Về trang chủ BillPulse
        </Link>
      </div>
    </div>
  );
};
