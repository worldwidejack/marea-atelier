// Banco usa-e-getta (non committare, installa.mjs lo esclude da git): apre il Borgo vero e prende scena + renderer + camera di three.js dall'esterno
// (three avvisa __THREE_DEVTOOLS__ a ogni Scene/Renderer creato), senza toccare il codice del gioco.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
// il banco vive in <marea>/_banco/ (lo mette lì installa.mjs): WT = la cartella del gioco
export const WT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..').split(path.sep).join('/');
export const OUT = WT + '/tests/out/banco-sprite';
fs.mkdirSync(OUT, { recursive: true });
const B = await import(pathToFileURL(WT + '/tests/lib/browser.mjs').href);
export const { launch, waitReady, waitState, IPHONE } = B;
export const LARGO = { width: 1280, height: 720, deviceScaleFactor: 2, isMobile: false, hasTouch: false };

const CATTURA = () => {
  const ev = new EventTarget();
  window.__banco = { scene: null, renderer: null, camera: null };
  ev.addEventListener('observe', (e) => {
    const o = e.detail;
    if (o && o.isScene && !window.__banco.scene) window.__banco.scene = o;
    if (o && o.isWebGLRenderer && !window.__banco.renderer) {
      window.__banco.renderer = o;
      const r = o.render.bind(o);
      o.render = (s, c) => { if (c && c.isCamera) { window.__banco.camera = c; window.__banco.sceneRender = s; } window.__banco.pre?.(s, c); r(s, c); };
    }
  });
  window.__THREE_DEVTOOLS__ = ev;
};

export async function apri(browser, url, viewport = IPHONE) {
  const ctx = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: viewport.deviceScaleFactor, isMobile: viewport.isMobile, hasTouch: viewport.hasTouch });
  const page = await ctx.newPage();
  const errori = [];
  page.on('pageerror', (e) => errori.push(String(e && (e.stack || e.message) || e)));
  page.on('console', (m) => { if (m.type() === 'error') errori.push('console: ' + m.text()); });
  await page.addInitScript(CATTURA);
  await page.goto(url, { waitUntil: 'load' });
  await waitReady(page, 120000);
  return { page, errori, chiudi: () => ctx.close() };
}
