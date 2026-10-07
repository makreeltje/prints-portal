import { useQuery } from '@tanstack/react-query';
import { RotateCw, TriangleAlert } from 'lucide-react';
import { lazy, Suspense, useMemo } from 'react';
import { api } from '../api/client';
import { t } from '../i18n/nl';
import { useResolvedTheme } from '../theme/useTheme';
import { LoadingRows } from './ErrorState';

/**
 * ScreenApiDocs (`/api-docs`): the page frame around the rendered OpenAPI
 * document. The document comes from the app itself, so "Test request" runs
 * against the live API with the visitor's own session (ds-gap: GAP-056, the
 * design system still describes Swagger UI here). Scalar renders with
 * `theme: 'none'`; `app.css` maps its variables onto our tokens.
 */
/**
 * The renderer is a large dependency and this page is opened rarely, so it
 * loads only when the page does.
 */
const ApiReference = lazy(async () => {
  // Layout only: `theme: 'none'` leaves the colours to the tokens in app.css.
  await import('@scalar/api-reference-react/style.css');
  return { default: (await import('@scalar/api-reference-react')).ApiReferenceReact };
});

export function ApiDocsPage() {
  const resolved = useResolvedTheme();
  const spec = useQuery({
    queryKey: ['openapi'],
    queryFn: () => api<Record<string, unknown>>('/api/openapi.json'),
    staleTime: Infinity,
  });

  const configuration = useMemo(
    () => ({
      content: spec.data,
      // Our own tokens style everything; Scalar adds no colours of its own.
      theme: 'none' as const,
      withDefaultFonts: false,
      darkMode: resolved === 'dark',
      hideDarkModeToggle: true,
      // This app is self-hosted and talks to nothing else: no AI assistant and
      // none of Scalar's Configure, Share or Deploy tools.
      agent: { disabled: true },
      showDeveloperTools: 'never' as const,
      // "Test request" runs same-origin, so the session cookie rides along.
      hideTestRequestButton: false,
    }),
    [spec.data, resolved],
  );

  return (
    <>
      <div className="pp-ph">
        <h1>{t('nav.apiDocs')}</h1>
      </div>
      <div className="pp-card pp-flush app-api">
        {spec.isPending ? (
          <LoadingRows rows={4} />
        ) : spec.isError ? (
          <div className="pp-state is-inline" role="alert">
            <span className="pp-unpaid">
              <TriangleAlert className="pp-ico pp-ico-24" aria-hidden="true" />
            </span>
            <h2>{t('api.loadError')}</h2>
            <p>{t('api.loadErrorBody')}</p>
            <div className="acts">
              <button
                type="button"
                className="pp-btn pp-btn-primary"
                onClick={() => void spec.refetch()}
              >
                <RotateCw className="pp-ico" aria-hidden="true" />
                {t('common.retry')}
              </button>
            </div>
          </div>
        ) : (
          <Suspense fallback={<LoadingRows rows={4} />}>
            <ApiReference configuration={configuration} />
          </Suspense>
        )}
      </div>
    </>
  );
}
