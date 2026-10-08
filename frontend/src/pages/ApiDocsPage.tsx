import { useQuery } from '@tanstack/react-query';
import { RotateCw, TriangleAlert } from 'lucide-react';
import { lazy, Suspense, useEffect, useMemo, useRef } from 'react';
import { api } from '../api/client';
import { t } from '../i18n/nl';
import { useResolvedTheme } from '../theme/useTheme';
import { LoadingRows } from './ErrorState';

/**
 * ScreenApiDocs (`/api-docs`): the page frame around the rendered OpenAPI
 * document. The document comes from the app itself, so "Test request" runs
 * against the live API with the visitor's own session. Scalar renders with
 * `theme: 'none'` and takes every colour, font, radius and shadow from the
 * design system's own `.pp-scalar` mapping in `bundle.css`.
 */
/**
 * Scalar lays its endpoint list out as a sideways-scrolling `ul` on a phone,
 * and that list holds no focusable element of its own, so a keyboard user
 * cannot scroll it (axe: scrollable-region-focusable). The markup is Scalar's,
 * so we mark it after it renders, the same way our own wide tables are marked.
 * ScreenApiDocs 1.8 makes this the rule for any screen a third-party renderer
 * draws: the app makes a region the renderer leaves scrollable and unfocusable
 * focusable and labelled, with `role="region"` on generic elements only.
 */
function useScrollableRegions(host: React.RefObject<HTMLDivElement | null>, label: string): void {
  useEffect(() => {
    const root = host.current;
    if (root === null) return;

    const isTabbable = (el: Element): boolean =>
      el.matches('a[href], button:not([disabled]), input, select, textarea, [tabindex]') &&
      (el.getAttribute('tabindex') ?? '0') !== '-1';

    const mark = (): void => {
      for (const el of root.querySelectorAll<HTMLElement>('*')) {
        const style = getComputedStyle(el);
        const scrolls =
          (el.scrollWidth > el.clientWidth + 1 && /auto|scroll/.test(style.overflowX)) ||
          (el.scrollHeight > el.clientHeight + 1 && /auto|scroll/.test(style.overflowY));
        const needsRegion = scrolls && ![...el.querySelectorAll('*')].some(isTabbable);
        if (needsRegion && el.dataset.ppRegion === undefined) {
          // Only a generic element gets `region`: on a list it would replace the
          // implicit `list` role and orphan every `li` inside it.
          const generic = el.tagName === 'DIV' || el.tagName === 'SPAN';
          el.dataset.ppRegion = generic ? 'region' : 'plain';
          el.tabIndex = 0;
          if (generic) el.setAttribute('role', 'region');
          el.setAttribute('aria-label', label);
        } else if (!needsRegion && el.dataset.ppRegion !== undefined) {
          // A wider window: the region no longer scrolls, so drop the tab stop.
          if (el.dataset.ppRegion === 'region') el.removeAttribute('role');
          delete el.dataset.ppRegion;
          el.removeAttribute('tabindex');
          el.removeAttribute('aria-label');
        }
      }
    };

    let frame = 0;
    const schedule = (): void => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(mark);
    };

    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(root, { childList: true, subtree: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', schedule);
    };
  }, [host, label]);
}

/**
 * The renderer is a large dependency and this page is opened rarely, so it
 * loads only when the page does.
 */
const ApiReference = lazy(async () => {
  // Layout only: `theme: 'none'` leaves every colour to `.pp-scalar`.
  await import('@scalar/api-reference-react/style.css');
  return { default: (await import('@scalar/api-reference-react')).ApiReferenceReact };
});

export function ApiDocsPage() {
  const resolved = useResolvedTheme();
  const card = useRef<HTMLDivElement>(null);
  useScrollableRegions(card, t('api.title'));
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
        <h1>{t('api.title')}</h1>
      </div>
      {/* A renderer with its own frame fills the content area through the
          page padding; only the heading keeps it (GAP-102). */}
      <div className="pp-scalar pp-bleed" ref={card}>
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
