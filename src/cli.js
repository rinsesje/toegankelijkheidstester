#!/usr/bin/env node
'use strict';

const { program } = require('commander');
const path = require('path');
const { scanUrl } = require('./scanner');
const { saveReport } = require('./report');

program
  .name('toegankelijkheidstester')
  .description('WCAG 2.1 AA toegankelijkheidsscanner voor overheidswebsites (EN 301 549)')
  .version('1.0.0')
  .requiredOption('-u, --url <url>', 'Te scannen URL (bijv. https://rijksoverheid.nl)')
  .option('-o, --output <pad>', 'Pad voor het HTML-rapport', 'rapport.html')
  .option('--json', 'Sla ook een JSON-rapport op naast het HTML-rapport')
  .parse(process.argv);

const opts = program.opts();

async function main() {
  const url = opts.url.startsWith('http') ? opts.url : `https://${opts.url}`;

  console.log(`\n♿  Toegankelijkheidstester – WCAG 2.1 AA Scanner`);
  console.log(`${'─'.repeat(55)}`);
  console.log(`🌐 URL:     ${url}`);
  console.log(`📄 Rapport: ${opts.output}`);
  console.log(`${'─'.repeat(55)}\n`);
  console.log('⏳ Pagina laden en scannen...');

  let result;
  try {
    result = await scanUrl(url);
  } catch (err) {
    console.error(`\n❌ Scan mislukt: ${err.message}`);
    process.exit(1);
  }

  const outputPath = path.resolve(opts.output);
  saveReport(result, outputPath);

  if (opts.json) {
    const jsonPath = outputPath.replace(/\.html?$/, '.json');
    require('fs').writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf8');
    console.log(`📦 JSON opgeslagen: ${jsonPath}`);
  }

  const { summary, score } = result;

  console.log(`\n✅ Scan voltooid!\n`);
  console.log(`📊 Score: ${score}/100`);
  console.log(`${'─'.repeat(40)}`);
  console.log(`🔴 Kritiek:  ${summary.critical}`);
  console.log(`🟠 Ernstig:  ${summary.serious}`);
  console.log(`🔵 Matig:    ${summary.moderate}`);
  console.log(`🟢 Klein:    ${summary.minor}`);
  console.log(`─────────────────────────────`);
  console.log(`   Totaal:   ${summary.total} problemen`);
  console.log(`   Geslaagd: ${summary.passes} checks`);
  console.log(`${'─'.repeat(40)}\n`);
  console.log(`📄 Rapport opgeslagen: ${outputPath}\n`);

  if (summary.critical > 0 || summary.serious > 0) {
    console.log(`⚠️  Er zijn kritieke of ernstige toegankelijkheidsproblemen gevonden.`);
    console.log(`   Overheidswebsites zijn wettelijk verplicht (Wet digitale overheid)`);
    console.log(`   te voldoen aan WCAG 2.1 niveau AA.\n`);
  }
}

main();
