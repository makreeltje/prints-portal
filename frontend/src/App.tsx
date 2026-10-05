import { BrowserRouter, Route, Routes } from 'react-router';
import { PageTitle } from './pages/PageTitle';
import { AppShell } from './shell/AppShell';
import { NAV_ITEMS } from './shell/navigation';

/** Each page is an empty frame for now; the milestones fill them in. */
export function AppRoutes() {
  return (
    <AppShell>
      <Routes>
        {NAV_ITEMS.map((item) => (
          <Route key={item.path} path={item.path} element={<PageTitle title={item.label} />} />
        ))}
      </Routes>
    </AppShell>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
