// Regenerates the CV PDFs in /assets from the data below.
// Usage: serve the repo root on :8814 (npx http-server -p 8814), then:
//   NODE_PATH=$(npm root -g) node tools/make_cv.js
// Requires playwright installed globally.
const { chromium } = require('playwright');

const DATA = {
  en: {
    title: 'SPS Programmer & Software Developer',
    summary: 'SPS Programmer and Software Developer with over 10 years of experience in industrial automation, machine control, and SCADA systems. Specializing in Siemens TIA Portal and WinCC.',
    sections: { exp: 'Experience', edu: 'Education', skills: 'Skills & Tools', langs: 'Languages', contact: 'Contact' },
    present: 'Present',
    jobs: [
      { date: '09.2022 – Present', co: 'Metzner Maschinenbau GmbH', loc: 'Neu-Ulm, Germany', role: 'SPS Programmer / Software Developer',
        pts: ['Machine control software development in Siemens SPS', 'HMI design and operator interface creation', 'Parameterization of stepper and servo motors', 'Independent project execution in-house and with customers and suppliers', 'In-house and on-site commissioning at customer locations', 'International customer support', 'Support in selection and sizing of components (motor controllers, PLCs, sensors)'] },
      { date: '09.2019 – 09.2022', co: 'Rothenbacher GmbH', loc: 'Dornstadt, Germany', role: 'SPS Programmer / Software Developer',
        pts: ['Design, development and optimization of control and regulation programs', 'SCADA visualization and process monitoring', 'Standardized and modular software development', 'Independent fault analysis and troubleshooting', 'Customer consulting and further development of existing systems'] },
      { date: '09.2014 – 08.2019', co: 'Technosam SRL', loc: 'Satu Mare, Romania', role: 'SPS Programmer / Software Developer',
        pts: ['Development, optimization and modification of control programs with full project lifecycle management', 'On-site commissioning, installation, and maintenance of industrial systems', 'Fault diagnosis, maintenance and troubleshooting of control systems and components', 'Coordination with external contractors and customer consulting'] },
    ],
    edu: { date: '10.2010 – 06.2014', school: 'Sapientia University', loc: 'Târgu Mureș, Romania', deg: 'Bachelor of Engineering — Automation and Applied Informatics' },
    skillLevels: { core: 'Core', mid: 'Intermediate' },
    langs: [['Hungarian', 'Native'], ['English', 'C1 · Proficient'], ['German', 'B2 · Independent'], ['Romanian', 'B2 · Independent']],
    locLine: 'Neu-Ulm, Germany', locLbl: 'Location', emailLbl: 'Email',
    file: '/home/user/lbideas.de/assets/Lehel-Balog-CV-EN.pdf',
  },
  de: {
    title: 'SPS-Programmierer & Software-Entwickler',
    summary: 'SPS-Programmierer und Software-Entwickler mit über 10 Jahren Erfahrung in industrieller Automation, Maschinensteuerung und SCADA-Systemen. Spezialisiert auf Siemens TIA Portal und WinCC.',
    sections: { exp: 'Berufserfahrung', edu: 'Ausbildung', skills: 'Fähigkeiten & Tools', langs: 'Sprachen', contact: 'Kontakt' },
    present: 'Heute',
    jobs: [
      { date: '09.2022 – Heute', co: 'Metzner Maschinenbau GmbH', loc: 'Neu-Ulm, Deutschland', role: 'SPS-Programmierer / SW-Entwickler',
        pts: ['Entwicklung und Programmerstellung für Maschinensteuerung in Siemens SPS', 'Gestaltung der Bedienoberflächen', 'Parametrisierung von Schritt- und Servomotoren', 'Selbständige Projektabwicklung innerhalb des Hauses sowie mit Kunden und Lieferanten', 'Inbetriebnahmen im Haus und bei Kunden', 'Internationale Kundenbetreuung', 'Unterstützung bei Auswahl und Auslegung von Einzelkomponenten'] },
      { date: '09.2019 – 09.2022', co: 'Rothenbacher GmbH', loc: 'Dornstadt, Deutschland', role: 'SPS-Programmierer / SW-Entwickler',
        pts: ['Konzeption, Entwicklung und Optimierung von Regel- und Steuerprogrammen', 'Visualisierung von Abläufen (SCADA)', 'Standardisierte und modularisierte Softwareentwicklung', 'Eigenständige Fehleranalyse und Fehlerbehebung', 'Kundenberatung und Weiterentwicklung bestehender Systeme'] },
      { date: '09.2014 – 08.2019', co: 'Technosam SRL', loc: 'Satu-Mare, Rumänien', role: 'SPS-Programmierer / SW-Entwickler',
        pts: ['Entwicklung, Optimierung und Änderung von Steuerprogrammen mit vollständigem Projektmanagement', 'Inbetriebnahme, Instandsetzung und Wartung von Anlagen vor Ort', 'Fehlerdiagnose, Wartung und Störungsanalyse/-behebung an Steuerungen und Komponenten', 'Zusammenarbeit mit externen Firmen und Kundenberatung'] },
    ],
    edu: { date: '10.2010 – 06.2014', school: 'Sapientia University', loc: 'Târgu Mureș, Rumänien', deg: 'Bachelordiplom in Automation und Angewandter Informatik' },
    skillLevels: { core: 'Kern', mid: 'Mittel' },
    langs: [['Ungarisch', 'Muttersprache'], ['Englisch', 'C1 · Kompetent'], ['Deutsch', 'B2 · Selbstständig'], ['Rumänisch', 'B2 · Selbstständig']],
    locLine: 'Neu-Ulm, Deutschland', locLbl: 'Standort', emailLbl: 'E-Mail',
    file: '/home/user/lbideas.de/assets/Lehel-Balog-Lebenslauf-DE.pdf',
  },
};

