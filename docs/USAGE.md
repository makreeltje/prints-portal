# Gebruik

Deze handleiding is voor het dagelijks werken met het portaal. Installeren en
instellen staan in [DEPLOYMENT.md](DEPLOYMENT.md) en
[CONFIGURATION.md](CONFIGURATION.md).

## Je bestanden ordenen

Het portaal leest één map en schrijft daar nooit in. De indeling bepaalt alles:

```
prints/
└─ Joey/                        klant
   └─ Babybox locks/            project; dit is één print
      ├─ Babybox_locks.gcode
      ├─ Babybox_locks.3mf
      └─ Babybox_locks.stl
```

- De **eerste map** is de klant, de **tweede** het project. Eén projectmap is
  één print.
- Een bestand los in de klantmap wordt zelf een print.
- Mappen met de naam **Nog te printen** of **Test** tellen niet mee in de
  kosten; de bestanden blijven wel zichtbaar.
- Ligt er een `.gcode` naast een `.3mf` van hetzelfde model, dan telt alleen de
  G-code mee, zodat het gewicht niet dubbel wordt geteld.
- Bestanden met `copy`, `(1)` of `- 2` in de naam worden gemarkeerd als
  **Mogelijk dubbel**. Gebruik liever **Aantal keer geprint**.

Zodra je bestanden neerzet, pikt het portaal ze vanzelf op. Gebeurt dat niet,
dan staat bij **Instellingen** de knop **Opnieuw indexeren**.

## Kosten

Per print rekent het portaal uit wat hij kost: materiaal plus stroom.

- **Materiaal** komt uit de spoel die je kiest, anders uit de
  **Materiaalprijzen** bij Instellingen.
- **Stroom** komt uit het vermogen van het printerprofiel en het
  **Stroomtarief**. Zonder printerprofiel blijven de stroomkosten leeg en staat
  er **Onvolledig**.
- **Aantal keer geprint** vermenigvuldigt de kosten van dat bestand.
- Klopt een waarde niet, dan kun je bij **Totaalkosten → Aanpassen** het
  gewicht, de tijd of de prijs per kilo met de hand zetten.

Met Spoolman gekoppeld kies je een echte spoel, en gebruikt het portaal de
prijs per kilo daarvan. **Spoel voor de hele print** zet hem in één keer op
alle bestanden; bestellingen die al op een factuur staan slaat hij over.

## Prijzen en betalingen

- **Verkoopprijs** is wat de klant betaalt. Met een **Standaardmarge**
  ingesteld doet het portaal een voorstel; je kunt het overnemen of je eigen
  bedrag invullen.
- **Markeer als betaald** boekt een betaling. Een lager bedrag is een
  deelbetaling: de rest blijft openstaan.
- **Afschrijven** sluit de rest af als er niet meer betaald gaat worden. Wat al
  betaald was, blijft betaald.
- Een beheerder kan een betaling of afschrijving ongedaan maken.
- Klanten met **Niet factureren** (Instellingen → Klanten) tellen nergens mee
  in het geld; je ziet alleen de kosten.

### Openstaand

**Openstaand** toont per klant wat er nog binnen moet komen, oudste eerst, met
het aantal dagen. Je kunt per regel afboeken, alles van een klant in één keer,
of een **Herinnering (PDF)** downloaden.

## Facturen

1. Klik **Factuur** op de kaart van een klant.
2. Kies eventueel **Van** en **Tot en met** (dat werkt op de datum van de
   bestelling) en of je alleen openstaande regels wilt.
3. **Concept downloaden** geeft een PDF zonder nummer, om vast te laten zien.
4. **Definitief maken** geeft de factuur een nummer (`2026-001`, per jaar
   doorlopend) en bewaart de PDF.

Een definitieve factuur **vergrendelt** de bestelling: prijs, kosten en aantal
keer geprint liggen vast. Corrigeren doe je met een **creditnota** (beheerder),
niet met een wijziging. Een creditnota boekt af wat nog openstond; wat al
betaald was, blijft betaald.

Vul eerst **Bedrijfsgegevens** in bij Instellingen. Zonder naam en IBAN weigert
het portaal een factuur definitief te maken, want dan kan er geen betaalzin op.

## Deel-links

Een Deel-link is een pagina die je klant opent zonder in te loggen.

1. **Deel-links → Deel-link maken**: kies de klant, geef een label en kies hoe
   lang hij geldig is (7, 30 of 90 dagen, of Nooit).
2. De link verschijnt **één keer**. Kopieer hem meteen; daarna is alleen het
   label nog zichtbaar.
3. **Intrekken** zet hem direct uit.

De klant ziet zijn prints met prijs en status, kan **Alleen openstaand**
aanzetten en een **Overzicht** als PDF downloaden. Hij ziet nooit je kosten,
je marge, bestandsnamen of andere klanten. Een klant met **Niet factureren**
ziet alleen de lijst met prints, zonder bedragen.

## Rollen

- **Beheerder (Admin)**: alles, plus gebruikers, toegang, creditnota's en het
  herstellen van verwijderde prints.
- **Editor**: alles rond prints, kosten, prijzen en facturen.
- **Gebruiker (User)**: kijkt alleen mee, en alleen bij de klanten die een
  beheerder heeft toegewezen bij **Toegang**.

## Handige details

- **Verwijderen** verbergt een print; de financiële gegevens blijven. Een
  beheerder kan herstellen.
- Verdwijnt een map van schijf, dan wordt de print **Gearchiveerd**: je ziet
  hem nog, met prijs en betaling, maar de bestanden zijn weg.
- Het bolletje linksonder is de live-verbinding. Valt die weg, dan verschijnt
  er een balk; het portaal verbindt zelf opnieuw.
- **Thema** wisselt tussen Systeem, Licht en Donker, per browser.
- Op **API-docs** staat de volledige API, met de mogelijkheid om een verzoek
  direct uit te proberen.
