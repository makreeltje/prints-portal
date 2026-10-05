import { t } from '../i18n/nl';
import type { Role } from '../auth/types';
import { initials } from './initials';

/** Avatar: initials pill, name and (optionally) role. */
export function Avatar({ name, role }: { name: string; role?: Role }) {
  return (
    <span className="pp-avatar">
      <span className="pp-ini" aria-hidden="true">
        {initials(name)}
      </span>
      <span>
        <b>{name}</b>
        {role !== undefined && <small>{t(`role.${role}`)}</small>}
      </span>
    </span>
  );
}