const SKILLS = [
  ['Siemens TIA Portal', 'core'], ['WinCC Flexible / SCADA', 'core'],
  ['FUP / KOP / AWL / SCL', 'core'], ['S7-PLCSIM Advanced', 'core'],
  ['SQL', 'mid'], ['Java', 'mid'], ['C#', 'mid'], ['Python', 'mid'],
];

function html(d) {
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="http://127.0.0.1:8814/assets/fonts/fonts.css">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  :root { --steel:#7e8d95; --ink:#0d1418; --ink2:#3d4c55; --line:#c8d2d8; }
  body { font-family:'Barlow Condensed', sans-serif; color:var(--ink); font-size:10.5pt; }
  .page { padding:0; }
  header { background:#1e2c33; color:#dfe7eb; padding:26pt 34pt 22pt; }
  .name { font-size:27pt; font-weight:800; text-transform:uppercase; letter-spacing:0.02em; line-height:1; }
  .role { font-family:'IBM Plex Mono', monospace; font-size:9pt; letter-spacing:0.14em; text-transform:uppercase; color:#9fb3bd; margin-top:6pt; }
  .cols { display:grid; grid-template-columns:2.05fr 1fr; gap:0; }
  main { padding:20pt 24pt 20pt 34pt; }
  aside { padding:20pt 34pt 20pt 20pt; border-left:1.5pt solid var(--line); }
  h2 { font-family:'IBM Plex Mono', monospace; font-size:8.5pt; font-weight:700; letter-spacing:0.16em; text-transform:uppercase; color:var(--ink2); border-bottom:2pt solid #1e2c33; padding-bottom:3pt; margin:14pt 0 8pt; }
  main h2:first-child, aside h2:first-child { margin-top:0; }
  .summary { font-size:11pt; line-height:1.45; color:var(--ink2); }
  .job { margin-bottom:11pt; }
  .job-head { display:flex; justify-content:space-between; align-items:baseline; }
  .co { font-size:12.5pt; font-weight:700; }
  .date { font-family:'IBM Plex Mono', monospace; font-size:7.5pt; color:var(--ink2); white-space:nowrap; }
  .meta { font-family:'IBM Plex Mono', monospace; font-size:7.5pt; color:var(--ink2); margin:1pt 0 4pt; }
  ul { list-style:none; }
  li { font-size:10pt; line-height:1.4; padding-left:9pt; position:relative; margin-bottom:1.5pt; }
  li::before { content:'—'; position:absolute; left:0; color:var(--steel); }
  .edu-deg { font-size:10.5pt; margin-top:2pt; }
  .kv { display:flex; justify-content:space-between; font-size:9.5pt; margin-bottom:4pt; gap:6pt; }
  .kv b { font-weight:600; }
  .kv span { font-family:'IBM Plex Mono', monospace; font-size:7pt; color:var(--ink2); text-transform:uppercase; letter-spacing:0.08em; text-align:right; padding-top:1.5pt; }
  .contact-item { font-size:9.5pt; margin-bottom:4pt; line-height:1.3; }
  .contact-item .lbl { font-family:'IBM Plex Mono', monospace; font-size:6.5pt; text-transform:uppercase; letter-spacing:0.1em; color:var(--ink2); display:block; }
  a { color:var(--ink); text-decoration:none; }
</style></head><body>
<div class="page">
  <header>
    <div class="name">Lehel Balog</div>
    <div class="role">${d.title}</div>
  </header>
  <div class="cols">
    <main>
      <p class="summary">${d.summary}</p>
      <h2>${d.sections.exp}</h2>
      ${d.jobs.map(j => `
      <div class="job">
        <div class="job-head"><span class="co">${j.co}</span><span class="date">${j.date}</span></div>
        <div class="meta">${j.role} · ${j.loc}</div>
        <ul>${j.pts.map(p => `<li>${p}</li>`).join('')}</ul>
      </div>`).join('')}
      <h2>${d.sections.edu}</h2>
      <div class="job">
        <div class="job-head"><span class="co">${d.edu.school}</span><span class="date">${d.edu.date}</span></div>
        <div class="meta">${d.edu.loc}</div>
        <div class="edu-deg">${d.edu.deg}</div>
      </div>
    </main>
    <aside>
      <h2>${d.sections.contact}</h2>
      <div class="contact-item"><span class="lbl">${d.emailLbl}</span>baloglehel91@gmail.com</div>
      <div class="contact-item"><span class="lbl">${d.locLbl}</span>${d.locLine}</div>
      <div class="contact-item"><span class="lbl">Web</span>lbideas.de</div>
      <div class="contact-item"><span class="lbl">LinkedIn</span>linkedin.com/in/lehel-balog-75b9b2129</div>
      <div class="contact-item"><span class="lbl">GitHub</span>github.com/Lehel4321</div>
      <h2>${d.sections.skills}</h2>
      ${SKILLS.map(([s, lvl]) => `<div class="kv"><b>${s}</b><span>${d.skillLevels[lvl]}</span></div>`).join('')}
      <h2>${d.sections.langs}</h2>
      ${d.langs.map(([l, lvl]) => `<div class="kv"><b>${l}</b><span>${lvl}</span></div>`).join('')}
    </aside>
  </div>
</div>
</body></html>`;
}

(async () => {
  const browser = await chromium.launch();
  for (const lang of ['en', 'de']) {
    const d = DATA[lang];
    const page = await browser.newPage();
    const fs = require('fs');
    const tmp = `/home/user/lbideas.de/.cv-tmp-${lang}.html`;
    fs.writeFileSync(tmp, html(d));
    await page.goto(`http://127.0.0.1:8814/.cv-tmp-${lang}.html`, { waitUntil: 'networkidle' });
    const fontsOk = await page.evaluate(async () => {
      await document.fonts.ready;
      return document.fonts.check("800 20px 'Barlow Condensed'") && document.fonts.check("700 20px 'IBM Plex Mono'");
    });
    if (!fontsOk) throw new Error('webfonts did not load for ' + lang);
    fs.unlinkSync(tmp);
    await page.pdf({ path: d.file, format: 'A4', printBackground: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } });
    await page.close();
    console.log('wrote', d.file);
  }
  await browser.close();
})();
