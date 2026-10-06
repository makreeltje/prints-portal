/**
 * Every user-facing string, in Dutch. Keys follow design-system/copy-deck.md;
 * keys marked "component copy" come from the "Dutch copy" line of the named
 * component README because the copy deck has no key for them.
 */
export const nl = {
  'common.save': 'Opslaan',
  'common.cancel': 'Annuleren',
  'common.create': 'Maken', // component copy: Dialog
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
  'nav.tags': 'Tags',
  'nav.main': 'Hoofdmenu', // component copy: AppShell (aria-label)

  'system.skipToContent': 'Naar inhoud',
  'system.goDashboard': 'Naar dashboard',
  'system.forbiddenHelp': 'Je hebt geen toegang tot deze klant. Vraag een beheerder om toegang.',
  'system.errorBody': 'De pagina kon niet worden geladen. Probeer het opnieuw.',
  'system.menu': 'Menu',
  'system.more': 'Meer',

  'auth.login': 'Inloggen',
  'auth.identifier': 'E-mailadres of naam',
  'auth.password': 'Wachtwoord',
  'auth.or': 'of',
  'auth.authentik': 'Inloggen met Authentik',
  'auth.wrong': 'Verkeerd e-mailadres, naam of wachtwoord.',
  'auth.oidcFailed': 'Inloggen met Authentik is mislukt. Probeer het opnieuw.',
  'auth.sessionExpired': 'Je sessie is verlopen. Log opnieuw in.',
  'auth.newPasswordTitle': 'Nieuw wachtwoord kiezen',
  'auth.newPasswordIntro':
    'Je gebruikt een tijdelijk wachtwoord. Kies een eigen wachtwoord om verder te gaan.',
  'auth.newPassword': 'Nieuw wachtwoord',
  'auth.repeatPassword': 'Herhaal wachtwoord',
  'auth.passwordHelp': 'Minstens 12 tekens.',
  'auth.logout': 'Uitloggen',
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
  'users.tempPasswordHelp':
    'Minstens 12 tekens. De gebruiker kiest bij de eerste keer inloggen een eigen wachtwoord.',
  'users.resetTitle': "Wachtwoord resetten voor '{name}'",
  'users.lastAdmin': 'Er moet minstens één Admin blijven.',

  'role.Admin': 'Admin', // component copy: Avatar
  'role.Editor': 'Editor', // component copy: Avatar
  'role.User': 'User', // component copy: Avatar

  'access.title': 'Toegang',
  'access.allAccessRoles': 'Admin en Editor hebben altijd toegang.',
  'access.cell': '{user}: {customer}', // component copy: AccessMatrix (checkbox label)

  'confirm.deleteUser': "Gebruiker '{name}' verwijderen?",
  'confirm.deleteUserBody': 'Deze gebruiker kan daarna niet meer inloggen.',

  'error.generic': 'Er ging iets mis',
  'error.noAccess': 'Geen toegang tot deze klant',
  'error.saveFailed': 'Opslaan mislukt, de wijziging is teruggedraaid.',
  'error.passwordTooShort': 'Kies een wachtwoord van minstens 12 tekens.',
  'error.passwordMismatch': 'De wachtwoorden zijn niet gelijk.',
  'error.userExists': 'Deze gebruiker bestaat al.',
  'error.required': 'Dit veld is verplicht.',
  'error.tooManyAttempts': 'Te veel pogingen, probeer het over een minuut opnieuw',
  'toast.saved': 'Opgeslagen',

  'common.restore': 'Herstellen',
  'common.download': 'Downloaden',
  'common.loadMore': 'Meer laden',
  'common.count': '{shown} van {total} prints',
  'common.allLoaded': 'Alle prints geladen',
  'common.clearFilters': 'Filters wissen',
  'common.search.placeholder': 'Zoek op naam, klant of tag',
  'common.search.label': 'Zoeken',
  'common.search.clear': 'Wis zoekopdracht',

  'view.cards': 'Kaarten',
  'view.list': 'Lijst',
  'view.label': 'Weergave',

  'status.archived': 'Gearchiveerd',
  'status.deleted': 'Verwijderd',

  'tags.label': 'Tags',
  'tags.labelCount': 'Tags ({count})', // component copy: FilterBar preview
  'tags.add': 'Tag toevoegen',
  'tags.remove': '{tag} verwijderen',
  'tags.andHint': 'Toont prints met alle gekozen tags (EN)',
  'tags.edit': 'Tags bewerken',
  'tags.removedFromFilter': '{tag} verwijderd uit filter', // component copy: FilterBar (announcement)
  'tags.searchOrCreate': 'Zoek of maak een tag',
  'tags.create': "Tag '{name}' maken",
  'tags.createButton': 'Tag maken',
  'tags.settingsTitle': 'Tags',
  'tags.settingsHelp':
    'Tags zijn voor alle klanten gelijk. Een naam is uniek, hoofdletters tellen niet.',
  'tags.name': 'Naam', // component copy: ScreenTags
  'tags.color': 'Kleur',
  'tags.noColor': 'Geen kleur',
  'tags.empty': 'Nog geen tags.',
  'tags.none': 'Geen tags gevonden',
  'tags.rename': '{name} bewerken',
  'tags.useCount': '{count, plural, one {# print} other {# prints}}',

  'filters.allCustomers': 'Alle klanten', // component copy: FilterBar
  'filters.customer': 'Klant', // component copy: FilterBar preview (aria-label)
  'filters.button': 'Filters', // component copy: ScreenDashboard (phone)

  'records.showDeleted': 'Toon verwijderde',
  'records.showArchived': 'Gearchiveerd tonen',
  'records.deletedOn': 'Verwijderd op {date}.',
  'records.archivedNote': 'Gearchiveerd. De bestanden staan niet meer op schijf.',

  'customers.printCount': '{count, plural, one {# print} other {# prints}}',
  'customers.delete': 'Klant verwijderen',
  'customers.allPaid': 'Alles betaald',
  'customers.label': 'Klanten', // component copy: CustomerChips (aria-label)

  'print.select': 'Selecteer {name}', // component copy: PrintCard preview (aria-label)
  'print.noPreview': 'Geen voorbeeld', // component copy: PrintCard
  'print.name': 'Naam', // component copy: PrintRow
  'print.material': 'Materiaal', // component copy: PrintRow
  'print.time': 'Tijd', // component copy: PrintRow
  'print.weight': 'Gewicht', // component copy: PrintRow
  'print.status': 'Status', // component copy: PrintRow
  'print.files': 'Bestanden', // component copy: ScreenPrintDetail
  'print.fileCount': '{count} bestanden', // component copy: ScreenPrintDetail preview
  'print.noWeightOrTime': 'geen gewicht of tijd', // component copy: ScreenPrintDetail preview
  'print.userView': 'Je ziet alleen prijs en status.', // component copy: ScreenPrintDetail

  'asset.timesPrintedShort': '× {count}',
  'asset.duplicate': 'Mogelijk dubbel',
  'asset.duplicateHint': 'Zelfde bestand als {fileName}. Gebruik liever Aantal keer geprint.',
  'asset.plate': 'Plaat {n}',
  'asset.plates': '{count} platen',
  'asset.slot': 'Slot {n}',
  'asset.slicerHint': 'slicer',
  'asset.excluded': 'Telt niet mee in kosten',
  'asset.excludedReason.duplicate': 'Telt niet mee: dubbel met G-code',
  'asset.excludedReason.folder': 'Telt niet mee: map {folder}',
  'asset.missingFile': 'Bestand ontbreekt',

  'viewer.loading': 'Model laden…',
  'viewer.hint': 'Sleep om te draaien, scroll om te zoomen',
  'viewer.error': 'Model kon niet worden geladen',
  'viewer.none': 'Geen 3D-model beschikbaar',
  'viewer.label': '3D-voorbeeld van {name}', // component copy: Viewer3D (aria-label)
  'viewer.fullscreen': 'Volledig scherm',
  'viewer.exitFullscreen': 'Volledig scherm sluiten',

  'live.connected': 'Live',
  'live.reconnecting': 'Verbinding verbroken — opnieuw verbinden…',
  'system.reconnected': 'Verbonden',

  'empty.noPrints.title': 'Nog geen prints',
  'empty.noPrints.body': 'Zet je bestanden in klant/project-mappen en start een index.',
  'empty.noResults.title': 'Geen resultaten',
  'empty.noResults.body': 'Pas je filters aan of wis ze.',
  'empty.unreachable.title': 'Prints-map niet bereikbaar',
  'empty.unreachable.body': 'Controleer of de map gekoppeld is.',
  'empty.reindex': 'Opnieuw indexeren', // component copy: EmptyState

  'confirm.deletePrint': "Print '{name}' verwijderen?",
  'confirm.deletePrintBody': 'Verwijderen verbergt de print, maar bewaart de financiële gegevens.',
  'confirm.deleteCustomer': "Klant '{name}' verwijderen?",
  'confirm.deleteCustomerBody':
    '{count, plural, one {De print van deze klant wordt verborgen} other {Alle # prints van deze klant worden verborgen}}. De financiële gegevens blijven bewaard en een beheerder kan de klant herstellen.',
  'confirm.deleteTag': "Tag '{name}' verwijderen?",
  'confirm.deleteTagBody':
    '{count, plural, one {De tag wordt van # print verwijderd} other {De tag wordt van # prints verwijderd}}. De prints zelf blijven bestaan.',

  'error.tagExists': 'Deze tag bestaat al.',
  'error.tagTooLong': 'Een tag mag maximaal 64 tekens hebben.',

  'settings.theme': 'Thema',
  'settings.theme.system': 'Systeem', // component copy: ScreenSettings
  'settings.theme.light': 'Licht', // component copy: ScreenSettings
  'settings.theme.dark': 'Donker', // component copy: ScreenSettings
} as const;

