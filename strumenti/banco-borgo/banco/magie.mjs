// Banco usa-e-getta (non committare). Le tre magie dello sprite nel dungeon: node _banco/magie.mjs <personaggio> [tel|largo]
// Entra nel dungeon col bottone «Dungeon delle armi», per ogni magia (Missile, Flusso, Bomba) tiene premuto A (clic sul canvas; sul telefono il
// joystick di mira) in tre direzioni (destra, giù, su), poi rilascia, e registra i disegni visti in ordine con il tempo di ciascuno
// (un registratore dentro la pagina, a ogni fotogramma: i disegni del lancio durano 70-150 ms, a schermate non li prenderesti).
// Fotografa la posa di mira e quella del raggio acceso. Dice anche gli errori. Porta: PORTA=5195 (di serie 5173).
import { launch, apri, OUT, IPHONE, LARGO } from './lib.mjs';
const [, , set = 'viandante', formato = 'largo'] = process.argv;
const vp = formato === 'largo' ? LARGO : IPHONE;
const porta = process.env.PORTA || '5173';
const browser = await launch();
const { page, errori, chiudi } = await apri(browser, `http://localhost:${porta}/_banco.html?test=1&net=0&slot=0&sprite=${set}&mossa=camminata`, vp);
await page.waitForFunction(() => window.__sp, null, { timeout: 180000 });
await page.waitForTimeout(600);
if (vp.hasTouch) await page.tap('#_banco_dungeon'); else await page.click('#_banco_dungeon');
await page.waitForFunction(() => window.__game.state().dungeon?.phase === 'play' && window.__sp.info.dungeon, null, { timeout: 120000 });
await page.waitForTimeout(1500);
// registratore: [ms, disegno, anim, magia] a ogni cambio di disegno
await page.evaluate(() => {
  window.__rec = []; let ult = '';
  const giro = () => { const i = window.__sp?.info; if (i && i.frame !== ult) { ult = i.frame; window.__rec.push([Math.round(performance.now()), i.frame, i.anim, i.magia]); } requestAnimationFrame(giro); };
  requestAnimationFrame(giro);
});
const qui = () => page.evaluate(() => {
  const sp = window.__sp, cam = window.__banco.camera, p = sp.st;
  const v = cam.position.clone().set(p.x, 0.9, p.z).project(cam);
  return { px: [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight], frame: sp.info.frame, anim: sp.info.anim, magia: sp.info.magia, vista: sp.info.vista };
});
const W = formato === 'largo' ? 420 : 300, H = formato === 'largo' ? 340 : 280;
const clipDi = (p) => ({ x: Math.max(0, Math.min(vp.width - W, Math.round(p.px[0] - W / 2))), y: Math.max(0, Math.min(vp.height - H, Math.round(p.px[1] - H / 2))), width: W, height: H });
const DIR = { destra: [1, 0], giu: [0, 1], su: [0.5, -1] }; // su: un po' a destra, per non cliccare sui bottoni del banco (al centro, in alto)
const risultati = [];
for (const [magia, nome, tieni] of [['missile', 'Missile', 700], ['flusso', 'Flusso', 1300], ['bomba', 'Bomba', 700]]) {
  const el = page.locator('#_banco_magie div', { hasText: nome });
  if (vp.hasTouch) await el.tap(); else await el.click();
  await page.waitForFunction((m) => window.__game.state().dungeon?.phase === 'play' && window.__sp.info.magia === m, magia, { timeout: 120000 });
  await page.waitForTimeout(1500);
  const p0 = await qui();
  await page.screenshot({ path: `${OUT}/magie_${set}_${formato}_${magia}_fermo.png`, clip: clipDi(p0) });
  for (const [dirNome, [dx, dy]] of Object.entries(DIR)) {
    await page.evaluate(() => { window.__rec.length = 0; });
    const t0 = await page.evaluate(() => Math.round(performance.now()));
    if (vp.hasTouch) {
      const b = await page.locator('#mzDngMira').boundingBox();
      const t = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [t] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: t.x + dx * 34, y: t.y + dy * 34 }] });
      await page.waitForTimeout(tieni / 2);
      await page.screenshot({ path: `${OUT}/magie_${set}_${formato}_${magia}_${dirNome}_tieni.png`, clip: clipDi(p0) });
      await page.waitForTimeout(tieni / 2);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      await page.mouse.move(vp.width / 2 + dx * 220, Math.max(30, vp.height / 2 + dy * (dy < 0 ? 320 : 160)));
      await page.mouse.down();
      await page.waitForTimeout(tieni / 2);
      await page.screenshot({ path: `${OUT}/magie_${set}_${formato}_${magia}_${dirNome}_tieni.png`, clip: clipDi(p0) });
      await page.waitForTimeout(tieni / 2);
      await page.mouse.up();
    }
    await page.waitForTimeout(900);
    const rec = await page.evaluate(() => window.__rec.slice());
    risultati.push({ magia, dir: dirNome, vista: (await qui()).vista, passi: rec.map(([t, f, a]) => `${f.replace(/^[A-Z]+_/, '')} ${a} @${t - t0}ms`) });
    await page.waitForTimeout(1200); // il riposo della magia
  }
}
await page.screenshot({ path: `${OUT}/magie_${set}_${formato}_schermo.png` });
for (const r of risultati) console.log(r.magia, r.dir, 'vista', r.vista, '\n   ', r.passi.join('\n    '));
console.log('errori:', errori.length ? errori : 'nessuno');
console.log('foto in', OUT);
await chiudi(); await browser.close();
