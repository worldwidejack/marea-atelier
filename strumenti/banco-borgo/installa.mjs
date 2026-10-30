// Installa il banco degli sprite in un checkout del gioco (worldwidejack/marea).
// Uso:  node strumenti/banco-borgo/installa.mjs <cartella-del-gioco> [personaggio ...]
//   senza personaggi: mette tutti quelli dell'Atelier che hanno sprite/elenco.json.
// Non tocca nessun file del gioco: aggiunge _banco/, apps/client/_banco.html (fatta da index.html),
// apps/client/src/_banco_sprite.ts e apps/client/public/_banco_sprite/<personaggio>/, e li esclude da git.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const QUI = path.dirname(fileURLToPath(import.meta.url));
const ATELIER = path.resolve(QUI, '..', '..');
const [, , gioco, ...scelti] = process.argv;
if (!gioco) { console.error('Uso: node strumenti/banco-borgo/installa.mjs <cartella-del-gioco> [personaggio ...]'); process.exit(1); }
const G = path.resolve(gioco);
const client = path.join(G, 'apps', 'client');
const indexHtml = path.join(client, 'index.html');
if (!fs.existsSync(indexHtml) || !fs.existsSync(path.join(G, 'tests', 'lib', 'browser.mjs'))) {
  console.error(`«${G}» non sembra un checkout di worldwidejack/marea (manca apps/client/index.html o tests/lib/browser.mjs).`);
  process.exit(1);
}

// 1. gli script del banco e il modulo che disegna lo sprite
fs.cpSync(path.join(QUI, 'banco'), path.join(G, '_banco'), { recursive: true });
fs.copyFileSync(path.join(QUI, '_banco_sprite.ts'), path.join(client, 'src', '_banco_sprite.ts'));

// 2. _banco.html = index.html del gioco + due blocchi (cattura di scena/camera in testa, caricamento dello sprite in coda)
const CATTURA = `<script>
/* BANCO SPRITE (usa-e-getta): three avvisa __THREE_DEVTOOLS__ a ogni Scene/Renderer: cosi' prendo scena e camera senza toccare il gioco */
(function () {
  var ev = new EventTarget();
  window.__banco = { scene: null, renderer: null, camera: null };
  ev.addEventListener('observe', function (e) {
    var o = e.detail;
    if (o && o.isScene && !window.__banco.scene) window.__banco.scene = o;
    if (o && o.isWebGLRenderer && !window.__banco.renderer) {
      window.__banco.renderer = o;
      var r = o.render.bind(o);
      o.render = function (s, c) { if (c && c.isPerspectiveCamera) window.__banco.camera = c; if (window.__banco.pre) window.__banco.pre(s, c); r(s, c); };
    }
  });
  window.__THREE_DEVTOOLS__ = ev;
})();
</script>
`;
const CARICA = `<script type="module">
/* carica lo sprite appena il gioco e' pronto: ?sprite=<personaggio> [&accanto=1 per vederlo vicino al 3D] [&scala=elenco] [&nitido=0] [&mossa=cammina|camminata|corsa] */
const q = new URLSearchParams(location.search);
const set = q.get('sprite');
if (set) {
  const attendi = setInterval(async () => {
    if (!(window.__game && window.__game.ready && window.__banco.scene && window.__banco.camera)) return;
    clearInterval(attendi);
    try {
      const m = await import('/src/_banco_sprite.ts');
      const accanto = q.get('accanto') === '1';
      window.__sp = await m.avvia({ set, dx: accanto ? -2.6 : 0, scala: q.get('scala') === 'elenco' ? 'elenco' : 'avatar', nascondi: !accanto, nitido: q.get('nitido') !== '0', mossa: q.get('mossa') || 'cammina' });
    } catch (e) { console.error('banco sprite', e); }
  }, 200);
}
</script>
`;
let html = fs.readFileSync(indexHtml, 'utf8');
const crlf = html.includes('\r\n');
html = html.replace(/\r\n/g, '\n');
if (!/<head>/.test(html) || !/<\/body>/.test(html)) { console.error('index.html non ha <head> e </body> come mi aspetto: il gioco è cambiato, aggiornare installa.mjs'); process.exit(1); }
html = html.replace('<head>\n', '<head>\n' + CATTURA).replace('</body>', CARICA + '</body>');
if (crlf) html = html.replace(/\n/g, '\r\n');
fs.writeFileSync(path.join(client, '_banco.html'), html);

// 3. gli sprite dell'Atelier, uno per cartella
const pers = path.join(ATELIER, 'personaggi');
const tutti = fs.readdirSync(pers).filter((id) => fs.existsSync(path.join(pers, id, 'sprite', 'elenco.json')));
const ids = scelti.length ? scelti : tutti;
const fatti = [];
for (const id of ids) {
  const da = path.join(pers, id, 'sprite');
  if (!fs.existsSync(path.join(da, 'elenco.json'))) { console.error(`«${id}» non ha sprite/elenco.json nell'Atelier: salto`); continue; }
  const a = path.join(client, 'public', '_banco_sprite', id);
  fs.rmSync(a, { recursive: true, force: true });
  fs.cpSync(da, a, { recursive: true });
  fatti.push(id);
}

// 4. fuori da git (anche nelle worktree: git sa dov'è il suo exclude)
try {
  const ex = path.resolve(G, execFileSync('git', ['-C', G, 'rev-parse', '--git-path', 'info/exclude'], { encoding: 'utf8' }).trim());
  const voci = ['/_banco/', '/apps/client/_banco.html', '/apps/client/src/_banco_sprite.ts', '/apps/client/public/_banco_sprite/'];
  const ora = fs.existsSync(ex) ? fs.readFileSync(ex, 'utf8') : '';
  const nuove = voci.filter((v) => !ora.split(/\r?\n/).includes(v));
  if (nuove.length) fs.appendFileSync(ex, (ora && !ora.endsWith('\n') ? '\n' : '') + nuove.join('\n') + '\n');
} catch (e) { console.error('non riesco a escludere i file da git (a mano: _banco/, _banco.html, _banco_sprite.ts, public/_banco_sprite/):', e.message); }

console.log(`Banco installato in ${G}\nPersonaggi: ${fatti.join(', ') || '(nessuno)'}`);
console.log(`\nPagina giocabile (dopo "npm run dev" nel gioco):\n  http://localhost:5173/_banco.html?test=1&net=0&slot=0&sprite=${fatti[0] || '<personaggio>'}\nFoto automatiche:\n  node _banco/scena.mjs ${fatti[0] || '<personaggio>'} tel accanto elenco   (dentro ${G})`);
