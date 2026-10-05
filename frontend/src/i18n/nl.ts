/**
 * Every user-facing string, in Dutch. Keys follow design-system/copy-deck.md;
 * keys marked "component copy" come from the "Dutch copy" line of the named
 * component README because the copy deck has no key for them.
 */
export const nl = {
  'common.cancel': 'Annuleren',
  'common.delete': 'Verwijderen',
  'common.close': 'Sluiten',
  'common.retry': 'Opnieuw proberen',
  'common.loading': 'Laden…',
  'common.selectAll': 'Alles selecteren',
  'common.selectNone': 'Niets selecteren',

  'app.name': '3D Prints Portal', // product name from design-system/README.md; replaced by the studio name from Instellingen in M6

  'nav.dashboard': 'Dashboard',
  'nav.outstanding': 'Openstaand',
  'nav.invoices': 'Facturen',
  'nav.manage': 'Beheer',
  'nav.shareLinks': 'Deel-links',
  'nav.access': 'Toegang',
  'nav.users': 'Gebruikers',
  'nav.settings': 'Instellingen',
  'nav.apiDocs': 'API-docs',
  'nav.main': 'Hoofdmenu', // component copy: AppShell (aria-label)

  'system.skipToContent': 'Naar inhoud',
  'system.goDashboard': 'Naar dashboard',
  'system.errorBody': 'De pagina kon niet worden geladen. Probeer het opnieuw.',
  'system.logout': 'Uitloggen', // component copy: AppShell
  'system.menu': 'Menu',
  'system.more': 'Meer',

  'auth.login': 'Inloggen',
  'auth.email': 'E-mailadres',
  'auth.password': 'Wachtwoord',
  'auth.or': 'of',
  'auth.authentik': 'Inloggen met Authentik',
  'auth.wrong': 'Verkeerd e-mailadres of wachtwoord.',
  'auth.redirecting': 'Doorsturen naar Authentik…',

  'users.title': 'Gebruikers',
  'users.create': 'Gebruiker maken',
  'users.user': 'Gebruiker', // component copy: AccessMatrix
  'users.role': 'Rol',
  'users.roleFor': 'Rol {name}', // component copy: ScreenUsers (aria-label)
  'users.origin': 'Herkomst',
  'users.local': 'Lokaal',
  'users.authentik': 'Authentik',
  'users.actions': 'Acties', // component copy: ScreenUsers (table header)
  'users.resetPassword': 'Wachtwoord resetten',
  'users.tempPassword': 'Tijdelijk wachtwoord',
  'users.lastAdmin': 'Er moet minstens één Admin blijven.',

  'role.Admin': 'Admin', // component copy: Avatar
  'role.Editor': 'Editor', // component copy: Avatar
  'role.User': 'User', // component copy: Avatar

  'access.title': 'Toegang',
  'access.adminAlways': 'Admin heeft altijd toegang',
  'access.adminAlwaysNote': 'Admin heeft altijd toegang.', // component copy: ScreenAccess (note under the matrix)
  'access.cell': '{user}: {customer}', // component copy: AccessMatrix (checkbox label)

  'confirm.deleteUser': "Gebruiker '{name}' verwijderen?",

  'error.generic': 'Er ging iets mis',
  'error.saveFailed': 'Opslaan mislukt, de wijziging is teruggedraaid.',
  'error.tooManyAttempts': 'Te veel pogingen, probeer het over een minuut opnieuw',
  'toast.saved': 'Opgeslagen',

  'settings.theme': 'Thema',
  'settings.theme.system': 'Systeem', // component copy: ScreenSettings
  'settings.theme.light': 'Licht', // component copy: ScreenSettings
  'settings.theme.dark': 'Donker', // component copy: ScreenSettings
} as const;

export type MessageKey = keyof typeof nl;

/** Looks up a string and fills `{name}` placeholders. */
export function t(key: MessageKey, values: Readonly<Record<string, string | number>> = {}): string {
  return nl[key].replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = values[name];
    return value === undefined ? match : String(value);
  });
}
