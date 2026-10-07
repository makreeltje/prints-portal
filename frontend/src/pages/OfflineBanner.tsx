import { WifiOff } from 'lucide-react';
import { t } from '../i18n/nl';
import { useLive } from '../prints/live-context';

/**
 * ScreenSystemStates offline bar: a warning banner under the top of the page
 * while the live connection is down, so the state is visible and not only
 * announced once. The content below stays readable. LiveProvider already
 * toasts the loss and the return, so this adds no toast of its own.
 */
export function OfflineBanner() {
  const { status } = useLive();
  if (status !== 'reconnecting') return null;
  return (
    <div className="pp-alert warning banner" role="status">
      <WifiOff className="pp-ico" aria-hidden="true" />
      <div>{t('live.reconnecting')}</div>
    </div>
  );
}
