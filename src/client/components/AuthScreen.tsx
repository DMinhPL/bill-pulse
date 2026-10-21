import React, { useEffect, useState } from 'react';
import { Receipt, AtSign, Mail, Lock, User, Ticket, Loader2, AlertCircle, TrendingUp, ScanLine, Sparkles } from 'lucide-react';
import { authApi, AuthUser } from '../utils/api';

export type AuthMode = 'login' | 'register';
type Mode = AuthMode;

interface AuthScreenProps {
  /** Which form to show; driven by the URL (/login or /register) */
  mode: AuthMode;
  onSwitchMode: (mode: AuthMode) => void;
  onAuthenticated: (user: AuthUser) => void;
}

const inputClass =
  'w-full h-11 pl-10 pr-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all';

export const AuthScreen: React.FC<AuthScreenProps> = ({ mode, onSwitchMode, onAuthenticated }) => {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Clear errors and passwords whenever the form changes, including via the back button
  useEffect(() => {
    setError(null);
    setPassword('');
    setConfirmPassword('');
  }, [mode]);

  const switchMode = (next: Mode) => {
    if (next !== mode) onSwitchMode(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'register') {
      if (!/^[a-zA-Z0-9._-]{3,32}$/.test(username)) {
        return setError('Tên đăng nhập cần 3–32 ký tự, chỉ gồm chữ không dấu, số và . _ -');
      }
      if (password.length < 8) return setError('Mật khẩu cần ít nhất 8 ký tự.');
      if (password !== confirmPassword) return setError('Mật khẩu nhập lại không khớp.');
      if (!/^[A-Z0-9]{8}$/.test(invitationCode.trim().toUpperCase())) return setError('Mã mời phải gồm đúng 8 ký tự chữ và số.');
    }

    setSubmitting(true);
    try {
      const { user } =
        mode === 'login'
          ? await authApi.login(username, password)
          : await authApi.register(displayName, username, email, password, invitationCode);
      onAuthenticated(user);
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-10 items-center">
        {/* Brand panel */}
        <div className="hidden lg:block">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-rose-500 via-amber-500 to-emerald-400 p-0.5 shadow-lg shadow-rose-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Receipt className="w-6 h-6 text-amber-400" />
              </div>
            </div>
            <span className="font-bold text-2xl tracking-tight text-white">BillPulse75</span>
          </div>
          <h1 className="text-3xl font-bold text-white leading-tight">
            Biết ngay món nào <span className="text-rose-400">đang tăng giá</span> mỗi lần đi chợ.
          </h1>
          <p className="text-slate-400 mt-4">
            Chụp hóa đơn, AI đọc từng món hàng và so sánh với các lần mua trước của bạn.
          </p>
          <ul className="mt-8 space-y-4 text-sm">
            <li className="flex items-center gap-3 text-slate-300">
              <span className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <ScanLine className="w-4 h-4 text-emerald-400" />
              </span>
              Quét hóa đơn ảnh hoặc PDF bằng Gemini AI
            </li>
            <li className="flex items-center gap-3 text-slate-300">
              <span className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-rose-400" />
              </span>
              Theo dõi biến động giá từng mặt hàng theo VND
            </li>
            <li className="flex items-center gap-3 text-slate-300">
              <span className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-purple-400" />
              </span>
              Gợi ý mua sắm tiết kiệm từ AI
            </li>
          </ul>
        </div>

        {/* Form card */}
        <div className="w-full max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex lg:hidden items-center gap-2 mb-6">
            <Receipt className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-lg text-white">BillPulse75</span>
          </div>

          <h2 className="text-xl font-bold text-white">
            {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {mode === 'login'
              ? 'Chào mừng trở lại! Đăng nhập để xem hóa đơn của bạn.'
              : 'Tài khoản mới sẽ có sẵn vài hóa đơn mẫu để bạn trải nghiệm.'}
          </p>

          {/* Mode switch */}
          <div className="grid grid-cols-2 gap-1 p-1 mt-6 rounded-xl bg-slate-950 border border-slate-800">
            {(['login', 'register'] as Mode[]).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`h-9 rounded-lg text-sm font-medium transition-all ${mode === m ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                {m === 'login' ? 'Đăng nhập' : 'Đăng ký'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === 'register' && (
              <label className="block">
                <span className="text-xs font-medium text-slate-300">Tên hiển thị</span>
                <div className="relative mt-1.5">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    maxLength={80}
                    autoComplete="name"
                    className={inputClass}
                  />
                </div>
              </label>
            )}

            {mode === 'register' && (
              <label className="block">
                <span className="text-xs font-medium text-slate-300">Mã mời</span>
                <div className="relative mt-1.5">
                  <Ticket className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={invitationCode}
                    onChange={e => setInvitationCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
                    placeholder="ABCDEFGH"
                    maxLength={8}
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    className={`${inputClass} tracking-[0.2em]`}
                  />
                </div>
              </label>
            )}

            <label className="block">
              <span className="text-xs font-medium text-slate-300">Tên đăng nhập</span>
              <div className="relative mt-1.5">
                <AtSign className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value.trim())}
                  placeholder="vd: minhpham"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={32}
                  className={inputClass}
                />
              </div>
              {mode === 'register' && (
                <span className="block text-[11px] text-slate-500 mt-1">
                  3–32 ký tự: chữ không dấu, số và . _ -
                </span>
              )}
            </label>

            {mode === 'register' && (
              <label className="block">
                <span className="text-xs font-medium text-slate-300">Email</span>
                <div className="relative mt-1.5">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="ban@email.com"
                    autoComplete="email"
                    className={inputClass}
                  />
                </div>
              </label>
            )}

            <label className="block">
              <span className="text-xs font-medium text-slate-300">Mật khẩu</span>
              <div className="relative mt-1.5">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'Ít nhất 8 ký tự' : '••••••••'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className={inputClass}
                />
              </div>
            </label>

            {mode === 'register' && (
              <label className="block">
                <span className="text-xs font-medium text-slate-300">Nhập lại mật khẩu</span>
                <div className="relative mt-1.5">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    className={inputClass}
                  />
                </div>
              </label>
            )}

            {error && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
            </button>
          </form>

          <p className="text-sm text-slate-400 text-center mt-6">
            {mode === 'login' ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
            <button
              type="button"
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              className="text-emerald-400 hover:text-emerald-300 font-medium"
            >
              {mode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
