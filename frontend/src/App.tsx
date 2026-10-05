import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { AuthProvider } from './auth/AuthContext';
import { useAuth } from './auth/context';
import { LoginPage } from './auth/LoginPage';
import { ToastProvider } from './components/Toasts';
import { t } from './i18n/nl';
import { AccessPage } from './pages/AccessPage';
import { DocumentTitle, PageTitle } from './pages/PageTitle';
import { UsersPage } from './pages/UsersPage';
import { ErrorState } from './pages/ErrorState';
import { AppShell } from './shell/AppShell';
import { canSee, NAV_ITEMS } from './shell/navigation';

/** Pages built so far; the others are empty frames that later milestones fill in. */
const PAGES: Partial<Record<string, ReactNode>> = {
  '/gebruikers': (
    <>
      <DocumentTitle title="nav.users" />
      <UsersPage />
    </>
  ),
  '/toegang': (
    <>
      <DocumentTitle title="nav.access" />
      <AccessPage />
    </>
  ),
};

/** Signed out: only the login page. Signed in: the shell with the pages the role may see. */
export function AppRoutes() {
  const { state, retry } = useAuth();

  if (state.status === 'loading') return null;
  if (state.status === 'error') {
    return (
      <main className="pp-center">
        <ErrorState body={t('system.errorBody')} onRetry={retry} />
      </main>
    );
  }
  if (state.status === 'signed-out') {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage methods={state.methods} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const { role } = state.user;
  return (
    <AppShell>
      <Routes>
        {NAV_ITEMS.map((item) => (
          <Route
            key={item.path}
            path={item.path}
            element={
              canSee(item, role) ? (
                (PAGES[item.path] ?? <PageTitle title={item.label} />)
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}

export function App() {
  return (
    <AuthProvider>
      <ToastProvider dismissLabel={t('common.close')}>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
