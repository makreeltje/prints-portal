import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from './api/client';
import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { AuthProvider } from './auth/AuthContext';
import { useAuth } from './auth/context';
import { LoginPage } from './auth/LoginPage';
import type { AuthMethods } from './auth/types';
import { NewPasswordPage } from './auth/NewPasswordPage';
import { ToastProvider } from './components/Toasts';
import { t } from './i18n/nl';
import { AccessPage } from './pages/AccessPage';
import { ApiDocsPage } from './pages/ApiDocsPage';
import { DocumentTitle, PageTitle } from './pages/PageTitle';
import { GlobalErrorState } from './pages/StatePages';
import { UsersPage } from './pages/UsersPage';
import { DashboardPage } from './prints/DashboardPage';
import { LiveProvider } from './prints/live';
import { SettingsPage } from './finance/SettingsPage';
import { PrintDetailPage } from './prints/PrintDetailPage';
import { InvoicesPage } from './finance/InvoicesPage';
import { QueuePage } from './prints/QueuePage';
import { OutstandingPage } from './finance/OutstandingPage';
import { TagsPage } from './prints/TagsPage';
import { SharePage } from './sharing/SharePage';
import { ShareLinksPage } from './sharing/ShareLinksPage';
import { AppShell } from './shell/AppShell';
import { canSee, NAV_ITEMS } from './shell/navigation';

/** Pages built so far; the others are empty frames that later milestones fill in. */
const pages = (methods: AuthMethods): Partial<Record<string, ReactNode>> => ({
  '/': <DashboardPage />,
  '/gebruikers': (
    <>
      <DocumentTitle title="nav.users" />
      <UsersPage localLogin={methods.local} />
    </>
  ),
  '/instellingen': (
    <>
      <DocumentTitle title="nav.settings" />
      <SettingsPage />
    </>
  ),
  '/wachtrij': (
    <>
      <DocumentTitle title="nav.queue" />
      <QueuePage />
    </>
  ),
  '/openstaand': (
    <>
      <DocumentTitle title="nav.outstanding" />
      <OutstandingPage />
    </>
  ),
  '/facturen': (
    <>
      <DocumentTitle title="nav.invoices" />
      <InvoicesPage />
    </>
  ),
  '/tags': (
    <>
      <DocumentTitle title="nav.tags" />
      <TagsPage />
    </>
  ),
  '/api-docs': (
    <>
      <DocumentTitle title="nav.apiDocs" />
      <ApiDocsPage />
    </>
  ),
  '/deel-links': (
    <>
      <DocumentTitle title="nav.shareLinks" />
      <ShareLinksPage />
    </>
  ),
  '/toegang': (
    <>
      <DocumentTitle title="nav.access" />
      <AccessPage />
    </>
  ),
});

/** Signed out: only the login page. Signed in: the shell with the pages the role may see. */
export function AppRoutes() {
  const { state, retry } = useAuth();

  if (state.status === 'loading') return null;
  if (state.status === 'error') {
    return (
      <main className="pp-center">
        <GlobalErrorState onRetry={retry} withDashboard={false} />
      </main>
    );
  }
  if (state.status === 'signed-out') {
    return (
      <Routes>
        <Route
          path="/login"
          element={<LoginPage methods={state.methods} expired={state.expired} />}
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }
  // A temporary password must be replaced before anything else (ScreenLogin, new password).
  if (state.mustChangePassword) return <NewPasswordPage />;

  const { role } = state.user;
  const built = pages(state.methods);
  return (
    // The server closed the socket because the session ended: any API call now
    // answers 401, which signs out with the "Je sessie is verlopen" notice.
    <LiveProvider onSessionEnded={() => void api('/api/auth/session').catch(() => undefined)}>
      <AppShell>
        <Routes>
          {NAV_ITEMS.map((item) => (
            <Route
              key={item.path}
              path={item.path}
              element={
                canSee(item, role) ? (
                  (built[item.path] ?? <PageTitle title={item.label} />)
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
          ))}
          <Route path="/prints/:id" element={<PrintDetailPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </LiveProvider>
  );
}

/** Data is refetched on live events, so focus refetches are not needed. */
const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 30_000 } },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* The share page is public: no session, no AppShell, the visitor's own theme. */}
          <Route path="/share/:token" element={<SharePage />} />
          <Route
            path="*"
            element={
              <AuthProvider>
                <ToastProvider dismissLabel={t('common.close')}>
                  <AppRoutes />
                </ToastProvider>
              </AuthProvider>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
