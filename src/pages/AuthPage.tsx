import React from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { useAppData, usePageTitle } from '../context/AppDataContext';
import { AuthScreen, AuthMode } from '../components/AuthScreen';
import { FullScreenSpinner } from '../layouts/AppLayout';
import { ROUTES, safeRedirect } from '../routes';

/** /login and /register. Signed-in users are sent on to where they were going. */
export const AuthPage: React.FC<{ mode: AuthMode }> = ({ mode }) => {
  const { user, setUser } = useAppData();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  usePageTitle(mode === 'login' ? 'Đăng nhập' : 'Đăng ký');

  if (user === undefined) return <FullScreenSpinner />;
  if (user) return <Navigate to={safeRedirect(params.get('redirect'))} replace />;

  return (
    <AuthScreen
      mode={mode}
      // Keep ?redirect= when switching between login and register
      onSwitchMode={next =>
        navigate({ pathname: next === 'login' ? ROUTES.login : ROUTES.register, search: params.toString() })
      }
      onAuthenticated={setUser}
    />
  );
};
