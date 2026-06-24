'use strict';

const { chromium } = require('playwright');
const { readFileSync, existsSync } = require('fs');
const path = require('path');

// Zoek automatisch een bruikbare Chromium/Chrome installatie
function findChromiumPath() {
  // 1. Omgevingsvariabele (voor CI of aangepaste installaties)
  if (process.env.CHROMIUM_PATH && existsSync(process.env.CHROMIUM_PATH)) {
    return process.env.CHROMIUM_PATH;
  }
  // 2. Bekende paden (Linux, macOS, Windows)
  const candidates = [
    // Linux systeem
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/snap/bin/chromium',
    // macOS
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    // Cloud-omgeving (fallback)
    '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  // 3. Geen pad gevonden – Playwright gebruikt zijn eigen gedownloade browser
  return null;
}

// WCAG 2.1 AA criteria verplicht voor Nederlandse overheid (EN 301 549 / Besluit digitale toegankelijkheid)
const WCAG_REMEDIATION = {
  'color-contrast': {
    wcag: '1.4.3',
    level: 'AA',
    title: 'Onvoldoende kleurcontrast',
    remediation: `Zorg dat tekst een contrastverhouding heeft van minimaal 4,5:1 ten opzichte van de achtergrond (grote tekst ≥18pt of vet ≥14pt mag 3:1 zijn). Gebruik een contrastchecker zoals WebAIM Contrast Checker om kleuren te valideren. Pas de tekst- of achtergrondkleur aan totdat het contrast voldoende is.`,
  },
  'image-alt': {
    wcag: '1.1.1',
    level: 'A',
    title: 'Afbeelding zonder alternatieve tekst',
    remediation: `Voeg een beschrijvend alt-attribuut toe aan elke informatieve afbeelding: <img alt="beschrijving van de afbeelding">. Decoratieve afbeeldingen krijgen een leeg alt-attribuut: <img alt="">. Complexe afbeeldingen (grafieken, infographics) hebben een uitgebreide beschrijving nodig via aria-describedby of een naastgelegen tekst.`,
  },
  'label': {
    wcag: '1.3.1',
    level: 'A',
    title: 'Formulierveld zonder label',
    remediation: `Koppel elk formulierveld aan een zichtbaar label via het for/id-attribuut: <label for="veld">Naam</label><input id="veld">. Als een zichtbaar label ontbreekt, gebruik dan aria-label of aria-labelledby. Placeholder-tekst is geen vervanging voor een label.`,
  },
  'button-name': {
    wcag: '4.1.2',
    level: 'A',
    title: 'Knop zonder toegankelijke naam',
    remediation: `Geef elke knop een beschrijvende tekst. Voor knoppen met alleen een icoon: gebruik aria-label="Omschrijving" of voeg een visueel verborgen tekst toe met class="sr-only". Vermijd knoppen die alleen zeggen "Klik hier" of "Meer".`,
  },
  'link-name': {
    wcag: '2.4.4',
    level: 'A',
    title: 'Link zonder beschrijvende tekst',
    remediation: `Zorg dat elke link een beschrijvende tekst heeft die de bestemming of het doel duidelijk maakt. Gebruik aria-label voor links met alleen iconen. Vermijd generieke teksten als "klik hier" of "lees meer" zonder context – voeg via aria-label of aria-describedby extra context toe.`,
  },
  'document-title': {
    wcag: '2.4.2',
    level: 'A',
    title: 'Paginatitel ontbreekt of is leeg',
    remediation: `Voeg een unieke, beschrijvende <title> toe aan elke pagina: <title>Paginanaam - Sitenaam</title>. De paginatitel moet het doel van de pagina beschrijven en verschijnen vóór de naam van de organisatie.`,
  },
  'html-lang-valid': {
    wcag: '3.1.1',
    level: 'A',
    title: 'Paginataal niet of onjuist ingesteld',
    remediation: `Stel de taal van de pagina in via het lang-attribuut op het html-element: <html lang="nl"> voor Nederlands. Gebruik geldige BCP47-taalcodes. Bij meertalige content, markeer anderstalige passages met lang op het omliggende element.`,
  },
  'landmark-one-main': {
    wcag: '1.3.6',
    level: 'AA',
    title: 'Geen main landmark aanwezig',
    remediation: `Voeg één <main>-element of role="main" toe aan de hoofdinhoud van elke pagina. Dit helpt screenreadergebruikers direct naar de hoofdinhoud te navigeren. Gebruik ook <header>, <nav>, <footer> en <aside> voor een logische paginastructuur.`,
  },
  'region': {
    wcag: '1.3.6',
    level: 'AA',
    title: 'Inhoud buiten landmark-regio',
    remediation: `Wikkel alle pagina-inhoud in semantische HTML5-landmark-elementen: <header>, <main>, <nav>, <aside>, <footer>. Gebruik role="region" met aria-label voor aanvullende secties. Dit geeft screenreadergebruikers een overzicht van de paginastructuur.`,
  },
  'heading-order': {
    wcag: '1.3.1',
    level: 'A',
    title: 'Koppenstructuur slaat niveaus over',
    remediation: `Gebruik koppen in logische volgorde: begin met één <h1> (paginatitel), gevolgd door <h2> voor hoofdsecties, <h3> voor subsecties, enzovoort. Sla geen niveaus over (bijv. van h2 direct naar h4). Gebruik koppen om structuur aan te geven, niet voor visuele opmaak.`,
  },
  'frame-title': {
    wcag: '2.4.1',
    level: 'A',
    title: 'Frame/iframe zonder titel',
    remediation: `Voeg een beschrijvend title-attribuut toe aan elk iframe: <iframe title="Beschrijving van de inhoud">. Als het iframe decoratief is, voeg dan title="decoratief" toe en role="presentation". Lege iframes kunnen worden verborgen met aria-hidden="true".`,
  },
  'duplicate-id': {
    wcag: '4.1.1',
    level: 'A',
    title: 'Dubbel id-attribuut',
    remediation: `Elk id-attribuut moet uniek zijn binnen een pagina. Controleer alle id-waarden en zorg dat ze nergens dubbel voorkomen. Dit is vooral belangrijk bij formulieren, ARIA-referenties en ankerlinks. Gebruik JavaScript of browsertools om duplicaten te vinden.`,
  },
  'aria-required-attr': {
    wcag: '4.1.2',
    level: 'A',
    title: 'Verplicht ARIA-attribuut ontbreekt',
    remediation: `Sommige ARIA-rollen vereisen specifieke attributen (bijv. role="checkbox" vereist aria-checked). Raadpleeg de WAI-ARIA specificatie voor de vereiste attributen per rol en voeg de ontbrekende toe. Overweeg native HTML-elementen te gebruiken die al de juiste semantiek hebben.`,
  },
  'aria-valid-attr-value': {
    wcag: '4.1.2',
    level: 'A',
    title: 'Ongeldige ARIA-attribuutwaarde',
    remediation: `Controleer of ARIA-attributen geldige waarden hebben. Booleans zoals aria-expanded accepteren alleen "true" of "false". ID-referenties zoals aria-labelledby moeten verwijzen naar bestaande elementen. Raadpleeg de WAI-ARIA specificatie voor toegestane waarden.`,
  },
  'scrollable-region-focusable': {
    wcag: '2.1.1',
    level: 'A',
    title: 'Scrollbaar gebied niet toetsenbordtoegankelijk',
    remediation: `Voeg tabindex="0" toe aan scrollbare gebieden die niet interactief zijn, zodat toetsenbordgebruikers er naar kunnen scrollen. Zorg dat de scrollbare inhoud bereikbaar is via de Tab-toets en dat de scrollfunctie werkt met pijltjestoetsen.`,
  },
  'tabindex': {
    wcag: '2.4.3',
    level: 'A',
    title: 'Ongepast gebruik van tabindex',
    remediation: `Vermijd tabindex-waarden groter dan 0, want deze verstoren de logische tabvolgorde. Gebruik tabindex="0" om elementen focusbaar te maken en tabindex="-1" voor programmatische focus. De visuele en DOM-volgorde moeten overeenkomen met de logische tabvolgorde.`,
  },
  'bypass': {
    wcag: '2.4.1',
    level: 'A',
    title: 'Geen "Sla navigatie over"-link',
    remediation: `Voeg een "Sla naar hoofdinhoud"-link toe als eerste focusbaar element op de pagina: <a href="#main" class="skip-link">Sla naar hoofdinhoud</a>. Deze kan visueel verborgen zijn maar moet zichtbaar worden bij focus. Het doel-element moet id="main" hebben.`,
  },
  'html-has-lang': {
    wcag: '3.1.1',
    level: 'A',
    title: 'HTML-element mist lang-attribuut',
    remediation: `Voeg een lang-attribuut toe aan het <html>-element met de juiste taalcode: <html lang="nl"> voor Nederlands. Dit is essentieel voor schermleessoftware om de juiste taal en uitspraakinstellingen te gebruiken.`,
  },
  'input-image-alt': {
    wcag: '1.1.1',
    level: 'A',
    title: 'Afbeeldingsknop zonder alternatieve tekst',
    remediation: `Voeg een beschrijvend alt-attribuut toe aan <input type="image">: <input type="image" alt="Zoeken">. De alt-tekst moet het doel van de knop beschrijven, niet de afbeelding zelf.`,
  },
  'select-name': {
    wcag: '4.1.2',
    level: 'A',
    title: 'Selectielijst zonder toegankelijke naam',
    remediation: `Koppel een <label> aan elke <select>: <label for="keuze">Kies een optie</label><select id="keuze">. Zonder zichtbaar label, gebruik aria-label of aria-labelledby.`,
  },
  'meta-refresh': {
    wcag: '2.2.1',
    level: 'A',
    title: 'Automatische paginaverversing of doorverwijzing',
    remediation: `Verwijder meta-refresh tags die de pagina automatisch vernieuwen of doorsturen. Als doorverwijzing nodig is, doe dit server-side direct (HTTP 301/302). Geef gebruikers altijd de mogelijkheid om een tijdslimiet uit te schakelen, aan te passen of te verlengen.`,
  },
  'video-caption': {
    wcag: '1.2.2',
    level: 'A',
    title: 'Video zonder ondertitels',
    remediation: `Voeg ondertitels toe aan alle video's met gesproken inhoud via een <track kind="captions"> element. Gebruik het WebVTT-formaat. Zorg dat ondertitels alle gesproken woorden en relevante geluiden bevatten en goed gesynchroniseerd zijn.`,
  },
};

// Aanvullende custom checks die axe-core niet dekt
async function runCustomChecks(page) {
  return page.evaluate(() => {
    const issues = [];

    // Check: focusvolgorde logisch (simplified)
    const focusableElements = Array.from(document.querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex]'
    ));
    const positiveTabindex = focusableElements.filter(
      el => parseInt(el.getAttribute('tabindex')) > 0
    );
    if (positiveTabindex.length > 0) {
      issues.push({
        id: 'tabindex-positive',
        impact: 'moderate',
        description: `${positiveTabindex.length} element(en) met positieve tabindex gevonden, wat de tabvolgorde verstoort.`,
        wcag: '2.4.3',
        level: 'A',
        title: 'Positieve tabindex-waarden verstoren tabvolgorde',
        remediation: 'Vervang positieve tabindex-waarden door tabindex="0" en orden de DOM-structuur logisch. De DOM-volgorde bepaalt de tabvolgorde wanneer alle tabindex-waarden 0 of lager zijn.',
        nodes: positiveTabindex.slice(0, 3).map(el => ({
          html: el.outerHTML.substring(0, 150),
          target: el.tagName.toLowerCase() + (el.id ? '#' + el.id : ''),
        })),
      });
    }

    // Check: links openen in nieuw tabblad zonder waarschuwing
    const newTabLinks = Array.from(document.querySelectorAll('a[target="_blank"]')).filter(link => {
      const text = link.textContent + (link.getAttribute('aria-label') || '');
      return !text.includes('nieuw tabblad') && !text.includes('new tab') && !text.includes('nieuw venster') && !link.querySelector('[aria-label*="nieuw"]');
    });
    if (newTabLinks.length > 0) {
      issues.push({
        id: 'link-new-tab-warning',
        impact: 'minor',
        description: `${newTabLinks.length} link(s) openen in een nieuw tabblad zonder gebruikers hierover te informeren.`,
        wcag: '3.2.2',
        level: 'A',
        title: 'Links openen in nieuw tabblad zonder waarschuwing',
        remediation: 'Voeg "(opent in nieuw tabblad)" toe aan de linktekst of gebruik een visueel icoon met een aria-label. Overweeg links niet automatisch in een nieuw tabblad te openen, tenzij echt noodzakelijk.',
        nodes: newTabLinks.slice(0, 3).map(el => ({
          html: el.outerHTML.substring(0, 150),
          target: el.tagName.toLowerCase() + (el.id ? '#' + el.id : ''),
        })),
      });
    }

    // Check: formulierfouten worden via ARIA gecommuniceerd
    const requiredFields = document.querySelectorAll('[required], [aria-required="true"]');
    const missingAriaRequired = Array.from(requiredFields).filter(el => !el.getAttribute('aria-required') && !el.getAttribute('required'));
    // Note: inverse – check for inputs that are visually marked required but lack the HTML attribute
    const visuallyRequired = Array.from(document.querySelectorAll('label')).filter(label => {
      const text = label.textContent;
      return (text.includes('*') || text.toLowerCase().includes('verplicht')) &&
             !document.getElementById(label.getAttribute('for'))?.hasAttribute('required') &&
             !document.getElementById(label.getAttribute('for'))?.getAttribute('aria-required');
    });
    if (visuallyRequired.length > 0) {
      issues.push({
        id: 'required-field-not-marked',
        impact: 'moderate',
        description: `${visuallyRequired.length} veld(en) lijkt visueel verplicht (via * of "verplicht") maar mist het required-attribuut.`,
        wcag: '1.3.1',
        level: 'A',
        title: 'Verplicht veld niet programmatisch gemarkeerd',
        remediation: 'Voeg required of aria-required="true" toe aan verplichte formuliervelden. Dit zorgt dat screenreaders de vereiste status aankondigden, niet alleen het asterisk-teken.',
        nodes: visuallyRequired.slice(0, 3).map(el => ({
          html: el.outerHTML.substring(0, 150),
          target: 'label',
        })),
      });
    }

    // Check: aanwezigheid skip-link
    const allLinks = document.querySelectorAll('a');
    const firstLink = allLinks[0];
    const hasSkipLink = firstLink && (
      firstLink.href?.includes('#') &&
      (firstLink.textContent.toLowerCase().includes('sla') ||
       firstLink.textContent.toLowerCase().includes('skip') ||
       firstLink.textContent.toLowerCase().includes('ga naar'))
    );
    if (!hasSkipLink) {
      issues.push({
        id: 'missing-skip-link',
        impact: 'moderate',
        description: 'De pagina heeft geen "sla naar hoofdinhoud"-link als eerste element.',
        wcag: '2.4.1',
        level: 'A',
        title: '"Sla naar hoofdinhoud"-link ontbreekt',
        remediation: 'Voeg een skip-link toe als eerste focusbaar element: <a href="#main" class="skip-link">Sla naar hoofdinhoud</a>. Verberg hem visueel maar toon hem bij focus. Dit is verplicht voor toetsenbordgebruikers die herhaalde navigatie willen overslaan.',
        nodes: [],
      });
    }

    // Check: autocomplete op persoonlijke gegevens (WCAG 1.3.5)
    const personalFields = {
      'name': ['naam', 'name', 'voornaam', 'achternaam'],
      'email': ['email', 'e-mail', 'emailadres'],
      'tel': ['telefoon', 'phone', 'mobiel'],
      'postal-code': ['postcode'],
      'street-address': ['adres', 'straat'],
    };
    const inputs = Array.from(document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input:not([type])'));
    const missingAutocomplete = inputs.filter(input => {
      if (input.getAttribute('autocomplete')) return false;
      const label = document.querySelector(`label[for="${input.id}"]`);
      const labelText = (label?.textContent || input.getAttribute('placeholder') || '').toLowerCase();
      return Object.values(personalFields).flat().some(keyword => labelText.includes(keyword));
    });
    if (missingAutocomplete.length > 0) {
      issues.push({
        id: 'autocomplete-missing',
        impact: 'moderate',
        description: `${missingAutocomplete.length} invoerveld(en) voor persoonlijke gegevens mist het autocomplete-attribuut.`,
        wcag: '1.3.5',
        level: 'AA',
        title: 'Autocomplete ontbreekt op persoonlijke gegevensvelden',
        remediation: 'Voeg autocomplete toe aan formuliervelden voor persoonlijke gegevens: autocomplete="name", "email", "tel", "postal-code" etc. Dit helpt gebruikers met cognitieve beperkingen en motorische stoornissen formulieren sneller in te vullen.',
        nodes: missingAutocomplete.slice(0, 3).map(el => ({
          html: el.outerHTML.substring(0, 150),
          target: el.tagName.toLowerCase() + (el.id ? '#' + el.id : ''),
        })),
      });
    }

    // Check: tekst op afbeeldingen (eenvoudige detectie)
    const images = Array.from(document.querySelectorAll('img'));
    const imageFilenamesSuggestText = images.filter(img => {
      const src = img.getAttribute('src') || '';
      return /button|btn|banner|header|titel|text|tekst/i.test(src);
    });
    if (imageFilenamesSuggestText.length > 0) {
      issues.push({
        id: 'image-with-text',
        impact: 'minor',
        description: `${imageFilenamesSuggestText.length} afbeelding(en) lijkt tekst te bevatten op basis van de bestandsnaam.`,
        wcag: '1.4.5',
        level: 'AA',
        title: 'Mogelijk tekst in afbeeldingen',
        remediation: 'Vervang afbeeldingen met tekst door echte tekst met CSS-opmaak. Afbeeldingen met tekst schalen slecht en zijn moeilijk leesbaar bij grote tekstweergave. Uitzonderingen zijn logo\'s en essentiële visuele presentaties.',
        nodes: imageFilenamesSuggestText.slice(0, 3).map(el => ({
          html: el.outerHTML.substring(0, 150),
          target: 'img',
        })),
      });
    }

    return issues;
  });
}