export type MessageKey = keyof typeof nl;

/**
 * Looks up a string and fills `{name}` placeholders. ICU plurals from the copy
 * deck (`{count, plural, one {# print} other {# prints}}`) pick `one` for 1 and
 * `other` otherwise, with `#` replaced by the number.
 */
export function t(key: MessageKey, values: Readonly<Record<string, string | number>> = {}): string {
  return fill(plurals(nl[key], values), values);
}

function fill(text: string, values: Readonly<Record<string, string | number>>): string {
  return text.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = values[name];
    return value === undefined ? match : String(value);
  });
}

function plurals(text: string, values: Readonly<Record<string, string | number>>): string {
  const head = /\{(\w+), plural, /.exec(text);
  if (head === null) return text;
  const count = Number(values[head[1] ?? '']);
  const forms = new Map<string, string>();
  let index = head.index + head[0].length;
  // Forms: `one {…} other {…}`; a form's text has no nested braces of its own.
  for (;;) {
    const form = /^\s*(\w+) \{([^{}]*)\}/.exec(text.slice(index));
    if (form === null) break;
    forms.set(form[1] ?? '', form[2] ?? '');
    index += form[0].length;
  }
  const end = text.indexOf('}', index);
  const chosen = (count === 1 ? forms.get('one') : undefined) ?? forms.get('other') ?? '';
  const replaced = chosen.replace(/#/g, Number.isNaN(count) ? '#' : String(count));
  return plurals(text.slice(0, head.index) + replaced + text.slice(end + 1), values);
}
