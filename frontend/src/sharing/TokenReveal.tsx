import { Check, Copy, TriangleAlert } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Dialog } from '../components/Dialog';
import { FieldError } from '../components/FieldError';
import { t } from '../i18n/nl';

const COPIED_MS = 2000;

/**
 * TokenReveal: the full Deel-link URL, shown exactly once. Kopiëren turns
 * into "Gekopieerd" for two seconds; when the clipboard is unavailable the
 * URL is selected for copying by hand. Closing without copying asks first
 * (GAP-050 placeholder copy).
 */
export function TokenReveal({ url, onClose }: { url: string; onClose: () => void }) {
  const id = useId();
  const code = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  const [everCopied, setEverCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => {
      setCopied(false);
    }, COPIED_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [copied]);

  const selectUrl = () => {
    const element = code.current;
    const selection = window.getSelection();
    if (element === null || selection === null) return;
    const range = document.createRange();
    range.selectNodeContents(element);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setFailed(false);
      setCopied(true);
      setEverCopied(true);
    } catch {
      setFailed(true);
      selectUrl();
      code.current?.focus();
    }
  };

  const requestClose = () => {
    if (everCopied) onClose();
    else setConfirmClose(true); // ds-gap: GAP-050
  };

  const [first, ...rest] = t('share.onceWarning').split('. ');
  return (
    <>
      <Dialog
        open={!confirmClose}
        title={t('share.created')}
        onClose={requestClose}
        footer={
          <button type="button" className="pp-btn pp-btn-secondary" onClick={requestClose}>
            {t('common.close')}
          </button>
        }
      >
        <div className="pp-col pp-gap-3">
          <div className="pp-alert warning" role="alert">
            <TriangleAlert className="pp-ico" aria-hidden="true" />
            <div>
              <strong>{`${first ?? ''}.`}</strong> {rest.join('. ')}
            </div>
          </div>
          <div className="pp-token">
            <code ref={code} tabIndex={0} aria-describedby={`${id}-hint`}>
              {url}
            </code>
            <button
              type="button"
              className="pp-btn pp-btn-primary"
              data-autofocus
              onClick={() => void copy()}
            >
              {copied ? (
                <Check className="pp-ico" aria-hidden="true" />
              ) : (
                <Copy className="pp-ico" aria-hidden="true" />
              )}
              {copied ? t('common.copied') : t('common.copy')}
            </button>
          </div>
          <span className="pp-sr" role="status">
            {copied ? t('common.copied') : ''}
          </span>
          {failed && <FieldError id={`${id}-failed`}>{t('share.copyFailed')}</FieldError>}
          <span id={`${id}-hint`} className="pp-help">
            {t('share.hint')}
          </span>
        </div>
      </Dialog>
      <ConfirmDialog
        open={confirmClose}
        title={t('share.closeUncopied')} // ds-gap: GAP-050
        body={t('share.closeUncopiedBody')} // ds-gap: GAP-050
        confirmLabel={t('common.close')}
        cancelLabel={t('common.back')} // ds-gap: GAP-050
        onConfirm={() => {
          onClose();
          return Promise.resolve();
        }}
        onClose={() => {
          setConfirmClose(false);
        }}
      />
    </>
  );
}
