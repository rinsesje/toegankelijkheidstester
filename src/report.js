'use strict';

const { writeFileSync } = require('fs');
const path = require('path');

const IMPACT_LABELS = {
  critical: { nl: 'Kritiek', color: '#c0392b', bg: '#fdf0ef', badge: '#e74c3c' },
  serious: { nl: 'Ernstig', color: '#e67e22', bg: '#fef9ef', badge: '#f39c12' },
  moderate: { nl: 'Matig', color: '#2980b9', bg: '#eef6fb', badge: '#3498db' },
  minor: { nl: 'Klein', color: '#27ae60', bg: '#eefaf3', badge: '#2ecc71' },
};

function impactIcon(impact) {
  const icons = { critical: '🔴', serious: '🟠', moderate: '🔵', minor: '🟢' };
  return icons[impact] || '⚪';
}

function scoreColor(score) {
  if (score >= 80) return '#27ae60';
  if (score >= 60) return '#f39c12';
  return '#e74c3c';
}

function scoreLabel(score) {
  if (score >= 90) return 'Uitstekend';
  if (score >= 80) return 'Goed';
  if (score >= 60) return 'Matig';
  if (score >= 40) return 'Slecht';
  return 'Kritiek';
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function generateHtml(result) {
  const { url, scannedAt, loadTime, pageInfo, score, summary, violations } = result;
  const scanDate = new Date(scannedAt).toLocaleString('nl-NL', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const violationCards = violations.map((v, i) => {
    const impact = IMPACT_LABELS[v.impact] || { nl: v.impact, color: '#666', bg: '#f5f5f5', badge: '#999' };
    const nodeItems = v.nodes.map(n => `
      <div class="node-item">
        <div class="node-target">${escapeHtml(n.target)}</div>
        <pre class="node-html">${escapeHtml(n.html)}</pre>
        ${n.failureSummary ? `<div class="failure-summary">${escapeHtml(n.failureSummary)}</div>` : ''}
      </div>`).join('');

    const wcagBadge = v.wcag ? `<span class="badge badge-wcag">WCAG ${v.wcag}</span>` : '';
    const levelBadge = v.level ? `<span class="badge badge-level badge-${v.level.toLowerCase()}">${v.level}</span>` : '';

    return `
    <div class="violation-card" id="v${i}">
      <div class="violation-header" style="background:${impact.bg}; border-left: 5px solid ${impact.badge};">
        <div class="violation-title-row">
          <span class="impact-badge" style="background:${impact.badge}">${impact.nl}</span>
          ${wcagBadge}
          ${levelBadge}
          ${v.custom ? '<span class="badge badge-custom">Aanvullende check</span>' : ''}
          <h3 class="violation-title">${escapeHtml(v.title)}</h3>
        </div>
        <div class="violation-meta">
          <span class="occurrence-count">${v.count} voorkomens</span>
          ${v.helpUrl ? `<a href="${escapeHtml(v.helpUrl)}" target="_blank" rel="noopener" class="more-info-link">Meer informatie ↗</a>` : ''}
        </div>
      </div>
      <div class="violation-body">
        <div class="section">
          <h4>Beschrijving</h4>
          <p>${escapeHtml(v.description)}</p>
        </div>
        <div class="section remediation-section">
          <h4>💡 Hoe op te lossen</h4>
          <p>${escapeHtml(v.remediation)}</p>
        </div>
        ${v.nodes.length > 0 ? `
        <div class="section">
          <h4>Gevonden elementen (max. 5 getoond)</h4>
          <div class="nodes-list">${nodeItems}</div>
        </div>` : ''}
      </div>
    </div>`;
  }).join('');

  const headingList = pageInfo.headings.map(h =>
    `<li class="heading-item heading-h${h.level}"><span class="heading-level">H${h.level}</span> ${escapeHtml(h.text)}</li>`
  ).join('');

  const criticalCount = summary.critical;
  const seriousCount = summary.serious;
  const moderateCount = summary.moderate;
  const minorCount = summary.minor;

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Toegankelijkheidsrapport – ${escapeHtml(pageInfo.title || url)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #f4f6f9;
      color: #2c3e50;
      line-height: 1.6;
    }
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }

    /* Header */
    .page-header {
      background: linear-gradient(135deg, #154273 0%, #1e6bb8 100%);
      color: white;
      padding: 2rem 2rem 3rem;
    }
    .header-inner { max-width: 1200px; margin: 0 auto; }
    .logo-row { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
    .logo { width: 48px; height: 48px; background: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
    .brand { font-size: 0.875rem; opacity: 0.8; }
    .brand strong { display: block; font-size: 1rem; opacity: 1; }
    h1 { font-size: 1.75rem; font-weight: 700; margin-bottom: 0.5rem; }
    .scan-url { font-size: 0.95rem; opacity: 0.85; word-break: break-all; }
    .scan-meta { font-size: 0.8rem; opacity: 0.7; margin-top: 0.5rem; }

    /* Score card */
    .score-banner {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      margin: -1.5rem auto 2rem;
      max-width: 1200px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 2rem;
      align-items: center;
    }
    .score-circle {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      border: 8px solid;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .score-number { font-size: 2.5rem; font-weight: 800; line-height: 1; }
    .score-label-text { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }
    .summary-card {
      text-align: center;
      padding: 1rem;
      border-radius: 8px;
    }
    .summary-card .count { font-size: 2rem; font-weight: 700; }
    .summary-card .label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
    .summary-card.critical { background: #fdf0ef; color: #c0392b; }
    .summary-card.serious { background: #fef9ef; color: #e67e22; }
    .summary-card.moderate { background: #eef6fb; color: #2980b9; }
    .summary-card.minor { background: #eefaf3; color: #27ae60; }
    .wcag-note {
      background: #eaf2ff;
      border: 1px solid #b8d4f5;
      border-radius: 8px;
      padding: 1rem;
      font-size: 0.875rem;
      color: #154273;
    }
    .wcag-note strong { display: block; margin-bottom: 0.25rem; }

    /* Main layout */
    .main-content { max-width: 1200px; margin: 0 auto; padding: 0 2rem 4rem; }
    .two-col { display: grid; grid-template-columns: 1fr 280px; gap: 2rem; align-items: start; }
    .violations-section h2, .sidebar h2 { font-size: 1.25rem; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid #e0e0e0; }

    /* Filter bar */
    .filter-bar { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .filter-btn {
      padding: 0.4rem 1rem;
      border: 2px solid transparent;
      border-radius: 20px;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 600;
      transition: all 0.2s;
      background: white;
    }
    .filter-btn:hover, .filter-btn.active { border-color: currentColor; }
    .filter-btn.all { color: #2c3e50; }
    .filter-btn.critical { color: #c0392b; }
    .filter-btn.serious { color: #e67e22; }
    .filter-btn.moderate { color: #2980b9; }
    .filter-btn.minor { color: #27ae60; }
    .filter-btn.active.all { background: #2c3e50; color: white; }
    .filter-btn.active.critical { background: #c0392b; color: white; }
    .filter-btn.active.serious { background: #e67e22; color: white; }
    .filter-btn.active.moderate { background: #2980b9; color: white; }
    .filter-btn.active.minor { background: #27ae60; color: white; }

    /* Violation cards */
    .violation-card {
      background: white;
      border-radius: 10px;
      margin-bottom: 1.25rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.07);
      overflow: hidden;
    }
    .violation-header { padding: 1rem 1.25rem; cursor: pointer; }
    .violation-title-row { display: flex; align-items: flex-start; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.5rem; }
    .violation-title { font-size: 1rem; font-weight: 600; color: #2c3e50; flex: 1; min-width: 200px; }
    .violation-meta { display: flex; align-items: center; gap: 1rem; font-size: 0.8rem; color: #666; }
    .occurrence-count { background: #f0f0f0; padding: 0.15rem 0.5rem; border-radius: 10px; }
    .more-info-link { color: #1e6bb8; text-decoration: none; }
    .more-info-link:hover { text-decoration: underline; }

    .violation-body { padding: 1.25rem; border-top: 1px solid #f0f0f0; display: none; }
    .violation-card.open .violation-body { display: block; }
    .violation-header::after { content: '▼'; float: right; font-size: 0.75rem; margin-top: 0.25rem; transition: transform 0.2s; }
    .violation-card.open .violation-header::after { transform: rotate(180deg); }

    .section { margin-bottom: 1.25rem; }
    .section h4 { font-size: 0.875rem; font-weight: 700; color: #555; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
    .section p { font-size: 0.9rem; color: #444; }
    .remediation-section { background: #f8fffe; border: 1px solid #d4edda; border-radius: 8px; padding: 1rem; }
    .remediation-section h4 { color: #155724; }
    .remediation-section p { color: #155724; }

    .nodes-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .node-item { background: #f8f9fa; border-radius: 6px; padding: 0.75rem; border: 1px solid #e9ecef; }
    .node-target { font-size: 0.8rem; font-weight: 600; color: #666; margin-bottom: 0.25rem; }
    .node-html { font-size: 0.8rem; font-family: 'Courier New', monospace; background: #fff; padding: 0.5rem; border-radius: 4px; border: 1px solid #ddd; overflow-x: auto; white-space: pre-wrap; word-break: break-all; color: #c0392b; }
    .failure-summary { font-size: 0.8rem; color: #666; margin-top: 0.5rem; font-style: italic; }

    /* Badges */
    .badge {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      white-space: nowrap;
    }
    .impact-badge { color: white; }
    .badge-wcag { background: #dde7f7; color: #154273; }
    .badge-level.badge-a { background: #e8f5e9; color: #2e7d32; }
    .badge-level.badge-aa { background: #fff3e0; color: #e65100; }
    .badge-custom { background: #f3e5f5; color: #6a1b9a; }

    /* Sidebar */
    .sidebar { position: sticky; top: 2rem; }
    .sidebar-card { background: white; border-radius: 10px; padding: 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,0.07); margin-bottom: 1.5rem; }
    .sidebar-card h2 { font-size: 1rem; }
    .page-stat { display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid #f0f0f0; font-size: 0.875rem; }
    .page-stat:last-child { border-bottom: none; }
    .page-stat .val { font-weight: 600; }
    .heading-list { list-style: none; margin-top: 0.5rem; }
    .heading-item { padding: 0.25rem 0; font-size: 0.8rem; color: #444; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .heading-h1 { padding-left: 0; font-weight: 700; color: #2c3e50; }
    .heading-h2 { padding-left: 1rem; }
    .heading-h3 { padding-left: 2rem; }
    .heading-h4 { padding-left: 3rem; }
    .heading-level { display: inline-block; font-size: 0.65rem; font-weight: 700; background: #dde7f7; color: #154273; border-radius: 3px; padding: 0.1rem 0.3rem; margin-right: 0.25rem; min-width: 24px; text-align: center; }
    .no-issues { text-align: center; padding: 3rem 2rem; color: #27ae60; }
    .no-issues .icon { font-size: 3rem; display: block; margin-bottom: 0.5rem; }

    /* Responsive */
    @media (max-width: 900px) {
      .two-col { grid-template-columns: 1fr; }
      .sidebar { position: static; }
      .score-banner { grid-template-columns: 1fr; }
      .summary-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media print {
      .violation-body { display: block !important; }
      .filter-bar { display: none; }
    }
  </style>
</head>
<body>
<header class="page-header" role="banner">
  <div class="header-inner">
    <div class="logo-row">
      <div class="logo" aria-hidden="true">♿</div>
      <div class="brand">
        <strong>Toegankelijkheidstester</strong>
        WCAG 2.1 AA · EN 301 549 · Besluit digitale toegankelijkheid overheid
      </div>
    </div>
    <h1>Toegankelijkheidsrapport</h1>
    <p class="scan-url">📄 <a href="${escapeHtml(url)}" style="color:rgba(255,255,255,0.9)">${escapeHtml(url)}</a></p>
    <p class="scan-meta">Gescand op ${scanDate} · Laadtijd: ${(loadTime / 1000).toFixed(1)}s</p>
  </div>
</header>

<div class="score-banner" role="region" aria-label="Scoreoverzicht">
  <div class="score-circle" style="border-color:${scoreColor(score)}; color:${scoreColor(score)}">
    <span class="score-number">${score}</span>
    <span class="score-label-text">${scoreLabel(score)}</span>
  </div>
  <div>
    <div class="summary-grid">
      <div class="summary-card critical">
        <div class="count">${criticalCount}</div>
        <div class="label">Kritiek</div>
      </div>
      <div class="summary-card serious">
        <div class="count">${seriousCount}</div>
        <div class="label">Ernstig</div>
      </div>
      <div class="summary-card moderate">
        <div class="count">${moderateCount}</div>
        <div class="label">Matig</div>
      </div>
      <div class="summary-card minor">
        <div class="count">${minorCount}</div>
        <div class="label">Klein</div>
      </div>
    </div>
  </div>
  <div class="wcag-note">
    <strong>📋 Wettelijk kader</strong>
    Dit rapport toetst op WCAG 2.1 niveau AA, zoals vereist door het
    <em>Besluit digitale toegankelijkheid overheid</em> en de
    Europese norm EN 301 549. Overheidswebsites zijn verplicht te voldoen
    aan alle A- en AA-criteria.
  </div>
</div>

<main class="main-content" id="main">
  <div class="two-col">
    <section class="violations-section" aria-label="Gevonden problemen">
      <h2>Gevonden problemen (${summary.total})</h2>

      <div class="filter-bar" role="group" aria-label="Filter op ernst">
        <button class="filter-btn all active" onclick="filterViolations('all')">Alle (${summary.total})</button>
        ${criticalCount > 0 ? `<button class="filter-btn critical" onclick="filterViolations('critical')">Kritiek (${criticalCount})</button>` : ''}
        ${seriousCount > 0 ? `<button class="filter-btn serious" onclick="filterViolations('serious')">Ernstig (${seriousCount})</button>` : ''}
        ${moderateCount > 0 ? `<button class="filter-btn moderate" onclick="filterViolations('moderate')">Matig (${moderateCount})</button>` : ''}
        ${minorCount > 0 ? `<button class="filter-btn minor" onclick="filterViolations('minor')">Klein (${minorCount})</button>` : ''}
      </div>

      ${violations.length === 0 ? `
      <div class="no-issues" role="status">
        <span class="icon" aria-hidden="true">✅</span>
        <strong>Geen problemen gevonden!</strong>
        <p>De gescande pagina voldoet aan alle gecontroleerde WCAG 2.1 AA criteria.</p>
      </div>` : violationCards}
    </section>

    <aside class="sidebar" aria-label="Pagina-informatie">
      <div class="sidebar-card">
        <h2>Pagina-informatie</h2>
        <dl>
          <div class="page-stat"><dt>Titel</dt><dd class="val">${escapeHtml((pageInfo.title || '—').substring(0, 40))}</dd></div>
          <div class="page-stat"><dt>Taal</dt><dd class="val">${escapeHtml(pageInfo.lang || '— (ontbreekt!)')}</dd></div>
          <div class="page-stat"><dt>Afbeeldingen</dt><dd class="val">${pageInfo.imageCount}</dd></div>
          <div class="page-stat"><dt>Links</dt><dd class="val">${pageInfo.linkCount}</dd></div>
          <div class="page-stat"><dt>Formulieren</dt><dd class="val">${pageInfo.formCount}</dd></div>
          <div class="page-stat"><dt>Invoervelden</dt><dd class="val">${pageInfo.inputCount}</dd></div>
          <div class="page-stat"><dt>Geslaagde checks</dt><dd class="val" style="color:#27ae60">${summary.passes}</dd></div>
          <div class="page-stat"><dt>Handm. controle</dt><dd class="val" style="color:#e67e22">${summary.incomplete}</dd></div>
        </dl>
      </div>

      ${pageInfo.headings.length > 0 ? `
      <div class="sidebar-card">
        <h2>Koppenstructuur</h2>
        <ul class="heading-list" aria-label="Paginakoppen">
          ${headingList}
        </ul>
      </div>` : ''}

      <div class="sidebar-card">
        <h2>Handmatig te controleren</h2>
        <p style="font-size:0.8rem;color:#666;margin-bottom:0.75rem">
          Automatische tools detecteren ~30-40% van WCAG-problemen. Controleer ook handmatig:
        </p>
        <ul style="font-size:0.8rem;color:#444;padding-left:1.25rem;line-height:1.8">
          <li>Toetsenbordnavigatie (Tab, Enter, Escape, pijltoetsen)</li>
          <li>Schermlezer (NVDA, JAWS, VoiceOver)</li>
          <li>Zoomfunctie tot 200% zonder horizontaal scrollen</li>
          <li>Kleurenblindheid (gebruik b.v. Colour Contrast Analyser)</li>
          <li>Tijdslimieten en bewegende content</li>
          <li>Foutmeldingen en formuliervalidatie</li>
          <li>PDF-documenten apart testen</li>
        </ul>
      </div>
    </aside>
  </div>
</main>

<footer style="background:#2c3e50;color:#aaa;text-align:center;padding:1.5rem;font-size:0.8rem;">
  <p>Rapport gegenereerd door Toegankelijkheidstester · WCAG 2.1 AA · axe-core ${getAxeVersion()}</p>
  <p style="margin-top:0.25rem">Dit rapport is een geautomatiseerde indicatie. Een volledige audit vereist ook handmatige toetsing.</p>
</footer>

<script>
  // Toggle kaarten
  document.querySelectorAll('.violation-header').forEach(header => {
    header.addEventListener('click', () => {
      header.closest('.violation-card').classList.toggle('open');
    });
    header.setAttribute('tabindex', '0');
    header.setAttribute('role', 'button');
    header.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); header.click(); }
    });
  });

  // Open kritieke en ernstige kaarten standaard
  document.querySelectorAll('.violation-card').forEach(card => {
    const badge = card.querySelector('.impact-badge');
    if (badge && (badge.textContent === 'Kritiek' || badge.textContent === 'Ernstig')) {
      card.classList.add('open');
    }
  });

  // Filter
  function filterViolations(impact) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.filter-btn.' + impact)?.classList.add('active');
    document.querySelectorAll('.violation-card').forEach(card => {
      if (impact === 'all') { card.style.display = ''; return; }
      const badge = card.querySelector('.impact-badge');
      const impactMap = { critical: 'Kritiek', serious: 'Ernstig', moderate: 'Matig', minor: 'Klein' };
      card.style.display = (badge?.textContent === impactMap[impact]) ? '' : 'none';
    });
  }
</script>
</body>
</html>`;
}

function getAxeVersion() {
  try {
    return require('axe-core/package.json').version;
  } catch { return '?'; }
}

function saveReport(result, outputPath) {
  const html = generateHtml(result);
  writeFileSync(outputPath, html, 'utf8');
  return outputPath;
}

module.exports = { saveReport, generateHtml };
