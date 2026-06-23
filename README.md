# Toegankelijkheidstester

WCAG 2.1 AA scanner voor overheidswebsites, gebaseerd op het **Besluit digitale toegankelijkheid overheid** en de Europese norm **EN 301 549**.

## Wat doet de tool?

De scanner:
- Laadt een webpagina met een echte Chromium-browser (Playwright)
- Voert **axe-core** uit voor geautomatiseerde WCAG-controles
- Voert aanvullende eigen checks uit (skip-links, tabindex, autocomplete, etc.)
- Genereert een **interactief HTML-rapport** met:
  - Scorecijfer (0–100)
  - Problemen per ernst: kritiek / ernstig / matig / klein
  - Nederlandse uitleg per probleem
  - Concrete oplossingsinstructies per probleem
  - Koppenstructuur-overzicht
  - Checklist voor handmatige controle

## Installatie

```bash
npm install
```

Vereist: Node.js 18+ en Chromium via `/opt/pw-browsers/chromium-1194/`.

## Gebruik

```bash
node src/cli.js --url https://www.gemeente.nl
```

### Opties

| Optie | Beschrijving | Standaard |
|-------|-------------|-----------|
| `-u, --url <url>` | Te scannen URL (verplicht) | — |
| `-o, --output <pad>` | Pad voor het HTML-rapport | `rapport.html` |
| `--json` | Sla ook een JSON-rapport op | — |

### Voorbeelden

```bash
# Basisgebruik
node src/cli.js --url https://www.rijksoverheid.nl

# Aangepaste bestandsnaam
node src/cli.js --url https://www.gemeente-amsterdam.nl --output amsterdam.html

# Inclusief JSON-export
node src/cli.js --url https://www.duo.nl --output duo-rapport.html --json
```

## Gecontroleerde WCAG-criteria

De tool controleert automatisch op:

| Criterium | WCAG | Niveau |
|-----------|------|--------|
| Afbeeldingen zonder alt-tekst | 1.1.1 | A |
| Video zonder ondertitels | 1.2.2 | A |
| Koppenstructuur | 1.3.1 | A |
| Kleurcontrast | 1.4.3 | AA |
| Tekst in afbeeldingen | 1.4.5 | AA |
| Toetsenbordtoegankelijkheid | 2.1.1 | A |
| Geen tijdslimieten | 2.2.1 | A |
| Skip-links | 2.4.1 | A |
| Paginatitel | 2.4.2 | A |
| Focusvolgorde | 2.4.3 | A |
| Linkdoel duidelijk | 2.4.4 | A |
| Taal van pagina | 3.1.1 | A |
| Geen onverwachte context | 3.2.2 | A |
| Formulierlabels | 1.3.1 | A |
| Knop- en linknamen | 4.1.2 | A |
| ARIA-gebruik | 4.1.1 / 4.1.2 | A |
| Autocomplete persoonlijke velden | 1.3.5 | AA |
| Links in nieuw tabblad | 3.2.2 | A |
| Verplichte velden | 1.3.1 | A |
| Landmark-structuur | 1.3.6 | AA |

## Beperkingen

Automatische tools detecteren ~30–40% van WCAG-problemen. Het rapport geeft een checklist van punten die handmatig gecontroleerd moeten worden (toetsenbordnavigatie, schermlezers, kleurenblindheid, etc.).

## Wettelijk kader

Overheidswebsites zijn verplicht te voldoen aan WCAG 2.1 niveau AA op basis van:
- [Besluit digitale toegankelijkheid overheid](https://www.toegankelijkheidsverklaring.nl/)
- [Europese norm EN 301 549](https://www.etsi.org/deliver/etsi_en/301500_302000/301549/)
- [Wet digitale overheid (Wdo)](https://wetten.overheid.nl/BWBR0048156/)
