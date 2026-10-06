import { TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { t } from '../i18n/nl';

/** FormField error line, linked from its input with aria-describedby. */
export function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <span id={id} className="pp-err" role="alert">
      <TriangleAlert className="pp-ico" aria-hidden="true" />
      {children}
    </span>
  );
}

/** "Er ging iets mis" alert inside a form or dialog. */
export function GenericError() {
  return (
    <div className="pp-alert unpaid" role="alert">
      <TriangleAlert className="pp-ico" aria-hidden="true" />
      <div>{t('error.generic')}</div>
    </div>
  );
}
