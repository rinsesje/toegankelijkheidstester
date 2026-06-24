# Toegankelijkheidstester

WCAG 2.1 AA scanner voor overheidswebsites, gebaseerd op het **Besluit digitale toegankelijkheid overheid** en de Europese norm **EN 301 549**.

## Installatie (lokaal)

**Vereisten:** Node.js 18 of hoger

```bash
# 1. Kloon de repository
git clone https://github.com/rinsesje/toegankelijkheidstester.git
cd toegankelijkheidstester

# 2. Installeer npm-pakketten
npm install

# 3. Download Chromium (eenmalig, ~150 MB)
npx playwright install chromium
```

> **Heb je al Chrome of Chromium geïnstalleerd?** Dan kun je stap 3 overslaan
> en in plaats daarvan de omgevingsvariabele instellen:
>
> ```bash
> export CHROMIUM_PATH="/usr/bin/google-chrome"   # Linux
> export CHROMIUM_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"  # macOS
> ```

## Gebruik

```bash
node src/cli.js --url https://www.rijksoverheid.nl
```

Het rapport wordt opgeslagen als `rapport.html` en kun je openen in je browser.

### Alle opties

| Optie | Beschrijving | Standaard |
|-------|-------------|-----------|
| `-u, --url <url>` | Te scannen URL (verplicht) | — |
| `-o, --output <pad>` | Bestandsnaam voor het HTML-rapport | `rapport.html` |
| `--json` | Sla ook een JSON-rapport op | — |

### Voorbeelden

```bash
# Basisgebruik
node src/cli.js --url https://www.rijksoverheid.nl

# Aangepaste bestandsnaam
node src/cli.js --url https://www.gemeente-amsterdam.nl --output amsterdam.html

# Inclusief JSON-export
node src/cli.js --url https://www.duo.nl --output duo.html --json

# Met eigen Chrome-installatie (geen Playwright-browser nodig)
CHROMIUM_PATH="/usr/bin/google-chrome" node src/cli.js --url https://www.overheid.nl
```

## Wat controleert de tool?

De tool combineert **axe-core** (geïndustrie-standaard) met eigen aanvullende checks:

| Criterium | WCAG | Niveau |
|-----------|------|--------|
| Afbeeldingen zonder alt-tekst | 1.1.1 | A |
| Video zonder ondertitels | 1.2.2 | A |
| Koppenstructuur slaat niveaus over | 1.3.1 | A |
| Formuliervelden zonder label | 1.3.1 | A |
| Verplichte velden niet programmatisch gemarkeerd | 1.3.1 | A |
| Autocomplete op persoonlijke gegevensvelden | 1.3.5 | AA |
| Landmark-structuur (main, nav, header, footer) | 1.3.6 | AA |
| Kleurcontrast | 1.4.3 | AA |
| Tekst in afbeeldingen | 1.4.5 | AA |
| Toetsenbordtoegankelijkheid | 2.1.1 | A |
| Tijdslimieten / automatische verversing | 2.2.1 | A |
| Skip-link ("Sla naar hoofdinhoud") | 2.4.1 | A |
| Paginatitel | 2.4.2 | A |
| Focusvolgorde / positieve tabindex | 2.4.3 | A |
| Linkdoel duidelijk | 2.4.4 | A |
| Taal van de pagina | 3.1.1 | A |
| Links in nieuw tabblad zonder waarschuwing | 3.2.2 | A |
| ARIA-gebruik correct | 4.1.1 / 4.1.2 | A |
| Knoppen en links met toegankelijke naam | 4.1.2 | A |

## Het rapport

Het HTML-rapport bevat:
- **Scorecijfer** (0–100) met kleurcodering
- Problemen gesorteerd op ernst: 🔴 Kritiek / 🟠 Ernstig / 🔵 Matig / 🟢 Klein
- Per probleem: Nederlandse uitleg + **concrete oplossingsinstructie** + gevonden HTML-elementen
- Filterbaar per ernstniveau
- Koppenstructuuroverzicht
- Checklist voor handmatige controle

## Beperkingen

Automatische tools detecteren ~30–40% van WCAG-problemen. Het rapport bevat een checklist voor handmatige controle: toetsenbordnavigatie, schermlezers, kleurenblindheid, PDF-documenten, etc.

## Wettelijk kader

Overheidswebsites zijn verplicht te voldoen aan WCAG 2.1 niveau AA:
- [Besluit digitale toegankelijkheid overheid](https://www.toegankelijkheidsverklaring.nl/)
- [Europese norm EN 301 549](https://www.etsi.org/deliver/etsi_en/301500_302000/301549/)
- [Wet digitale overheid (Wdo)](https://wetten.overheid.nl/BWBR0048156/)
