import { useQueryClient } from '@tanstack/react-query';
import { ImageIcon } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { ApiError } from '../api/client';
import { FieldError } from '../components/FieldError';
import { t } from '../i18n/nl';
import { logoKey } from '../shell/logo';
import { logoUrl, uploadLogo } from './api';

const MAX_BYTES = 1024 * 1024;

/**
 * Logo (optioneel) in Bedrijfsgegevens: the `pp-logo-box` shows the logo
 * (or an icon when empty) and "Logo uploaden" picks a PNG or SVG. The
 * server keeps a PNG; it replaces the name on documents and in the AppShell.
 */
export function LogoField() {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [version, setVersion] = useState(0);
  const [present, setPresent] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    void fetch(logoUrl, { method: 'HEAD', credentials: 'same-origin' })
      .then((response) => {
        if (active) setPresent(response.ok);
      })
      .catch(() => {
        if (active) setPresent(false);
      });
    return () => {
      active = false;
    };
  }, [version]);

  const pick = async (file: File | undefined) => {
    if (file === undefined) return;
    const supported = file.type === 'image/png' || file.type === 'image/svg+xml';
    if (!supported || file.size > MAX_BYTES) {
      setFailed(true);
      return;
    }
    setBusy(true);
    setFailed(false);
    try {
      await uploadLogo(file);
      setVersion(version + 1);
      await queryClient.invalidateQueries({ queryKey: logoKey });
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      setFailed(true);
    } finally {
      setBusy(false);
      if (input.current !== null) input.current.value = '';
    }
  };

  return (
    <div className="pp-field" role="group" aria-labelledby={`${id}-label`}>
      <span id={`${id}-label`} className="pp-label">
        {t('settings.logoOptional')}
      </span>
      <div className="pp-row pp-gap-3">
        <span className="pp-logo-box">
          {present === true ? (
            <img className="app-logo-img" src={`${logoUrl}?v=${String(version)}`} alt="" />
          ) : (
            <ImageIcon className="pp-ico" aria-hidden="true" />
          )}
        </span>
        <input
          ref={input}
          id={`${id}-file`}
          type="file"
          className="pp-sr"
          aria-label={t('settings.logoUpload')}
          accept="image/png,image/svg+xml"
          aria-describedby={failed ? `${id}-err ${id}-help` : `${id}-help`}
          onChange={(event) => void pick(event.target.files?.[0])}
        />
        <button
          type="button"
          className="pp-btn pp-btn-secondary"
          disabled={busy}
          aria-busy={busy}
          onClick={() => input.current?.click()}
        >
          {busy && <span className="pp-spin" aria-hidden="true" />}
          {t('settings.logoUpload')}
        </button>
      </div>
      <span id={`${id}-help`} className="pp-help">
        {t('settings.logoHelp')}
      </span>
      {failed && <FieldError id={`${id}-err`}>{t('error.generic')}</FieldError>}
    </div>
  );
}
