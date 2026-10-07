import { useQuery } from '@tanstack/react-query';
import { logoUrl } from '../finance/api';

export const logoKey = ['settings', 'logo'] as const;

/** Resolves to a cache-busted URL once the logo has loaded, or null when there is none. */
async function loadLogo(): Promise<string | null> {
  const head = await fetch(logoUrl, { method: 'HEAD', credentials: 'same-origin' });
  if (!head.ok) return null;
  const src = `${logoUrl}?v=${String(Date.now())}`;
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      resolve(src);
    };
    image.onerror = () => {
      resolve(null);
    };
    image.src = src;
  });
}

/**
 * The uploaded logo for the AppShell (1.5). Null without a logo and while
 * it loads or fails, so the studio name shows until the image is ready.
 */
export function useLogo(): string | null {
  const query = useQuery({
    queryKey: logoKey,
    queryFn: loadLogo,
    staleTime: Infinity,
    retry: false,
  });
  return query.data ?? null;
}
