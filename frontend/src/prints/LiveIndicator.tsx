import { t } from '../i18n/nl';
import { useLive } from './live-context';

/** LiveIndicator: green dot "Live", or a warning ring while reconnecting. */
export function LiveIndicator({ dotOnly = false }: { dotOnly?: boolean }) {
  const { status } = useLive();
  const off = status === 'reconnecting';
  const label = off ? t('live.reconnecting') : t('live.connected');
  if (status === 'connecting') return <span />;
  return (
    <span className={off ? 'pp-live off' : 'pp-live'} role="status">
      <i />
      {dotOnly ? <span className="pp-sr">{label}</span> : label}
    </span>
  );
}
