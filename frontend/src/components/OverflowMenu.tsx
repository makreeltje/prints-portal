import { Ellipsis } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useAnchoredPanel } from './anchoredPanel';
import { Portal } from './Portal';
import { t } from '../i18n/nl';

export interface MenuItem {
  key: string;
  label: string;
  icon: ReactNode;
  /** Drawn in `unpaid`; the system puts a destructive item last. */
  danger?: boolean;
  /** A divider is drawn above this item. */
  separated?: boolean;
  run: () => void;
}

/**
 * OverflowMenu (design system 1.9, GAP-075): the actions that are rare or hard
 * to undo, so they stop competing with the screen's main action. Choosing a
 * destructive item only opens the caller's ConfirmDialog; nothing happens here.
 */
export function OverflowMenu({ items, label }: { items: MenuItem[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panel.current?.contains(target) === true || trigger.current?.contains(target) === true) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };

  /*
    Window-placed and portalled out of the card: a `.at` panel is a child of
    the nearest open `<dialog>`, else of `<body>` (README *Floating panels*
    rule 9, 2.13; GAP-146 resolved).

    The card's own rule
    `.pp-cust .acts .pp-btn,.pp-cust .end .pp-anchor{position:relative;z-index:1}`
    lifts both above the tile's stretched link, and in doing so gives the
    wrapper a stacking context. `.pp-pop`'s z-index 30 is then compared only
    inside that wrapper, so a Factuur button at z-index 1 — in this card or
    the next one along — wins on DOM order and paints over the menu.

    `position: fixed` alone does not help: a fixed box escapes *clipping*, not
    its ancestors' stacking contexts, and `.pp-lift` carries `z-index: 1` just
    as `.pp-anchor` does. The panel has to leave the card entirely, which is
    the same reasoning that makes the model strip's bubble a sibling of
    `.pp-models` rather than a child.
  */
  useAnchoredPanel(panel, trigger, open, close);

  if (items.length === 0) return null;

  /** Up and down walk the items, as a menu is expected to. */
  const onPanelKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      close();
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const all = [
      ...(panel.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []),
    ];
    const here = all.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.key === 'ArrowDown' ? here + 1 : here - 1;
    all[(next + all.length) % all.length]?.focus();
  };

  return (
    <span className="pp-lift">
      <button
        ref={trigger}
        type="button"
        className="pp-btn pp-btn-ghost pp-btn-icon"
        aria-label={label ?? t('menu.more')}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          setOpen((current) => !current);
        }}
      >
        <Ellipsis className="pp-ico" aria-hidden="true" />
      </button>
      {open && (
        <Portal from={trigger}>
          <div
            ref={panel}
            className="pp-pop pp-menu at"
            role="menu"
            aria-label={label ?? t('menu.more')}
            onKeyDown={onPanelKeyDown}
          >
            {items.map((item) => (
              <div key={item.key}>
                {item.separated === true && <hr className="sep" />}
                <button
                  type="button"
                  role="menuitem"
                  className={item.danger === true ? 'danger' : undefined}
                  onClick={() => {
                    close();
                    item.run();
                  }}
                >
                  {item.icon}
                  {item.label}
                </button>
              </div>
            ))}
          </div>
        </Portal>
      )}
    </span>
  );
}
