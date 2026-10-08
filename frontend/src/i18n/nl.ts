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
  'auth.passwordHelp': 'Minstens 12 tekens en anders dan je tijdelijke wachtwoord.',
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
  'access.empty.title': 'Nog geen gebruikers om toegang te geven',
  'access.empty.body': 'Alleen Admins en Editors bestaan nu; zij zien altijd elke klant.',
  'access.empty.link': 'Naar Gebruikers',
  'access.colMenu': 'Kolomacties voor {klant}',
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
  'auth.pw.unchanged': 'Dit is je huidige wachtwoord. Kies een ander wachtwoord.',
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
  'status.paid': 'Betaald',
  'status.unpaid': 'Open',
  'status.partiallyPaid': 'Deels betaald',
  'status.writtenOff': 'Afgeschreven',
  'status.noSpool': 'Geen spoel',
  'status.noPrice': 'Geen prijs',
  'status.noCost': 'Kosten ontbreken',
  'status.daysOpen': '{days} dagen open',
  'status.paidOn': 'Betaald op {date}',
  'status.remaining': 'Nog {amount} open',
  'status.notBilled': 'Niet factureren',

  'money.suggested': 'voorgesteld',
  'money.of': 'van {amount}',
  'money.cost': 'Kosten',
  'money.openSuffix': 'openstaand', // component copy: CustomerCard

  'spool.choose': 'Kies een spoel',
  'spool.search': 'Zoek op materiaal, kleur of leverancier',
  'spool.empty': 'Geen spoelen gevonden',
  'spool.none': 'Geen spoel',
  'spool.pricePerKg': '€/kg',
  'spool.forPrint': 'Spoel voor de hele print', // component copy: ScreenPrintDetail
  'spool.forPrintHelp': 'Bestanden en slots met een eigen spoel gaan hierboven voor.', // component copy: ScreenPrintDetail
  'spool.searchLabel': 'Zoeken', // component copy: SpoolPicker preview (aria-label)
  'spool.unreachable': 'Niet bereikbaar', // component copy: ScreenSettings

  'cost.title': 'Totaalkosten',
  'cost.titleNotBilled': 'Kosten', // component copy: CostBreakdown (niet factureren)
  'cost.material': 'Materiaal',
  'cost.electricity': 'Stroom',
  'cost.source.spoolman': 'Spoolman',
  'cost.source.manual': 'Handmatig',
  'cost.source.estimated': 'Geschat',
  'cost.noPrinterProfile': 'Geen printerprofiel, stroomkosten zijn niet meegerekend.',
  'cost.incomplete': 'Onvolledig',
  'cost.missingWattage': 'Geen vermogen voor {printer}.', // component copy: CostBreakdown
  'cost.missingWattageAndPrice': 'Geen vermogen voor {printer} en geen prijs per kWh.',
  'cost.setWattage': 'Vermogen instellen',
  'cost.setInputs': 'Instellen',
  'cost.askAdmin': 'Vraag een beheerder het vermogen in te stellen.',
  'cost.missingTariff': 'Geen prijs per kWh.',
  'menu.more': 'Meer acties', // component copy: OverflowMenu
  'print.lacks': 'Ontbreekt: {types}',
  'print.lacks.aria': 'Deze print heeft {types}.',
  'print.lacks.item': 'geen {type}-bestand',
  'print.lacks.gcode': 'G-code',
  'print.lacks.threemf': '3MF',
  'print.lacks.stl': 'STL',
  'print.preview': 'Voorbeeld', // component copy: PrintRow
  'invoices.noStatus': 'Geen status', // component copy: ScreenInvoices
  'video.play': 'Afspelen {bestandsnaam}', // component copy: VideoPlayer
  'video.loading': 'Video laden…',
  'video.error.title': 'De video kon niet worden afgespeeld.',
  'video.error.body': 'Download het bestand om het in een andere speler te openen.',
  'video.unsupported.title': 'Dit formaat speelt niet in de browser.',
  'video.unsupported.body': 'Download het bestand om het af te spelen.',
  'models.group': 'Modellen', // component copy: ModelPicker
  'models.caption': 'Model {n} van {totaal}: {bestandsnaam}',
  'models.loading': 'Model laden…',
  'models.select': 'Model',
  'settings.dirty': 'Niet opgeslagen', // component copy: ScreenSettings
  'settings.undo': 'Ongedaan maken',
  'settings.leave.title': 'Wijzigingen niet opgeslagen',
  'settings.leave.body':
    'In {secties} staan wijzigingen die nog niet zijn opgeslagen. Als je nu weggaat, gaan ze verloren.',
  'settings.leave.stay': 'Terug naar instellingen',
  'settings.leave.go': 'Verlaten zonder opslaan',
  'settings.printer.noPower': 'Vermogen ontbreekt',
  'settings.printer.noPower.help':
    'Zonder vermogen kunnen de stroomkosten van prints op deze printer niet worden berekend.',
  'shareLinks.filter.label': 'Toon', // component copy: ScreenShareLinks
  'shareLinks.filter.active': 'Actief',
  'shareLinks.filter.inactive': 'Inactief',
  'shareLinks.filter.all': 'Alle',
  'shareLinks.emptyActive.title': 'Geen actieve Deel-links',
  'shareLinks.emptyActive.body': 'Alle links zijn verlopen of ingetrokken. Maak een nieuwe link.',
  'shareLinks.dup.warning':
    'Je hebt voor {klant} al een link met dit label. Je kunt hem toch maken.',
  'shareLinks.once':
    'De volledige link zie je alleen bij het maken. Kwijt? Maak een nieuwe link en trek de oude in.',
  'outstanding.showAll': 'Toon alle {n} regels', // component copy: OutstandingGroup
  'outstanding.groupLabel': '{customer}, {count} prints, oudste {days} dagen, {amount}',
  'strip.overview': 'Overzicht', // component copy: CustomerChips
  'strip.overview.label': 'Klantenoverzicht ({n} klanten)',
  'strip.dialog.title': 'Alle klanten',
  'menu.invoice': 'Factuur maken', // component copy: CustomerCard
  'customers.tile': '{customer}, {count, plural, one {# print} other {# prints}}',
  'filter.sort': 'Sorteren', // component copy: FilterBar
  'filter.status': 'Status',
  'filter.status.all': 'Alle statussen',
  'filter.status.noPrice': 'Geen prijs',
  'filter.status.open': 'Open',
  'filter.status.paid': 'Betaald',
  'filter.status.writtenOff': 'Afgeschreven',
  'filter.status.incompleteCost': 'Onvolledige kosten',
  'sort.newest': 'Nieuwste eerst',
  'sort.oldest': 'Oudste eerst',
  'sort.priceDesc': 'Prijs: hoog naar laag',
  'sort.priceAsc': 'Prijs: laag naar hoog',
  'sort.customer': 'Klant: A tot Z',
  'cost.adjust': 'Aanpassen',
  'cost.notCounted': 'Niet meegeteld: {count} bestanden',
  'cost.adjustTitle': 'Kosten aanpassen',
  'cost.pricePerKg': 'Prijs per kg',
  'cost.weight': 'Gewicht',
  'cost.printTime': 'Printtijd',
  'cost.manualSource': 'Waarden die je invult krijgen de bron Handmatig.',
  'cost.spoolmanPrice': 'Prijs komt uit Spoolman.',
  'cost.resetToComputed': 'Terug naar berekend',
  'cost.col.item': 'Post', // component copy: CostBreakdown preview
  'cost.col.calculation': 'Berekening', // component copy: CostBreakdown preview
  'cost.col.source': 'Bron', // component copy: CostBreakdown preview
  'cost.col.amount': 'Bedrag', // component copy: CostBreakdown preview
  'cost.slotRow': 'Slot {n}', // component copy: CostBreakdown
  'cost.partOf': 'onderdeel van {name}', // component copy: CostBreakdown (accessibility)
  'cost.hours': 'u', // component copy: CostOverrideDialog
  'cost.minutes': 'min', // component copy: CostOverrideDialog

  'pay.title': 'Betaling', // component copy: PaymentPanel
  'pay.salePrice': 'Verkoopprijs',
  'pay.suggest': 'Voorstel uit marge ({markup}%)',
  'pay.amountPaid': 'Betaald bedrag',
  'pay.markPaid': 'Markeer als betaald',
  'pay.writeOff': 'Afschrijven',
  'pay.undo': 'Betaling ongedaan maken',
  'pay.paidOf': 'Betaald € {paid} van € {total}',
  'pay.writeOffReason': 'Reden',
  'pay.writeOffReasonHelp': 'Optioneel. Zichtbaar voor beheerders.',
  'pay.undoWriteOff': 'Afschrijving ongedaan maken',
  'pay.notBilledNote': 'Deze klant wordt niet gefactureerd.',
  'pay.userNote': 'Je ziet alleen prijs en status.',
  'pay.adminOnly': 'Alleen zichtbaar voor beheerders.',
  'pay.lockedHelp': 'Staat op een definitieve factuur en kan niet meer worden gewijzigd.',
  'pay.writtenOffAmount': 'Afgeschreven', // component copy: PaymentPanel
  'pay.paidAmount': 'Betaald', // component copy: PaymentPanel
  'pay.date': 'Datum', // component copy: PaymentPanel
  'pay.by': 'Door', // component copy: PaymentPanel
  'pay.missingCost': 'Het voorstel uit marge is niet beschikbaar.', // component copy: PaymentPanel preview

  'bulk.selected': '{count} geselecteerd',
  'bulk.assignSpool': 'Spoel toewijzen',
  'bulk.setPrice': 'Prijs instellen',
  'bulk.region': 'Acties voor selectie',
  'bulk.actions': 'Acties', // component copy: BulkActionBar (phone)
  'common.clearSelection': 'Selectie wissen',

  'print.price': 'Prijs', // component copy: PrintRow

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
  'print.fileCount': '{count, plural, one {# bestand} other {# bestanden}}', // component copy: ScreenPrintDetail, OrderSection previews
  'print.noWeightOrTime': 'geen gewicht of tijd', // component copy: ScreenPrintDetail preview
  'print.userView': 'Je ziet alleen prijs en status.', // component copy: ScreenPrintDetail

  'asset.timesPrinted': 'Aantal keer geprint',
  'asset.pickSpool': 'Kies een spoel',
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
  // First run (ScreenSystemStates): the page with the folder diagram.
  'system.firstRunBody':
    'Zet je bestanden in mappen per klant en project, en start daarna een index.',
  'system.folderCustomer': 'klant',
  'system.folderProject': 'project',

  'confirm.writeOff': 'Afschrijven ({amount})?',
  'confirm.writeOffBody': "De rest van '{name}' ({amount}) wordt afgeschreven.",
  'confirm.writeOffPaid': 'Al betaald: {amount}. Alleen de rest wordt afgeschreven.',
  'confirm.undoWriteOff': 'Afschrijving ongedaan maken?',
  'confirm.undoPayment': 'Betaling ongedaan maken?',
  'confirm.bulkMarkPaid': '{count, plural, one {# print} other {# prints}} als betaald markeren?', // component copy: BulkActionBar ("a ConfirmDialog naming the count")
  'confirm.bulkDelete': '{count, plural, one {# print} other {# prints}} verwijderen?', // component copy: BulkActionBar
  'confirm.deletePrint': "Print '{name}' verwijderen?",
  'confirm.deletePrintBody': 'Verwijderen verbergt de print, maar bewaart de financiële gegevens.',
  'confirm.deleteCustomer': "Klant '{name}' verwijderen?",
  'confirm.deleteCustomerBody':
    '{count, plural, one {De print van deze klant wordt verborgen} other {Alle # prints van deze klant worden verborgen}}. De financiële gegevens blijven bewaard en een beheerder kan de klant herstellen.',
  'confirm.deleteTag': "Tag '{name}' verwijderen?",
  'confirm.deleteTagBody':
    '{count, plural, one {De tag wordt van # print verwijderd} other {De tag wordt van # prints verwijderd}}. De prints zelf blijven bestaan.',

  'error.invalidAmount': 'Vul een bedrag in, bijvoorbeeld 11,89.',
  'error.invalidEmail': 'Vul een geldig e-mailadres in.',
  'error.tagExists': 'Deze tag bestaat al.',
  'error.tagTooLong': 'Een tag mag maximaal 64 tekens hebben.',

  'settings.title': 'Instellingen', // component copy: ScreenSettings
  'settings.general': 'Algemeen',
  'settings.reindex': 'Opnieuw indexeren',
  'settings.reindexDone': 'Klaar.',
  'settings.pricing': 'Prijzen',
  'settings.defaultMarkup': 'Standaardmarge',
  'settings.defaultMarkupHelp': 'Gebruikt voor "Voorstel uit marge" op elke print.', // component copy: ScreenSettings preview
  'settings.company': 'Bedrijfsgegevens',
  'settings.companyHelp': 'Deze gegevens staan op facturen, herinneringen en overzichten.',
  'settings.name': 'Naam',
  'settings.iban': 'IBAN',
  'settings.address': 'Adres',
  'settings.emailOptional': 'E-mailadres (optioneel)',
  'settings.phoneOptional': 'Telefoon (optioneel)',
  'settings.customers': 'Klanten',
  'settings.spoolman': 'Spoolman',
  'settings.connected': 'Verbonden',
  'settings.spoolmanMeta': '{url} · {count} spoelen · laatste sync {time}', // component copy: ScreenSettings preview
  'customers.notBilled': 'Niet factureren',
  'customers.notBilledHelp':
    'Voor een klant die niet wordt gefactureerd (bijvoorbeeld je eigen prints) zie je alleen de kosten.',
  'settings.theme': 'Thema',
  'shell.theme.label': 'Thema: {stand}. Wissel naar {volgende}.', // component copy: AppShell
  'shell.theme.system': 'Systeem',
  'shell.theme.light': 'Licht',
  'shell.theme.dark': 'Donker',
  'settings.theme.system': 'Systeem', // component copy: ScreenSettings
  'settings.theme.light': 'Licht', // component copy: ScreenSettings
  'settings.theme.dark': 'Donker', // component copy: ScreenSettings
  'settings.logoUpload': 'Logo uploaden',
  'settings.logoHelp': 'PNG of SVG. Vervangt de naam op het scherm en op documenten.',
  'settings.reindexProgress': 'Indexeren… {done} van {total} bestanden',
  'settings.logoOptional': 'Logo (optioneel)', // component copy: ScreenSettings preview
  'settings.addAlias': 'Alias toevoegen', // component copy: ScreenSettings preview (aria-label)
  'settings.addPrefix': 'Voorvoegsel toevoegen', // component copy: ScreenSettings preview (aria-label)
  'settings.addPlaceholder': 'Toevoegen…', // component copy: ScreenSettings preview
  // Openstaand, invoices (copy deck)
  'invoices.col.customer': 'Klant', // component copy: ScreenInvoices
  'invoices.col.date': 'Datum', // component copy: ScreenInvoices
  'invoices.col.amount': 'Bedrag', // component copy: ScreenInvoices
  'invoices.col.actions': 'Acties', // component copy: ScreenInvoices preview
  'invoices.kind.invoice': 'Factuur', // component copy: ScreenInvoices
  'invoices.kind.credit': 'Creditnota', // component copy: ScreenInvoices
  'invoices.relates': 'betreft {number}', // component copy: ScreenInvoices
  'invoices.allTypes': 'Alle types', // component copy: ScreenInvoices preview
  'invoices.search': 'Zoek op nummer of klant', // component copy: ScreenInvoices preview
  'invoices.downloadNumber': 'Downloaden {number}', // component copy: ScreenInvoices preview (aria-label)
  'invoices.creditNote': 'Creditnota', // component copy: ScreenInvoices preview (credit summary)
  'invoices.relatesShort': 'Betreft', // component copy: ScreenInvoices preview (credit summary)
  'invoices.relatesValue': 'factuur {number}', // component copy: ScreenInvoices preview (credit summary)
  'invoice.button': 'Factuur', // component copy: CustomerCard
  'outstanding.totalDetail': '{count, plural, one {uit # print} other {uit # prints}}', // component copy: ScreenOutstanding preview
  'outstanding.customersDetail': 'met een openstaand bedrag', // component copy: ScreenOutstanding preview
  'outstanding.oldestShort': 'Oudste', // component copy: ScreenOutstanding preview (phone)
  'outstanding.days': '{count, plural, one {# dag} other {# dagen}}', // component copy: ScreenOutstanding preview
  'outstanding.of': 'van {amount}', // component copy: OutstandingGroup ("van € 11,89")
  'outstanding.markAllBody': 'Het openstaande bedrag van {amount} wordt als betaald geregistreerd.', // component copy: ScreenOutstanding preview
  'outstanding.total': 'Totaal openstaand',
  'outstanding.customers': 'Aantal klanten',
  'outstanding.oldest': 'Oudste openstaande print',
  'outstanding.groupMeta': '{count} prints · oudste {days} dagen open',
  'outstanding.empty': 'Niets openstaand',
  'outstanding.emptyHint': 'Alle prints zijn betaald.',
  'pay.reminderPdf': 'Herinnering (PDF)',
  'pay.markAllPaid': 'Alles als betaald',
  'confirm.markAllPaid': 'Alles als betaald markeren voor {customer} ({count} prints)?',
  'confirm.finalize': 'Definitief maken?',
  'confirm.finalizeBody':
    'Je maakt een factuur voor {customer} met {count} prints, totaal {amount}. De factuur krijgt nummer {number} en de regels worden vergrendeld.',
  'status.onInvoice': 'Op factuur {number}',
  'invoice.title': 'Factuur',
  'invoice.registerTitle': 'Facturen',
  'invoice.number': 'Nummer',
  'invoice.type': 'Type',
  'invoice.createFor': 'Factuur maken voor {customer}',
  'invoice.onlyOutstanding': 'Alleen openstaand',
  'invoice.preview': 'Voorbeeld',
  'invoice.lines': 'Regels',
  'invoice.total': 'Totaal',
  'invoice.paid': 'Betaald',
  'invoice.outstanding': 'Openstaand',
  'invoice.omitted': '{count} prints zonder verkoopprijs zijn weggelaten: {names}.',
  'invoice.conceptDownload': 'Concept downloaden',
  'invoice.finalize': 'Definitief maken',
  'invoice.noLines': 'Geen regels in deze periode.',
  'invoice.relatesTo': 'Betreft factuur {number}',
  'invoice.createCredit': 'Creditnota maken',
  'invoice.createCreditFor': 'Creditnota maken voor factuur {number}',
  'invoice.pickLines': 'Kies de regels die je wilt crediteren.',
  'invoice.empty': 'Nog geen facturen',
  'invoice.emptyHint': 'Maak een factuur vanaf het dashboard.',
  'invoice.date': 'Factuurdatum',
  'invoice.from': 'Van',
  'invoice.to': 'Tot en met',
  // Added in design system 1.5
  'invoice.line.reorder': '{print} (nabestelling {n})',
  'invoice.finalize.blocked':
    'Naam en IBAN ontbreken. Vul ze in bij Instellingen, Bedrijfsgegevens. Een concept kan wel worden gedownload, zonder betaalzin.',
  'invoice.paidfull': 'Deze factuur is volledig betaald.',
  'invoice.finalize.blockedTitle': 'Naam en IBAN ontbreken.', // component copy: ScreenInvoiceExport
  'invoice.toSettings': 'Naar Instellingen', // component copy: ScreenInvoiceExport
  'invoice.periodHelp': 'De periode werkt op de datum van de bestelling.', // component copy: ScreenInvoiceExport preview
  'order.locked': 'Op factuur {nummer}',
  'order.lockedNote': 'Op factuur {nummer}.', // component copy: ScreenPrintDetail (Vergrendeld alert)
  'outstanding.line.pay': 'Markeer als betaald',
  'outstanding.payHelp':
    'Standaard het openstaande bedrag ({amount}). Een lager bedrag is een deelbetaling.', // component copy: ScreenOutstanding preview
  'date.today': 'Vandaag',
  'date.clear': 'Wissen',
  'date.prev': 'Vorige maand',
  'date.next': 'Volgende maand',
  'date.pick': 'Kies een datum', // component copy: DatePicker
  'date.outOfRange': 'Kies een datum binnen de periode.', // component copy: DatePicker
  // Added in design system 1.4
  Key: 'Text',
  'settings.electricityTariff': 'Stroomtarief',
  'settings.electricityTariffHelp': 'Gebruikt voor de stroomkosten van elke print: kWh × tarief.',
  'settings.materialPrices': 'Materiaalprijzen',
  'settings.materialPricesHelp':
    'Geschatte prijs per kg als Spoolman geen prijs heeft. Volgorde: Spoolman, handmatig, dit standaardbedrag.',
  'settings.material': 'Materiaal',
  'settings.pricePerKg': 'Prijs per kg',
  'settings.addMaterial': 'Materiaal toevoegen',
  'settings.printers': 'Printers',
  'settings.printersHelp':
    'Het vermogen (watt) bepaalt de stroomkosten van prints op deze printer.',
  'settings.addPrinter': 'Printer toevoegen',
  'settings.deletePrinter': 'Printer verwijderen',
  'settings.printerName': 'Naam',
  'settings.printerWatts': 'Vermogen',
  'settings.printerAliases': 'Aliassen',
  'settings.printerAliasesHelp': 'Andere namen voor deze printer.',
  'settings.printerPrefixes': 'Timelapse-voorvoegsels',
  'settings.printerPrefixesHelp':
    'Beginletters van de bestandsnamen van timelapses van deze printer.',
  'settings.printersEmpty':
    'Nog geen printers. Zonder printerprofiel zijn stroomkosten niet meegerekend.',
  'error.materialExists': 'Dit materiaal staat er al.',
  'error.invalidWatts': 'Vul een aantal watt in, bijvoorbeeld 350.',
  'error.invalidTariff': 'Vul een bedrag in, bijvoorbeeld 0,30.',
  'confirm.deletePrinter': "Printer '{name}' verwijderen?",
  'confirm.deletePrinterBody':
    'De stroomkosten van prints op deze printer worden daarna niet meer meegerekend.',
  'orders.first': 'Bestelling 1',
  'orders.repeat': 'Nabestelling {n}',
  'orders.create': 'Nabestelling maken',
  'orders.createIntro': 'Kies de bestanden voor deze nabestelling en hoe vaak ze worden geprint.',
  'orders.unassignedGroup': 'Nog niet in een bestelling',
  'orders.previousGroup': 'Eerder besteld',
  'orders.pickOne': 'Kies minstens één bestand.',
  'orders.delete': 'Nabestelling verwijderen',
  'orders.deleteHelp':
    'Een nabestelling zonder betaling kan worden verwijderd. De bestanden gaan terug naar "Niet in een bestelling".',
  'orders.deleteLocked': 'Staat op factuur {number} en kan niet worden verwijderd.',
  'orders.count': '{count, plural, one {# bestelling} other {# bestellingen}}',
  'orders.notInOrder': 'Niet in een bestelling',
  'orders.notInOrderHint': 'Nieuw bestand. Voeg het toe aan een nabestelling.',
  'orders.unassignedAlert':
    '{count, plural, one {# nieuw bestand staat} other {# nieuwe bestanden staan}} in geen bestelling. Voeg het toe aan een nabestelling.',
  'confirm.deleteOrder': 'Nabestelling {n} verwijderen?',
  'confirm.deleteOrderBody':
    'De bestanden gaan terug naar "Niet in een bestelling". De nabestelling heeft geen betaling of afschrijving.',
  'payment.undoLast': 'Maakt de laatste betaling ({amount}) ongedaan.',
  'payment.undoneBy': 'Ongedaan gemaakt door {name} op {date}.',
  'error.overpay': 'Een betaling kan niet hoger zijn dan het openstaande bedrag ({amount}).',
  'bulk.spoolTitle': 'Spoel toewijzen aan {count, plural, one {# print} other {# prints}}',
  'bulk.spoolIntro': 'De gekozen spoel geldt voor de hele print, op elke geselecteerde print.',
  'bulk.spoolKeep': 'Bestanden en slots met een eigen spoel houden die.',
  'bulk.assign': 'Toewijzen',
  'bulk.priceTitle': 'Prijs instellen voor {count, plural, one {# print} other {# prints}}',
  'bulk.priceIntro': 'De prijs komt op de nieuwste bestelling van elke print.',
  'bulk.priceSame': 'Dezelfde prijs voor elke print',
  'bulk.priceSuggested': 'Voorstel uit marge per print ({margin}%)',
  'bulk.priceSkipNoCost': 'Prints zonder kosten worden overgeslagen.',
  'bulk.result': '{ok} van {total} bijgewerkt',
  'bulk.failedTitle':
    '{count, plural, one {# print niet bijgewerkt} other {# prints niet bijgewerkt}}',
  'bulk.reason.paid': 'Nabestelling {n} is al betaald.',
  'bulk.reason.writtenOff': 'Nabestelling {n} is afgeschreven.',
  'bulk.reason.invoiced': 'Staat op factuur {number}.',
  'bulk.reason.notBilled': 'Deze klant wordt niet gefactureerd.',
  'bulk.reason.noCost': 'Kosten ontbreken.',
  'bulk.reason.noAccess': 'Geen toegang.',
  'customers.restore': 'Herstellen',
  'tags.colour.rose': 'Roze',
  'tags.colour.orange': 'Oranje',
  'tags.colour.amber': 'Amber',
  'tags.colour.lime': 'Limoen',
  'tags.colour.teal': 'Turquoise',
  'tags.colour.sky': 'Hemelsblauw',
  'tags.colour.blue': 'Blauw',
  'tags.colour.violet': 'Violet',
  'tags.colour.lilac': 'Lila',
  'tags.colour.grey': 'Grijs',
  // Deel-links and the share page (M8)
  'common.copy': 'Kopiëren',
  'common.copied': 'Gekopieerd',
  'money.priceTbd': 'Prijs volgt',
  'share.create': 'Deel-link maken',
  'share.customer': 'Klant', // component copy: ScreenShareLinks
  'share.label': 'Label',
  'share.expires': 'Verloopt',
  'share.expiresNever': 'Nooit',
  'share.noExpiry': 'Verloopt niet',
  'share.neverHelp': 'De link blijft werken tot je hem intrekt.',
  'share.notBilledHint':
    'Deze klant wordt niet gefactureerd. De link toont alleen de printlijst, zonder bedragen.',
  'share.createdOn': 'Gemaakt', // component copy: ShareLinkRow
  'share.revoke': 'Intrekken',
  'share.active': 'Actief',
  'share.expired': 'Verlopen',
  'share.revoked': 'Ingetrokken',
  'share.created': 'Deel-link gemaakt',
  'share.onceWarning': 'Deze link zie je maar één keer. Kopieer hem nu.',
  'share.pay.title': 'Betalen', // component copy: ScreenSharePage
  'share.pay.iban': 'IBAN',
  'share.pay.name': 'T.n.v.',
  'share.pay.amount': 'Bedrag',
  'share.pay.ref': 'Kenmerk',
  'share.pay.copy.iban': 'Kopieer IBAN',
  'share.pay.copy.name': 'Kopieer naam',
  'share.pay.copy.amount': 'Kopieer bedrag',
  'share.pay.copy.ref': 'Kopieer kenmerk',
  'share.pay.copied': '{veld} gekopieerd',
  'share.pay.hint': 'Vermeld bij je betaling het kenmerk.',
  'shareLinks.label.help': 'Alleen voor jezelf, de klant ziet dit niet.',
  'share.hint': 'Deel via WhatsApp of mail',
  'share.copyFailed': 'Selecteer en kopieer handmatig', // component copy: TokenReveal
  'share.empty': 'Nog geen Deel-links',
  'share.notFound': 'Deze link is verlopen of ingetrokken',
  'share.askNew': 'Vraag degene die je de link stuurde om een nieuwe.',
  'share.notBilledIntro': 'Hier zie je de prints die voor je gemaakt zijn.',
  'confirm.revokeLink': "Deel-link '{label}' intrekken?",
  'overview.for': 'Overzicht voor {customer}',
  'overview.download': 'Download overzicht',
  'overview.expiryNotice': 'Deze link verloopt over {days} dagen ({date})',
  'overview.footnote': 'Prijzen in euro. Prints zonder prijs staan niet in de totalen.',
  'overview.nothingOpen': 'Er staat niets open.',
  'overview.col.print': 'Print', // component copy: ScreenSharePage (not-billed table)
  'overview.col.project': 'Project', // component copy: ScreenSharePage (not-billed table)
  'overview.col.date': 'Datum', // component copy: ScreenSharePage (not-billed table)
  // Added in design system 1.6
  'date.daysOne': 'Over 1 dag',
  'date.daysOther': 'Over {days} dagen',
  'date.agoOne': '1 dag geleden',
  'date.agoOther': '{days} dagen geleden',
  'share.expiresTomorrow': 'Deze link verloopt morgen ({date})',
  'share.expiresToday': 'Deze link verloopt vandaag ({date})',
  'share.closeUncopied': 'Sluiten zonder kopiëren?',
  'share.closeUncopiedBody':
    'Je ziet deze link daarna niet meer. Je kunt hem wel intrekken en een nieuwe maken.',
  'common.back': 'Terug',
  'api.loadError': 'API-docs konden niet worden geladen',
  // The design system still says "Swagger UI"; we render the document with Scalar.
  'api.loadErrorBody': 'De documentatie kon niet worden opgehaald. Probeer het opnieuw.',
  'api.title': 'API-docs', // component copy: ScreenApiDocs
  'spool.wholePrintSkipped':
    'Spoel gewijzigd in {n, plural, one {# bestelling} other {# bestellingen}}. {m, plural, one {# bestelling} other {# bestellingen}} overgeslagen: staat op een factuur.',
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
