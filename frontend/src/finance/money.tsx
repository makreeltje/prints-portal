import { Ban, CircleCheck, CircleDashed, Clock, Receipt, TriangleAlert } from 'lucide-react';
import type { CSSProperties } from 'react';
import { formatMoney } from '../i18n/format';
import { t, type MessageKey } from '../i18n/nl';
import type { OrderStatus, Spool } from '../prints/types';

/** MoneyDisplay: tabular figures, € 1.234,56. */
export function Money({ amount, suggested = false }: { amount: number; suggested?: boolean }) {
  return (
    <span className="pp-money">
      {formatMoney(amount)}
      {suggested && <span className="pp-hint">{t('money.suggested')}</span>}
    </span>
  );
}

const BADGES: Record<OrderStatus, { tone: string; label: MessageKey; Icon: typeof CircleCheck }> = {
  paid: { tone: 'paid', label: 'status.paid', Icon: CircleCheck },
  open: { tone: 'unpaid', label: 'status.unpaid', Icon: Clock },
  partial: { tone: 'unpaid', label: 'status.partiallyPaid', Icon: CircleDashed },
  writtenOff: { tone: 'unpaid', label: 'status.writtenOff', Icon: Ban },
  noPrice: { tone: 'warning', label: 'status.noPrice', Icon: TriangleAlert },
  notBilled: { tone: 'neutral', label: 'status.notBilled', Icon: Receipt },
};

/** StatusBadge for payment and billing: always an icon and a word. */
export function PaymentBadge({ status }: { status: OrderStatus }) {
  const { tone, label, Icon } = BADGES[status];
  return (
    <span className={`pp-badge ${tone}`}>
      <Icon className="pp-ico" aria-hidden="true" />
      {t(label)}
    </span>
  );
}

/**
 * SpoolSwatch: a spool's colour as a disc (two halves for coaxial
 * multi-colour, a blend for longitudinal), the hatch for "Geen spoel".
 * Colours are user data, passed as the per-instance --c1/--c2.
 */
export function SpoolSwatch({ spool, large = false }: { spool: Spool | null; large?: boolean }) {
  const size = large ? ' lg' : '';
  if (spool === null || (spool.colour === null && spool.colours.length === 0)) {
    return <span className={`pp-spool none${size}`} aria-hidden="true" />;
  }
  const c1 = spool.colours[0] ?? spool.colour ?? '';
  const c2 = spool.colours[1] ?? c1;
  const kind =
    spool.colours.length > 1
      ? spool.multiColourDirection === 'longitudinal'
        ? ' grad'
        : ' multi'
      : '';
  return (
    <span
      className={`pp-spool${kind}${size}`}
      aria-hidden="true"
      style={{ '--c1': c1, '--c2': c2 } as CSSProperties}
    />
  );
}