async function scanUrl(url, options = {}) {
  const executablePath = findChromiumPath();
  const launchOptions = {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  };
  if (executablePath) launchOptions.executablePath = executablePath;

  const browser = await chromium.launch(launchOptions);

  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      userAgent: 'Mozilla/5.0 (compatible; ToegankelijkheidsTester/1.0; WCAG-Scanner)',
      ignoreHTTPSErrors: true,
    });
    const page = await context.newPage();

    const startTime = Date.now();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    const loadTime = Date.now() - startTime;

    // Haal paginainfo op
    const pageInfo = await page.evaluate(() => ({
      title: document.title,
      lang: document.documentElement.getAttribute('lang'),
      url: window.location.href,
      headings: Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map(h => ({
        level: parseInt(h.tagName[1]),
        text: h.textContent.trim().substring(0, 80),
      })),
      imageCount: document.querySelectorAll('img').length,
      linkCount: document.querySelectorAll('a[href]').length,
      formCount: document.querySelectorAll('form').length,
      inputCount: document.querySelectorAll('input, select, textarea').length,
    }));

    // Voer axe-core uit
    const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
    await page.addScriptTag({ content: axeSource });

    const axeResults = await page.evaluate(async () => {
      return new Promise((resolve) => {
        window.axe.run(document, {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
          },
        }, (err, results) => {
          resolve(err ? { violations: [], passes: [], incomplete: [] } : results);
        });
      });
    });

    // Voer eigen checks uit
    const customIssues = await runCustomChecks(page);

    // Combineer en verrijk resultaten
    const violations = axeResults.violations.map(v => {
      const remediation = WCAG_REMEDIATION[v.id] || {};
      return {
        id: v.id,
        impact: v.impact,
        title: remediation.title || v.help,
        description: v.description,
        wcag: remediation.wcag || (v.tags.find(t => /wcag\d+\d+/.test(t)) || '').replace('wcag', '').split('').join('.') || '',
        level: remediation.level || (v.tags.includes('wcag2aa') || v.tags.includes('wcag21aa') ? 'AA' : 'A'),
        wcagLink: `https://www.w3.org/WAI/WCAG21/Understanding/${v.helpUrl?.split('/').pop() || ''}`,
        helpUrl: v.helpUrl,
        remediation: remediation.remediation || v.help,
        nodes: v.nodes.slice(0, 5).map(n => ({
          html: n.html?.substring(0, 200) || '',
          target: Array.isArray(n.target) ? n.target.join(', ') : String(n.target || ''),
          failureSummary: n.failureSummary || '',
        })),
        count: v.nodes.length,
      };
    });

    // Voeg custom issues toe
    for (const issue of customIssues) {
      violations.push({
        id: issue.id,
        impact: issue.impact,
        title: issue.title,
        description: issue.description,
        wcag: issue.wcag,
        level: issue.level,
        wcagLink: '',
        helpUrl: '',
        remediation: issue.remediation,
        nodes: issue.nodes,
        count: issue.nodes.length || 1,
        custom: true,
      });
    }

    // Sorteer op ernst
    const impactOrder = { critical: 0, serious: 1, moderate: 2, minor: 3 };
    violations.sort((a, b) => (impactOrder[a.impact] ?? 9) - (impactOrder[b.impact] ?? 9));

    const passes = axeResults.passes?.length || 0;
    const incomplete = axeResults.incomplete?.length || 0;

    const score = calculateScore(violations);

    await browser.close();

    return {
      url: pageInfo.url,
      scannedAt: new Date().toISOString(),
      loadTime,
      pageInfo,
      score,
      summary: {
        critical: violations.filter(v => v.impact === 'critical').length,
        serious: violations.filter(v => v.impact === 'serious').length,
        moderate: violations.filter(v => v.impact === 'moderate').length,
        minor: violations.filter(v => v.impact === 'minor').length,
        total: violations.length,
        passes,
        incomplete,
      },
      violations,
    };
  } catch (err) {
    await browser.close();
    throw err;
  }
}

function calculateScore(violations) {
  const weights = { critical: 20, serious: 10, moderate: 5, minor: 2 };
  const deduction = violations.reduce((sum, v) => sum + (weights[v.impact] || 0), 0);
  return Math.max(0, 100 - deduction);
}

module.exports = { scanUrl };
