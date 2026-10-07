import { useId, useState } from 'react';
import { Dialog } from '../components/Dialog';
import { GenericError } from '../components/FieldError';
import { t } from '../i18n/nl';
import type { Asset, Order } from '../prints/types';

interface PickRow {
  lineId: string;
  name: string;
  /** In no order yet: ticked by default. */
  fresh: boolean;
  times: number;
}

/** One row per counted file or 3MF plate; the count of a reprint starts at its latest order's. */
function rowsOf(assets: readonly Asset[], orders: readonly Order[]): PickRow[] {
  const latest = new Map<string, number>();
  for (const order of [...orders].sort((a, b) => a.number - b.number)) {
    for (const item of order.items ?? []) {
      if (item.lineId !== null) latest.set(item.lineId, item.timesPrinted);
    }
  }
  return assets.flatMap((asset) =>
    asset.lines.map((line) => ({
      lineId: line.id,
      name:
        asset.type === '3mf'
          ? `${asset.fileName} · ${t('asset.plate', { n: line.plateIndex })}`
          : asset.fileName,
      fresh: !line.inOrder,
      times: latest.get(line.id) ?? 1,
    })),
  );
}

/**
 * NabestellingDialog: tick the files (or plates) for a new order and how
 * often each is printed in it. New files are ticked; files from earlier
 * orders can be ticked again (a reprint). Nothing ticked: "Kies minstens
 * één bestand." and the primary button is aria-disabled.
 */
export function NabestellingDialog({
  assets,
  orders,
  onCreate,
  onClose,
}: {
  assets: readonly Asset[];
  orders: readonly Order[];
  onCreate: (items: { lineId: string; timesPrinted: number }[]) => Promise<void>;
  onClose: () => void;
}) {
  const id = useId();
  const [rows] = useState(() => rowsOf(assets, orders));
  const [picked, setPicked] = useState(
    () => new Set(rows.filter((row) => row.fresh).map((row) => row.lineId)),
  );
  const [times, setTimes] = useState(
    () => new Map(rows.map((row) => [row.lineId, String(row.times)])),
  );
  const [empty, setEmpty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const submit = async () => {
    if (picked.size === 0) {
      setEmpty(true);
      return;
    }
    const items = rows
      .filter((row) => picked.has(row.lineId))
      .map((row) => {
        const value = Number(times.get(row.lineId));
        return {
          lineId: row.lineId,
          timesPrinted: Number.isInteger(value) && value >= 1 && value <= 1000 ? value : 1,
        };
      });
    setBusy(true);
    setFailed(false);
    try {
      await onCreate(items);
      setBusy(false);
      onClose();
    } catch {
      setBusy(false);
      setFailed(true);
    }
  };

  const group = (fresh: boolean, label: string) => {
    const list = rows.filter((row) => row.fresh === fresh);
    if (list.length === 0) return null;
    const labelId = `${id}-${fresh ? 'new' : 'old'}`;
    return (
      <div role="group" aria-labelledby={labelId} className="pp-col pp-gap-1">
        <div id={labelId} className="pp-label">
          {label}
        </div>
        {list.map((row, index) => {
          const checked = picked.has(row.lineId);
          return (
            <div key={row.lineId} className="pp-pick">
              <input
                type="checkbox"
                className="pp-check"
                checked={checked}
                aria-label={row.name}
                data-autofocus={fresh && index === 0 ? true : undefined}
                onChange={(event) => {
                  const next = new Set(picked);
                  if (event.target.checked) next.add(row.lineId);
                  else next.delete(row.lineId);
                  setPicked(next);
                  if (next.size > 0) setEmpty(false);
                }}
              />
              <span className="nm" title={row.name}>
                {row.name}
              </span>
              <label className="pp-qty">
                {t('asset.timesPrinted')}
                <input
                  className="pp-input"
                  inputMode="numeric"
                  aria-label={`${t('asset.timesPrinted')}: ${row.name}`}
                  disabled={!checked}
                  value={times.get(row.lineId) ?? '1'}
                  onChange={(event) => {
                    setTimes(new Map(times).set(row.lineId, event.target.value));
                  }}
                />
              </label>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog
      open
      title={t('orders.create')}
      onClose={onClose}
      busy={busy}
      onSubmit={() => void submit()}
      footer={
        <>
          <button
            type="button"
            className="pp-btn pp-btn-secondary"
            disabled={busy}
            onClick={onClose}
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            className="pp-btn pp-btn-primary"
            aria-disabled={picked.size === 0 || undefined}
            disabled={busy}
            aria-busy={busy}
          >
            {busy && <span className="pp-spin" aria-hidden="true" />}
            {t('orders.create')}
          </button>
        </>
      }
    >
      <div className="pp-col">
        {empty && (
          <div className="pp-alert unpaid" role="alert">
            <div>{t('orders.pickOne')}</div>
          </div>
        )}
        {failed && <GenericError />}
        <span className="pp-muted">{t('orders.createIntro')}</span>
        {group(true, t('orders.unassignedGroup'))}
        {group(false, t('orders.previousGroup'))}
      </div>
    </Dialog>
  );
}
