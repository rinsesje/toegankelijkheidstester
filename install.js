#!/usr/bin/env node
'use strict';

const { execSync } = require('child_process');

console.log('♿  Toegankelijkheidstester – Installatie\n');

console.log('📦 npm-pakketten installeren...');
execSync('npm install', { stdio: 'inherit' });

console.log('\n🌐 Chromium browser downloaden voor Playwright...');
try {
  execSync('npx playwright install chromium', { stdio: 'inherit' });
  console.log('\n✅ Klaar! Je kunt de scanner nu gebruiken:\n');
} catch (err) {
  console.log('\n⚠️  Kon Chromium niet automatisch installeren.');
  console.log('   Installeer handmatig: npx playwright install chromium');
  console.log('   Of stel CHROMIUM_PATH in als je al Chrome/Chromium hebt:\n');
  console.log('   export CHROMIUM_PATH=/usr/bin/chromium-browser\n');
}

console.log('   node src/cli.js --url https://www.rijksoverheid.nl\n');
