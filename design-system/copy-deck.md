# Dutch copy deck

Key to text, ready for a strings file. Values use ICU-style `{placeholders}`. Component and screen copy.

**Every key appears exactly once in this deck (2.11).** A key's row lives in the section where the
key was added and carries its **current** value; a later change is recorded in prose under the
version that changed it ("Changed in 2.11: …"), never as a second row. Until 2.11 a changed key was
re-listed in the new section and the old row stayed behind, which left twelve duplicated keys and
two keys holding two *different* strings: `outstanding.oldest` was both a tile label and an age
badge (GAP-148), and `api.loadErrorBody` was both "De Swagger UI…" and "De documentatie…". The
importer takes the **first** occurrence, so a duplicate row is not untidiness — it is the deck
quietly shipping the string a later round replaced. One row per key is what makes this file
checkable.

**A counted sentence carries an ICU plural *and* its zero arm.** 2.9 required the plural
(`do-dont.md`, GAP-141); 2.11 adds the zero, because Dutch sends 0 to `other`, so "0 dagen geleden
gevraagd" is what the owner reads on the row he just added (GAP-150). Where a count of zero means
*today*, say the day: this deck has done that since 1.6 with `share.expiresToday` and
`share.expiresTomorrow`.

| Key | Text |
|---|---|
| common.save | Opslaan |
| common.cancel | Annuleren |
| common.delete | Verwijderen |
| common.restore | Herstellen |
| common.close | Sluiten |
| common.retry | Opnieuw proberen |
| common.copy | Kopiëren |
| common.copied | Gekopieerd |
| common.download | Downloaden |
| common.loading | Laden… |
| common.loadMore | Meer laden |
| common.count | {shown} van {total} prints |
| common.allLoaded | Alle prints geladen |
| common.clearFilters | Filters wissen |
| common.clearSelection | Selectie wissen |
| common.selectAll | Alles selecteren |
| common.selectNone | Niets selecteren |
| common.search.placeholder | Zoek op naam, klant of tag |
| common.search.label | Zoeken |
| common.search.clear | Wis zoekopdracht |
| common.required | (verplicht) |
| nav.dashboard | Dashboard |
| nav.outstanding | Openstaand |
| nav.shareLinks | Deel-links |
| nav.access | Toegang |
| nav.users | Gebruikers |
| nav.settings | Instellingen |
| nav.apiDocs | API-docs |
| view.cards | Kaarten |
| view.list | Lijst |
| view.label | Weergave |
| status.paid | Betaald |
| status.unpaid | Open |
| status.writtenOff | Afgeschreven |
| status.archived | Gearchiveerd |
| status.deleted | Verwijderd |
| status.noSpool | Geen spoel |
| status.noPrice | Geen prijs |
| status.noCost | Kosten ontbreken |
| status.daysOpen | {days, plural, =0 {sinds vandaag open} one {# dag open} other {# dagen open}} |
| status.paidOn | Betaald op {date} |
| money.suggested | voorgesteld |
| money.priceTbd | Prijs volgt |
| tags.label | Tags |
| tags.add | Tag toevoegen |
| tags.remove | {tag} verwijderen |
| tags.andHint | Toont prints met alle gekozen tags (EN) |
| tags.edit | Tags bewerken |
| spool.choose | Kies een spoel |
| spool.search | Zoek op materiaal, kleur of leverancier |
| spool.empty | Geen spoelen gevonden |
| spool.none | Geen spoel |
| spool.pricePerKg | €/kg |
| asset.excluded | Telt niet mee in kosten |
| asset.missingFile | Bestand ontbreekt |
| cost.title | Totaalkosten |
| cost.material | Materiaal |
| cost.electricity | Stroom |
| cost.source.spoolman | Spoolman |
| cost.source.manual | Handmatig |
| cost.source.estimated | Geschat |
| cost.noPrinterProfile | Geen printerprofiel, stroomkosten zijn niet meegerekend. |
| cost.incomplete | Onvolledig |
| pay.salePrice | Verkoopprijs |
| pay.suggest | Voorstel uit marge ({markup}%) |
| pay.amountPaid | Betaald bedrag |
| pay.markPaid | Markeer als betaald |
| pay.markAllPaid | Alles als betaald |
| pay.writeOff | Afschrijven |
| pay.undo | Betaling ongedaan maken |
| pay.reminderPdf | Herinnering (PDF) |
| bulk.selected | {count} geselecteerd |
| bulk.assignSpool | Spoel toewijzen |
| bulk.setPrice | Prijs instellen |
| bulk.region | Acties voor selectie |
| outstanding.total | Totaal openstaand |
| outstanding.customers | Aantal klanten |
| outstanding.oldest | Oudste openstaande print |
| outstanding.groupMeta | {count, plural, one {# print} other {# prints}} |
| share.create | Deel-link maken |
| share.label | Label |
| share.expires | Verloopt |
| share.revoke | Intrekken |
| share.active | Actief |
| share.expired | Verlopen |
| share.revoked | Ingetrokken |
| share.created | Deel-link gemaakt |
| share.onceWarning | Deze link zie je maar één keer. Kopieer hem nu. |
| share.hint | Deel via WhatsApp of mail |
| share.notFound | Deze link is verlopen of ingetrokken |
| access.title | Toegang |
| live.connected | Live |
| live.reconnecting | Verbinding verbroken — opnieuw verbinden… |
| viewer.loading | Model laden… |
| viewer.hint | Sleep om te draaien, scroll om te zoomen |
| viewer.error | Model kon niet worden geladen |
| viewer.none | Geen 3D-model beschikbaar |
| confirm.deletePrint | Print '{name}' verwijderen? |
| confirm.deletePrintBody | Verwijderen verbergt de print, maar bewaart de financiële gegevens. |
| confirm.revokeLink | Deel-link '{label}' intrekken? |
| confirm.markAllPaid | Alles als betaald markeren voor {customer} ({count} prints)? |
| confirm.writeOff | Afschrijven ({amount})? |
| confirm.deleteUser | Gebruiker '{name}' verwijderen? |
| error.generic | Er ging iets mis |
| error.loadPrints | We konden de prints niet laden. Probeer het opnieuw. |
| error.saveFailed | Opslaan mislukt, de wijziging is teruggedraaid. |
| error.invalidEmail | Vul een geldig e-mailadres in. |
| error.invalidAmount | Vul een bedrag in, bijvoorbeeld 11,89. |
| error.required | Dit veld is verplicht. |
| error.noAccess | Geen toegang tot deze klant |
| error.tooManyAttempts | Te veel pogingen, probeer het over een minuut opnieuw |
| toast.saved | Opgeslagen |
| empty.noPrints.title | Nog geen prints |
| empty.noPrints.body | Zet je bestanden in klant/project-mappen en start een index. |
| empty.noResults.title | Geen resultaten |
| empty.noResults.body | Pas je filters aan of wis ze. |
| empty.unreachable.title | Prints-map niet bereikbaar |
| empty.unreachable.body | Controleer of de map gekoppeld is. |
| format.money | € 1.234,56 |
| format.date | 5 okt 2026 |
| format.duration | 1 u 20 min |
| format.weight | 87 g |
| format.energy | 0,42 kWh |
| status.partiallyPaid | Deels betaald |
| status.remaining | Nog {amount} open |
| status.notBilled | Niet factureren |
| status.onInvoice | Op factuur {number} |
| status.concept | Concept |
| status.final | Definitief |
| status.creditNote | Creditnota |
| money.of | van {amount} |
| money.cost | Kosten |
| asset.timesPrinted | Aantal keer geprint |
| asset.timesPrintedShort | × {count} |
| asset.duplicate | Mogelijk dubbel |
| asset.duplicateHint | Zelfde bestand als {fileName}. Gebruik liever Aantal keer geprint. |
| asset.plate | Plaat {n} |
| asset.slot | Slot {n} |
| asset.slicerHint | slicer |
| asset.pickSpool | Kies een spoel |
| asset.excludedReason.duplicate | Telt niet mee: dubbel met G-code |
| asset.excludedReason.folder | Telt niet mee: map {folder} |
| asset.plates | {count} platen |
| cost.adjust | Aanpassen |
| cost.notCounted | Niet meegeteld: {count} bestanden |
| cost.adjustTitle | Kosten aanpassen |
| cost.pricePerKg | Prijs per kg |
| cost.weight | Gewicht |
| cost.printTime | Printtijd |
| cost.manualSource | Waarden die je invult krijgen de bron Handmatig. |
| cost.spoolmanPrice | Prijs komt uit Spoolman. |
| cost.resetToComputed | Terug naar berekend |
| pay.paidOf | Betaald € {paid} van € {total} |
| pay.writeOffReason | Reden |
| pay.writeOffReasonHelp | Optioneel. Zichtbaar voor beheerders. |
| pay.undoWriteOff | Afschrijving ongedaan maken |
| pay.notBilledNote | Deze klant wordt niet gefactureerd. |
| pay.lockedHelp | Staat op een definitieve factuur en kan niet meer worden gewijzigd. |
| pay.userNote | Je ziet alleen prijs en status. |
| pay.adminOnly | Alleen zichtbaar voor beheerders. |
| confirm.writeOffPartial | Afschrijven ({amount})? |
| confirm.writeOffBody | De rest van '{name}' ({amount}) wordt afgeschreven. |
| confirm.writeOffPaid | Al betaald: {amount}. Alleen de rest wordt afgeschreven. |
| confirm.undoWriteOff | Afschrijving ongedaan maken? |
| confirm.undoPayment | Betaling ongedaan maken? |
| confirm.finalize | Definitief maken? |
| confirm.finalizeBody | Je maakt een factuur voor {customer} met {count} prints, totaal {amount}. De factuur krijgt nummer {number} en de regels worden vergrendeld. |
| records.showDeleted | Toon verwijderde |
| records.showArchived | Gearchiveerd tonen |
| records.deletedOn | Verwijderd op {date}. |
| records.archivedNote | Gearchiveerd. De bestanden staan niet meer op schijf. |
| invoice.title | Factuur |
| invoice.registerTitle | Facturen |
| invoice.number | Nummer |
| invoice.type | Type |
| invoice.createFor | Factuur maken voor {customer} |
| invoice.from | Van |
| invoice.to | Tot en met |
| invoice.onlyOutstanding | Alleen openstaand |
| invoice.preview | Voorbeeld |
| invoice.lines | Regels |
| invoice.total | Totaal |
| invoice.paid | Betaald |
| invoice.outstanding | Openstaand |
| invoice.omitted | {count, plural, one {# print zonder verkoopprijs is weggelaten} other {# prints zonder verkoopprijs zijn weggelaten}}: {names}. |
| invoice.conceptDownload | Concept downloaden |
| invoice.finalize | Definitief maken |
| invoice.noLines | Geen regels in deze periode. |
| invoice.conceptBand | CONCEPT — nog niet definitief |
| invoice.conceptNumber | wordt toegekend bij definitief maken |
| invoice.date | Factuurdatum |
| invoice.period | Periode |
| invoice.relatesTo | Betreft factuur {number} |
| invoice.creditNoteCorrects | Deze creditnota corrigeert factuur {number}. |
| invoice.createCredit | Creditnota maken |
| invoice.createCreditFor | Creditnota maken voor factuur {number} |
| invoice.pickLines | Kies de regels die je wilt crediteren. |
| invoice.empty | Nog geen facturen |
| invoice.emptyHint | Maak een factuur vanaf het dashboard. |
| invoice.payInstruction | Graag {amount} overmaken naar IBAN {iban} t.n.v. {name}, onder vermelding van {reference}. |
| invoice.page | Pagina {n} van {m} |
| reminder.title | Herinnering |
| reminder.sub | Openstaande prints |
| reminder.body | Beste {customer}, volgens onze administratie staan de onderstaande prints nog open. Wil je het bedrag overmaken? Heb je al betaald, dan kun je deze herinnering negeren. Alvast bedankt! |
| reminder.total | Totaal openstaand |
| overview.title | Overzicht |
| overview.for | Overzicht voor {customer} |
| overview.validUntil | Geldig tot |
| overview.notInvoice | Dit is een overzicht, geen factuur. |
| overview.download | Download overzicht |
| overview.downloadTitle | Overzicht downloaden |
| overview.expiryNotice | Deze link verloopt over {days} dagen ({date}) |
| overview.footnote | Prijzen in euro. Prints zonder prijs staan niet in de totalen. |
| overview.nothingOpen | Er staat niets open. |
| outstanding.empty | Niets openstaand |
| outstanding.emptyHint | Alle prints zijn betaald. |
| share.empty | Nog geen Deel-links |
| share.askNew | Vraag degene die je de link stuurde om een nieuwe. |
| customers.notBilled | Niet factureren |
| customers.notBilledHelp | Voor een klant die niet wordt gefactureerd (bijvoorbeeld je eigen prints) zie je alleen de kosten. |
| settings.general | Algemeen |
| settings.reindex | Opnieuw indexeren |
| settings.reindexProgress | Indexeren… {done} van {total} bestanden |
| settings.reindexDone | Klaar. |
| settings.theme | Thema |
| settings.pricing | Prijzen |
| settings.defaultMarkup | Standaardmarge |
| settings.company | Bedrijfsgegevens |
| settings.companyHelp | Deze gegevens staan op facturen, herinneringen en overzichten. |
| settings.name | Naam |
| settings.iban | IBAN |
| settings.address | Adres |
| settings.emailOptional | E-mailadres (optioneel) |
| settings.phoneOptional | Telefoon (optioneel) |
| settings.logoUpload | Logo uploaden |
| settings.logoHelp | PNG of SVG. Vervangt de naam op het scherm en op documenten. |
| settings.customers | Klanten |
| settings.spoolman | Spoolman |
| settings.connected | Verbonden |
| users.title | Gebruikers |
| users.create | Gebruiker maken |
| users.role | Rol |
| users.origin | Herkomst |
| users.local | Lokaal |
| users.authentik | Authentik |
| users.resetPassword | Wachtwoord resetten |
| users.tempPassword | Tijdelijk wachtwoord |
| users.lastAdmin | Er moet minstens één Admin blijven. |
| auth.login | Inloggen |
| auth.password | Wachtwoord |
| auth.or | of |
| auth.authentik | Inloggen met Authentik |
| auth.wrong | Verkeerd e-mailadres, naam of wachtwoord. |
| auth.redirecting | Doorsturen naar Authentik… |
| system.goDashboard | Naar dashboard |
| system.forbiddenHelp | Je hebt geen toegang tot deze klant. Vraag een beheerder om toegang. |
| system.errorBody | De pagina kon niet worden geladen. Probeer het opnieuw. |
| system.reconnected | Verbonden |
| system.firstRunBody | Zet je bestanden in mappen per klant en project, en start daarna een index. |
| system.folderCustomer | klant |
| system.folderProject | project |
| system.skipToContent | Naar inhoud |
| system.menu | Menu |
| system.more | Meer |
| system.apiDocsError | API-docs konden niet worden geladen. |
| nav.manage | Beheer |
| nav.invoices | Facturen |

## Added in 1.2

| Key | Dutch |
|---|---|
| share.expiresNever | Nooit |
| share.noExpiry | Verloopt niet |
| share.neverHelp | De link blijft werken tot je hem intrekt. |
| share.notBilledHint | Deze klant wordt niet gefactureerd. De link toont alleen de printlijst, zonder bedragen. |
| share.notBilledIntro | Hier zie je de prints die voor je gemaakt zijn. |
| auth.identifier | E-mailadres of naam |
| auth.oidcFailed | Inloggen met Authentik is mislukt. Probeer het opnieuw. |
| auth.sessionExpired | Je sessie is verlopen. Log opnieuw in. |
| auth.newPasswordTitle | Nieuw wachtwoord kiezen |
| auth.newPasswordIntro | Je gebruikt een tijdelijk wachtwoord. Kies een eigen wachtwoord om verder te gaan. |
| auth.newPassword | Nieuw wachtwoord |
| auth.repeatPassword | Herhaal wachtwoord |
| auth.passwordHelp | Minstens 12 tekens. |
| auth.logout | Uitloggen |
| error.passwordTooShort | Kies een wachtwoord van minstens 12 tekens. |
| error.passwordMismatch | De wachtwoorden zijn niet gelijk. |
| error.userExists | Deze gebruiker bestaat al. |
| confirm.deleteUserBody | Deze gebruiker kan daarna niet meer inloggen. |
| users.resetTitle | Wachtwoord resetten voor '{name}' |
| users.tempPasswordHelp | Minstens 12 tekens. De gebruiker kiest bij de eerste keer inloggen een eigen wachtwoord. |
| access.allAccessRoles | Admin en Editor hebben altijd toegang. |

Removed in 1.2: `share.noShareLink`, `share.notBilled`, `access.adminAlways` (replaced by `access.allAccessRoles`), `auth.email` (replaced by `auth.identifier`). Changed text: `auth.wrong`.

## Added in 1.3

| Key | Text |
|---|---|
| viewer.fullscreen | Volledig scherm |
| viewer.exitFullscreen | Volledig scherm sluiten |
| customers.printCount | {count, plural, one {# print} other {# prints}} |
| customers.delete | Klant verwijderen |
| customers.allPaid | Alles betaald |
| confirm.deleteCustomer | Klant '{name}' verwijderen? |
| confirm.deleteCustomerBody | {count, plural, one {De print van deze klant wordt verborgen} other {Alle # prints van deze klant worden verborgen}}. De financiële gegevens blijven bewaard en een beheerder kan de klant herstellen. |
| nav.tags | Tags |
| tags.searchOrCreate | Zoek of maak een tag |
| tags.create | Tag '{name}' maken |
| tags.createButton | Tag maken |
| tags.settingsTitle | Tags |
| tags.settingsHelp | Tags zijn voor alle klanten gelijk. Een naam is uniek, hoofdletters tellen niet. |
| tags.color | Kleur |
| tags.noColor | Geen kleur |
| tags.empty | Nog geen tags. |
| tags.none | Geen tags gevonden |
| tags.rename | {name} bewerken |
| tags.useCount | {count, plural, one {# print} other {# prints}} |
| confirm.deleteTag | Tag '{name}' verwijderen? |
| confirm.deleteTagBody | {count, plural, one {De tag wordt van # print verwijderd} other {De tag wordt van # prints verwijderd}}. De prints zelf blijven bestaan. |
| error.tagExists | Deze tag bestaat al. |
| error.tagTooLong | Een tag mag maximaal 64 tekens hebben. |

## Added in 1.4

| Key | Text |
|---|---|
| settings.electricityTariff | Stroomtarief |
| settings.electricityTariffHelp | Gebruikt voor de stroomkosten van elke print: kWh × tarief. |
| settings.materialPrices | Materiaalprijzen |
| settings.materialPricesHelp | Geschatte prijs per kg als Spoolman geen prijs heeft. Volgorde: Spoolman, handmatig, dit standaardbedrag. |
| settings.material | Materiaal |
| settings.pricePerKg | Prijs per kg |
| settings.addMaterial | Materiaal toevoegen |
| settings.printers | Printers |
| settings.printersHelp | Het vermogen (watt) bepaalt de stroomkosten van prints op deze printer. |
| settings.addPrinter | Printer toevoegen |
| settings.deletePrinter | Printer verwijderen |
| settings.printerName | Naam |
| settings.printerWatts | Vermogen |
| settings.printerAliases | Aliassen |
| settings.printerAliasesHelp | Andere namen voor deze printer. |
| settings.printerPrefixes | Timelapse-voorvoegsels |
| settings.printerPrefixesHelp | Beginletters van de bestandsnamen van timelapses van deze printer. |
| settings.printersEmpty | Nog geen printers. Zonder printerprofiel zijn stroomkosten niet meegerekend. |
| error.materialExists | Dit materiaal staat er al. |
| error.invalidWatts | Vul een aantal watt in, bijvoorbeeld 350. |
| error.invalidTariff | Vul een bedrag in, bijvoorbeeld 0,30. |
| confirm.deletePrinter | Printer '{name}' verwijderen? |
| confirm.deletePrinterBody | De stroomkosten van prints op deze printer worden daarna niet meer meegerekend. |
| orders.first | Bestelling 1 |
| orders.repeat | Nabestelling {n} |
| orders.create | Nabestelling maken |
| orders.createIntro | Kies de bestanden voor deze nabestelling en hoe vaak ze worden geprint. |
| orders.unassignedGroup | Nog niet in een bestelling |
| orders.previousGroup | Eerder besteld |
| orders.pickOne | Kies minstens één bestand. |
| orders.delete | Nabestelling verwijderen |
| orders.deleteHelp | Een nabestelling zonder betaling kan worden verwijderd. De bestanden gaan terug naar "Niet in een bestelling". |
| orders.deleteLocked | Staat op factuur {number} en kan niet worden verwijderd. |
| orders.count | {count, plural, one {# bestelling} other {# bestellingen}} |
| orders.notInOrder | Niet in een bestelling |
| orders.notInOrderHint | Nieuw bestand. Voeg het toe aan een nabestelling. |
| orders.unassignedAlert | {count, plural, one {# nieuw bestand staat} other {# nieuwe bestanden staan}} in geen bestelling. Voeg het toe aan een nabestelling. |
| confirm.deleteOrder | Nabestelling {n} verwijderen? |
| confirm.deleteOrderBody | De bestanden gaan terug naar "Niet in een bestelling". De nabestelling heeft geen betaling of afschrijving. |
| payment.undoLast | Maakt de laatste betaling ({amount}) ongedaan. |
| payment.undoneBy | Ongedaan gemaakt door {name} op {date}. |
| error.overpay | Een betaling kan niet hoger zijn dan het openstaande bedrag ({amount}). |
| bulk.spoolTitle | Spoel toewijzen aan {count, plural, one {# print} other {# prints}} |
| bulk.spoolIntro | De gekozen spoel geldt voor de hele print, op elke geselecteerde print. |
| bulk.spoolKeep | Bestanden en slots met een eigen spoel houden die. |
| bulk.assign | Toewijzen |
| bulk.priceTitle | Prijs instellen voor {count, plural, one {# print} other {# prints}} |
| bulk.priceIntro | De prijs komt op de nieuwste bestelling van elke print. |
| bulk.priceSame | Dezelfde prijs voor elke print |
| bulk.priceSuggested | Voorstel uit marge per print ({margin}%) |
| bulk.priceSkipNoCost | Prints zonder kosten worden overgeslagen. |
| bulk.result | {ok} van {total} bijgewerkt |
| bulk.failedTitle | {count, plural, one {# print niet bijgewerkt} other {# prints niet bijgewerkt}} |
| bulk.reason.paid | Nabestelling {n} is al betaald. |
| bulk.reason.writtenOff | Nabestelling {n} is afgeschreven. |
| bulk.reason.invoiced | Staat op factuur {number}. |
| bulk.reason.notBilled | Deze klant wordt niet gefactureerd. |
| bulk.reason.noCost | Kosten ontbreken. |
| bulk.reason.noAccess | Geen toegang. |
| customers.restore | Herstellen |
| tags.colour.rose | Roze |
| tags.colour.orange | Oranje |
| tags.colour.amber | Amber |
| tags.colour.lime | Limoen |
| tags.colour.teal | Turquoise |
| tags.colour.sky | Hemelsblauw |
| tags.colour.blue | Blauw |
| tags.colour.violet | Violet |
| tags.colour.lilac | Lila |
| tags.colour.grey | Grijs |

## Added in 1.5

| Key | Text |
|---|---|
| invoice.line.reorder | {print} (nabestelling {n}) |
| invoice.finalize.blocked | Naam en IBAN ontbreken. Vul ze in bij Instellingen, Bedrijfsgegevens. Een concept kan wel worden gedownload, zonder betaalzin. |
| invoice.paidfull | Deze factuur is volledig betaald. |
| order.locked | Op factuur {nummer} |
| order.unassigned | Nog niet in een bestelling |
| spool.wholePrint | Spoel voor de hele print |
| outstanding.line.pay | Markeer als betaald |
| date.today | Vandaag |
| date.clear | Wissen |
| date.prev / date.next | Vorige maand / Volgende maand |

## Added in 1.6

| Key | Text |
|---|---|
| date.pick | Kies een datum |
| share.closeUncopied | Sluiten zonder kopiëren? |
| share.closeUncopiedBody | Je ziet deze link daarna niet meer. Je kunt hem wel intrekken en een nieuwe maken. |
| common.back | Terug |
| date.daysOne | Over 1 dag |
| date.daysOther | Over {days} dagen |
| date.agoOne | 1 dag geleden |
| date.agoOther | {days} dagen geleden |
| share.expiresTomorrow | Deze link verloopt morgen ({datum}) |
| share.expiresToday | Deze link verloopt vandaag ({datum}) |
| spool.wholePrintSkipped | Spoel gewijzigd in {n, plural, one {# bestelling} other {# bestellingen}}. {m, plural, one {# bestelling} other {# bestellingen}} overgeslagen: staat op een factuur. |
| api.loadError | API-docs konden niet worden geladen |
| api.loadErrorBody | De documentatie kon niet worden opgehaald. Probeer het opnieuw. |

## Added in 1.7

| Key | Text |
|---|---|
| access.empty.title | Nog geen gebruikers om toegang te geven |
| access.empty.body | Alleen Admins en Editors bestaan nu; zij zien altijd elke klant. |
| access.empty.link | Naar Gebruikers |
| api.title | API-docs |
| api.noLoginField | Er is geen inlogveld: de documentatie gebruikt je sessie. |
| api.search | Zoeken |
| api.testRequest | Test request |
| firstrun.tree.label | Voorbeeld van de mappenstructuur |

## Added in 1.9

| Key | Text |
|---|---|
| share.pay.title | Betalen |
| share.pay.iban | IBAN |
| share.pay.name | T.n.v. |
| share.pay.amount | Bedrag |
| share.pay.ref | Kenmerk |
| share.pay.copy.iban | Kopieer IBAN |
| share.pay.copy.name | Kopieer naam |
| share.pay.copy.amount | Kopieer bedrag |
| share.pay.copy.ref | Kopieer kenmerk |
| share.pay.copied | {veld} gekopieerd |
| share.pay.hint | Vermeld bij je betaling het kenmerk. |
| shareLinks.label.help | Alleen voor jezelf, de klant ziet dit niet. |
| shareLinks.filter.label | Toon |
| shareLinks.filter.active | Actief |
| shareLinks.filter.inactive | Inactief |
| shareLinks.filter.all | Alle |
| shareLinks.emptyActive.title | Geen actieve Deel-links |
| shareLinks.emptyActive.body | Alle links zijn verlopen of ingetrokken. Maak een nieuwe link. |
| shareLinks.dup.warning | Je hebt voor {klant} al een link met dit label. Je kunt hem toch maken. |
| shareLinks.once | De volledige link zie je alleen bij het maken. Kwijt? Maak een nieuwe link en trek de oude in. |
| menu.more | Meer acties |
| menu.restore | Herstellen |
| menu.invoice | Factuur maken |
| menu.deleteCustomer | Klant verwijderen |
| models.group | Modellen |
| models.caption | Model {n} van {totaal}: {bestandsnaam} |
| models.loading | Model laden… |
| models.select | Model |
| video.play | Afspelen {bestandsnaam} |
| video.loading | Video laden… |
| video.error.title | De video kon niet worden afgespeeld. |
| video.error.body | Download het bestand om het in een andere speler te openen. |
| video.unsupported.title | Dit formaat speelt niet in de browser. |
| video.unsupported.body | Download het bestand om het af te spelen. |
| cost.missingWattage | Geen vermogen voor {printer}. |
| cost.missingWattageAndPrice | Geen vermogen voor {printer} en geen prijs per kWh. |
| cost.setWattage | Vermogen instellen |
| cost.setInputs | Instellen |
| cost.askAdmin | Vraag een beheerder het vermogen in te stellen. |
| filter.sort | Sorteren |
| filter.status | Status |
| filter.status.all | Alle statussen |
| filter.status.noPrice | Geen prijs |
| filter.status.open | Open |
| filter.status.paid | Betaald |
| filter.status.writtenOff | Afgeschreven |
| filter.status.incompleteCost | Onvolledige kosten |
| sort.newest | Nieuwste eerst |
| sort.oldest | Oudste eerst |
| sort.priceDesc | Prijs: hoog naar laag |
| sort.priceAsc | Prijs: laag naar hoog |
| sort.customer | Klant: A tot Z |
| strip.overview | Overzicht |
| strip.overview.label | Klantenoverzicht ({n} klanten) |
| strip.dialog.title | Alle klanten |
| thumb.label | Voorbeeld |
| outstanding.expandAll | Alles uitklappen |
| outstanding.collapseAll | Alles inklappen |
| outstanding.showAll | Toon alle {n} regels |
| outstanding.sub | {n} klanten, oudste bovenaan |
| invoices.status | Status |
| invoices.noStatus | Geen status |
| settings.dirty | Niet opgeslagen |
| settings.undo | Ongedaan maken |
| settings.leave.title | Wijzigingen niet opgeslagen |
| settings.leave.body | In {secties} staan wijzigingen die nog niet zijn opgeslagen. Als je nu weggaat, gaan ze verloren. |
| settings.leave.stay | Terug naar instellingen |
| settings.leave.go | Verlaten zonder opslaan |
| settings.printer.noPower | Vermogen ontbreekt |
| settings.printer.noPower.help | Zonder vermogen kunnen de stroomkosten van prints op deze printer niet worden berekend. |
| shell.theme.label | Thema: {stand}. Wissel naar {volgende}. |
| shell.theme.system | Systeem |
| shell.theme.light | Licht |
| shell.theme.dark | Donker |
| connection.back | Weer verbonden. |

Removed in 1.9: the toast text for a lost connection (the bar keeps "Verbinding verbroken — opnieuw verbinden…"). Changed: the print subtitle "{klant} / {project}" becomes "{klant}" when the project equals the print name; the share-page line subtitle becomes "{datum}" in the same case.

## Added in 2.2

The three `print.lacks*` keys were named by 2.0 and 2.1 and never entered this deck; they are recorded here with the 2.2 wording, which is a change to `print.lacks` (it was the print-detail chip only and joined with commas).

| Key | Text |
|---|---|
| print.lacks | Ontbreekt: {types} |
| print.lacks.aria | Deze print heeft {items}. |
| print.lacks.item | geen {type}-bestand |
| print.lacks.type.gcode | G-code |
| print.lacks.type.3mf | 3MF |
| print.lacks.type.stl | STL |

Joining, both for `{types}` and for `{items}`: ", " between items and " en " before the last, in the fixed order G-code, 3MF, STL. So `print.lacks` reads "Ontbreekt: G-code", "Ontbreekt: G-code en 3MF", "Ontbreekt: G-code, 3MF en STL", and `print.lacks.aria` reads "Deze print heeft geen G-code-bestand, geen 3MF-bestand en geen STL-bestand."

`print.lacks` is the only visible form and is used in **two** places with the same words: the tooltip bubble on a print card or row, and the worded chip on the print detail (`pp-lacks has-text`). `print.lacks.aria` is the accessible name of the icon group and the sentence in the "Deze print" card; it is never shown in the bubble, which is `aria-hidden` (Tooltip, *Name or description*).

Changed in 2.2: nothing else. No key was removed.

## Added in 2.3

Two groups. The first is new: a control that can override an inherited value has to say what it is overriding (GAP-115). The second is the ModelPicker's own copy, **named by 2.0 and never entered in this deck** — the same oversight the `print.lacks*` keys had in 2.2 — recorded here with the 2.3 wording, which drops the duration (GAP-116).

| Key | Text |
|---|---|
| asset.spoolFromPrint | van de print |
| asset.spoolFromPrint.aria | Spoel van de print: {naam}. Kies hier een eigen spoel voor dit bestand. |
| spool.wholePrint.applies | Geldt nu voor {n, plural, one {# slot} other {# slots}} zonder eigen spoel. |
| spool.wholePrint.appliesNone | Elk slot heeft een eigen spoel, dus deze keuze verandert nu niets. |
| models.groupVideo | Modellen en timelapse |
| models.video | Timelapse |
| models.videoCaption | Timelapse: {bestandsnaam} |
| models.videoName | Timelapse {bestandsnaam} |
| models.videoViewer | Timelapse van {naam} |

`asset.spoolFromPrint` is the text of the `pp-hintchip` **inside** the spool trigger, not beside it: the chip marks provenance and belongs on the control that can override the value. It appears only where a spool is genuinely in force and is not the row's own; a slot that has nothing but a slicer colour keeps `asset.pickSpool` ("Kies een spoel") with the existing `asset.slicerHint` chip, because then nothing is being overridden. `asset.spoolFromPrint.aria` is the trigger's accessible name in that state, so the chip is never the only carrier of the fact.

`spool.wholePrint.applies` sits under `spool.wholePrint` and its existing help line, and says what the whole-print choice is doing right now; `{n}` is counted by the app. No print in the library of 83 has a whole-print spool set, which is what a control that never looked like it did anything earns.

**Changed in 2.3:** the video button's accessible name loses its duration — "Timelapse {bestandsnaam}, {duur}" becomes `models.videoName`, "Timelapse {bestandsnaam}" — because the indexer reads no duration and reading one in the browser would fetch every video to draw a strip. The visible label is `models.video`, "Timelapse".

**Unused but kept:** `models.select` ("Model") was the label of the Select above six models, which 2.0 dropped. It stays in the deck so nothing breaks on import and goes in 3.0. No key was removed in 2.3.

## Added in 2.7

Two groups, both one sentence each, and neither is a new feature. The first fixes a line that stated the opposite of the truth in the state this library is almost always in (GAP-118). The second names a data condition the file list was silently leaving to the model strip (GAP-120).

| Key | Text |
|---|---|
| spool.wholePrint.wouldApply | Een spoel hier geldt voor {n, plural, one {# slot} other {# slots}} zonder eigen spoel. |
| spool.wholePrint.wouldApplyNone | Elk slot heeft al een eigen spoel, dus een spoel hier verandert niets. |
| asset.sameName | Twee verschillende bestanden met dezelfde naam. Dit is het bestand in map {map}. |
| asset.sameNameNoFolder | Twee verschillende bestanden met dezelfde naam in deze print. |
| spool.wholePrint.help | Bestanden en slots met een eigen spoel gaan hierboven voor. |

**`spool.wholePrint.help` is not new text.** It is the existing help line under "Spoel voor de hele print", shown in the preview since 2.3 and never entered in this deck — the same oversight the `print.lacks*` keys had in 2.2 and the `models.*` keys in 2.3. It is recorded here with the words the app already renders; nothing visible changes.

**The whole-print line now has four states, and the word *nu* is the tell.** `spool.wholePrint.applies` and `spool.wholePrint.appliesNone` are unchanged and may be rendered **only while a whole-print spool is set**: they are present-tense claims about what is costing money. Where no spool is set, the same two cells use `wouldApply` / `wouldApplyNone`, which speak about the control ("een spoel hier") instead of the state. Keyed on both axes:

| | a whole-print spool is set | no whole-print spool |
|---|---|---|
| n ≥ 1 slots without their own spool | `spool.wholePrint.applies` | `spool.wholePrint.wouldApply` |
| n = 0 | `spool.wholePrint.appliesNone` | `spool.wholePrint.wouldApplyNone` |

`{n}` is the same count in all four and is the app's to compute. Measured before the change: on a print with two such slots and no spool, the trigger said "Kies een spoel", the total was EUR 1,86, and the line claimed two slots were covered. The 2.3 note in this deck said no print in the library of 83 had a whole-print spool set — which is exactly why the right-hand column needs words and not silence.

**`asset.sameName` is not a duplicate warning and its ink says so.** It is a `muted` `.pp-reason` line, no badge, no `warning`, drawn on **both** rows of a same-name pair, each naming its own `{map}` — the shortest folder form, relative to the print root, that differs between the two. `asset.duplicate` ("Mogelijk dubbel") and `asset.duplicateHint` are unchanged and keep their meaning: the same *content*, where "Gebruik liever Aantal keer geprint" is sound advice. For two distinct files that advice would lose one of them off the invoice, which is why this condition gets its own words. `asset.sameNameNoFolder` is the fallback where the app has no folder for an asset.

**Changed in 2.7:** nothing. **No key was removed.**

## Added in 2.9

**The invoice exclusion lines (GAP-139, GAP-140, GAP-141).** One `excluded` list was rendered through one sentence in one tone, so a print quoted and refused was announced as having no sale price, in `warning` orange. Two conditions, two lines, two tones — see ScreenInvoiceExport.

| key | text |
|---|---|
| invoice.omittedDeclined | {count, plural, one {# print is niet doorgegaan en wordt niet gefactureerd} other {# prints zijn niet doorgegaan en worden niet gefactureerd}}: {names}. |
| invoice.omittedMore | en {count} andere |

**`invoice.omitted` is changed, not new.** It had no plural form, so "1 prints zonder verkoopprijs **zijn** weggelaten" renders today and n = 1 is the common case for that alert. Same key, same meaning, correct grammar. **`invoice.omittedMore`** caps both lists at five names; `do-dont.md` has required a cap on any list that grows since 2.2 and this alert was exempt by oversight. Neither line goes on the Concept PDF, the final invoice, the Overzicht or the share page: they are the operator's, and a customer needs no list of what they declined.

**The request lifecycle, recorded as text (GAP-127, GAP-131, GAP-138).** These are **live in the app** — I verified the words, not the key names, so the names below are mine and the app's own names win if they differ. Tell me the real ones and the deck aligns to them; the text is what this deck is for.

| key (provisional) | text |
|---|---|
| status.notDecided | Nog niet besloten |
| status.inProgress | Mee bezig |
| status.notProceeded | Niet doorgegaan |
| status.notProceededOn | Niet doorgegaan op {date} |
| status.wasPrice | was {amount} |
| bulk.setStatus | Status instellen |
| bulk.statusNone | Geen status |

**`status.wasPrice` has no strikethrough** and that is the point: MoneyDisplay's `<s>` means *replaced by another price*, and this one was not replaced, it was refused. **`bulk.statusNone` is the fourth option of the status dialog, not a clear action** — the owner's decision, and his reason is the one worth keeping: a state must be able to go back, because a klant can change their mind about one print.

**Changed in 2.9:** `invoice.omitted` (plural forms). **No key was removed.**

## Added in 2.10

**Wachtrij (GAP-124, GAP-143).** The queue page. Thirteen keys, all new; nothing changed and nothing removed.

| key | text |
|---|---|
| nav.queue | Wachtrij |
| queue.title | Wachtrij |
| queue.add | Aanvraag toevoegen |
| queue.group.notDecided | Nog niet besloten |
| queue.group.inProgress | Mee bezig |
| queue.groupMeta | {count, plural, one {# aanvraag} other {# aanvragen}} |
| queue.ofWhichWithoutFiles | waarvan {count} zonder bestanden |
| queue.waiting | {count, plural, =0 {vandaag gevraagd} one {# dag geleden gevraagd} other {# dagen geleden gevraagd}} |
| queue.noFiles | Nog geen bestanden |
| queue.linkFiles | Bestanden koppelen |
| queue.changeStatus | Status wijzigen |
| queue.empty | Niets in de wachtrij |
| queue.emptyBody | Nieuwe aanvragen komen hier te staan. |

**`queue.group.*` repeat the words of `status.notDecided` and `status.inProgress` on purpose and are separate keys.** A group heading and a badge are different places with different room, and the badge may be shortened at 480px (StatusBadge) where a heading never is; tying them to one key would make that shortening a page-wide change. The *words* must stay identical — if one changes, both change.

**`queue.noFiles` names the observation, not the inference.** "Nog geen bestanden", never "nog te ontwerpen": a print can lack files because nothing has been downloaded yet, not only because the owner must design it (`README.md` rule 6).

**`queue.ofWhichWithoutFiles` has no plural form and that is deliberate** — it is only ever rendered when the count is one or more, "waarvan 1 zonder bestanden" is correct Dutch, and the group heading it hangs off carries the plural.

**Reused, not duplicated:** ScreenOutstanding's "Toon alle {n} regels" caps the group's list at ten rows here too.

**Changed in 2.10:** nothing. **No key was removed.**

## Added in 2.11

**The queue's wording, the deck's own duplicates and a print's bron and notitie (GAP-148, GAP-149,
GAP-150, GAP-152).** Thirteen new keys, three changed values, five duplicate rows removed, no key
removed.

| key | text |
|---|---|
| outstanding.oldestDays | {days, plural, =0 {alles van vandaag} one {oudste # dag} other {oudste # dagen}} |
| print.source | Bron |
| print.source.add | Bron toevoegen |
| print.source.placeholder | https://… |
| print.source.fromFolder | uit de map |
| print.source.fromFolderAria | Gevonden in {bestandsnaam}, in de map van deze print |
| print.source.open | {host}, opent in een nieuw tabblad |
| print.source.more | +{count} |
| print.source.invalid | Vul een volledige link in, met https:// ervoor. |
| print.note | Notitie |
| print.note.add | Notitie toevoegen |
| print.note.placeholder | Wat moet er nog gemaakt worden? |
| print.note.internal | Alleen voor jou. Niet zichtbaar op de deel-link. |

**`outstanding.oldestDays` is the group summary's age badge, on Openstaand and on Wachtrij both.**
`outstanding.oldest` keeps its one meaning — the StatTile label "Oudste openstaande print" — and
the badge that 1.9 gave the same key gets this one (GAP-148). It is **one** key for both screens
because the badge is one component's slot (`.pp-ogrp > summary > .age`), the words are identical in
both places and neither shortens on the phone; the `outstanding.` prefix names where
OutstandingGroup's copy lives, exactly as `outstanding.showAll` already does on Wachtrij. So
ScreenQueue needs no `queue.oldest` of its own (GAP-149).

**`print.*` is the print record's own copy, not the queue's.** A request is the same record without
a folder (2.10), so a bron and a notitie are print fields that a queue row happens to read; keying
them to `queue.` would make the print detail borrow the queue's words.

**No `print.source.remove` and no `print.note.remove`.** Clearing is done by emptying the field and
saving, because 2.9 settled that absence is a **value** and not a separate act (GAP-138, "Geen
spoel", "Geen status"): a remove button would offer something destructive-looking for an act that
destroys nothing, and would need its own confirmation story. `common.save` and `common.cancel`
carry the editor.

**`print.source.open` is the link's accessible name, not visible text.** The visible text is the
host (`makerworld.com/models/482193`, ellipsised at its end); the accessible name says where it
goes and that it opens a new tab, because "(opent in een nieuw tabblad)" belongs in the name, as
the share page's payment link already has it (2.0.1).

**`print.note.internal` is rendered beside the field, always, not only while typing.** It is the
one field on a print that never reaches a customer, and the only place that fact can be checked is
where the note is written.

**Changed in 2.11** (same keys, same placeholders, no call site moves):

- **`queue.waiting`** — was "{count, plural, one {# dag} other {# dagen}} geleden gevraagd", is now
  "{count, plural, =0 {vandaag gevraagd} one {# dag geleden gevraagd} other {# dagen geleden
  gevraagd}}". The zero arm is the **common** case: most requests are entered the day they arrive,
  so "0 dagen geleden gevraagd" was what the owner read right after "Aanvraag toevoegen"
  (GAP-150). There is deliberately **no `=1 {gisteren gevraagd}`** arm: "1 dag geleden gevraagd" is
  correct Dutch and reads consistently with 2 and 3 days, where "gisteren" would switch the badge's
  vocabulary twice inside three days.
- **`status.daysOpen`** — was "{days} dagen open", is now "{days, plural, =0 {sinds vandaag open}
  one {# dag open} other {# dagen open}}". The same fault on the money side, changed without being
  raised: with no plural at all, an invoice dated today rendered "0 dagen open" and one dated
  yesterday "1 dagen open".
- **`api.loadErrorBody`** — was "De Swagger UI kon niet worden opgehaald. Probeer het opnieuw.",
  is now "De documentatie kon niet worden opgehaald. Probeer het opnieuw." This was a **live
  conflict**, not a tidy-up: 1.7 reworded it away from the word *Swagger* and left the 1.6 row in
  place, and since the importer takes the first occurrence the app has been showing the wording 1.7
  replaced. Check it in the running app after importing — and check `invoice.omitted`, whose 2.9
  plural forms sat behind an older unpluralized row in exactly the same way.

**Removed rows (no key removed):** the second `outstanding.oldest`, the second `invoice.omitted`,
the second `cost.incomplete`, the second `api.loadErrorBody`, and the whole duplicated *Added in
1.7* section — nine rows repeating the section above them word for word. Every key those rows named
still exists, once.

**Not changed, deliberately:** `share.expiresIn` "Over {days} dagen", `overview.expiryNotice` and
`outstanding.groupMeta` "{count} prints · oudste {days} dagen open" are unpluralized too, but
`share.expiresToday` / `share.expiresTomorrow` and `date.daysOne` / `date.daysOther` may already
cover the counts that would read wrong, and `outstanding.groupMeta` may be dead copy since 1.9
split the summary into `.ttl` and `.age`. Which of them is imported, and which call site renders
it, is a question for the app (GAP-154).

**Answered in 2.12 (GAP-154), by the app's measurement of every call site.** `share.expiresIn` was
dead — never imported, zero call sites — and its row is gone. `overview.expiryNotice` and
`date.daysOne` / `date.daysOther` are reached only from two days up, or through a branch that
handles 1 in code, so they stay as they are. `outstanding.groupMeta` was the opposite of the guess
above: alive, rendered on every Openstaand group, and reading "1 prints · oudste 1 dagen open".
It is changed in 2.12, and a fifth string nobody had listed, `outstanding.groupLabel`, is added
there.

## Added in 2.12

**The group summary says the age once, and its accessible name gets its plurals (GAP-154).** One
new key, one changed value, one row removed, one key reused in a new slot.

| key | text |
|---|---|
| outstanding.groupLabel | {customer}, {count, plural, one {# print} other {# prints}}, {days, plural, =0 {alles van vandaag} one {oudste # dag} other {oudste # dagen}}, {amount} |

**`outstanding.groupLabel` is the `aria-label` of an Openstaand group summary.** 1.9 specified that
string in prose — "Joey, 18 prints, oudste 741 dagen, € 640,12" — and never gave it a key, so the
app wrote its own without plurals and a screen reader heard "1 prints, oudste 1 dagen" on the one
component whose visible badge 2.11 had just fixed. A string the deck does not carry is a string
nobody proofreads. Its day arms are `outstanding.oldestDays`' arms word for word, because the
accessible name should say what the badge says. **It keeps the age clause although the visible meta
line loses it:** the name must name what is on screen, and the badge is on screen.

**Changed in 2.12** (same key, same call site):

- **`outstanding.groupMeta`** — was "{count} prints · oudste {days} dagen open", is now
  "{count, plural, one {# print} other {# prints}}". Two faults and a duplicate in six words: no
  plural on either count ("1 prints · oudste 1 dagen open"), and since 2.11 gave the `.age` badge
  20px away the words "oudste 1 dag", the summary said the age twice in two vocabularies. The age
  belongs to the badge — it has the icon, the three age steps and the zero arm — so the meta line
  keeps only what the badge cannot say. **OutstandingGroup's own preview has drawn "3 prints" since
  1.9**, so this aligns the key with the design rather than changing the design.

**Reused, not duplicated:** `queue.ofWhichWithoutFiles` now renders as the **second muted line of
the `.ttl` block** on Wachtrij instead of in the `.amt` slot (GAP-155). Same key, same words, same
call site — a different slot. `queue.groupMeta` is the line above it.

**Removed row:** `share.expiresIn` "Over {days} dagen". Measured dead — not in `nl.ts`, zero call
sites — and the three keys that do own the cases it would have covered (`share.expiresToday`,
`share.expiresTomorrow`, `overview.expiryNotice`) are unchanged. Nothing to migrate.

**No label key for Wachtrij's group summary, deliberately.** Its accessible name is its own visible
text in DOM order — heading, count, "waarvan n zonder bestanden", age badge — which is exactly the
sentence ScreenQueue's *Accessibility* paragraph asks for, so a second copy of it in a key could
only drift from it. Openstaand needs `outstanding.groupLabel` because its summary also carries an
amount and 1.9 fixed the order of that name. If the app does set an `aria-label` on a Wachtrij
summary, it must spell those same words in that same order; preferring no `aria-label` is simpler
and cannot go stale.
