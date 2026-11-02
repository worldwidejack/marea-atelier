// Banco usa-e-getta (non committare). Le armi a strati nel dungeon: node _banco/armi.mjs <personaggio> [tel|largo]
// Entra nel dungeon di prova col bottone «Dungeon delle armi», per ogni arma (Leggera, Pesante, Arco) cammina un attimo, poi colpisce
// (arco: tende e tira) e fotografa ogni disegno nuovo. Dice i disegni visti in ordine e gli errori. Porta: PORTA=5195 (di serie 5173).
import { launch, apri, OUT, IPHONE, LARGO } from './lib.mjs';
const [, , set = 'viandante', formato = 'largo'] = process.argv;
const vp = formato === 'largo' ? LARGO : IPHONE;
const porta = process.env.PORTA || '5173';
const browser = await launch();
const { page, errori, chiudi } = await apri(browser, `http://localhost:${porta}/_banco.html?test=1&net=0&slot=0&sprite=${set}&mossa=camminata`, vp);
await page.waitForFunction(() => window.__sp, null, { timeout: 180000 });
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/armi_${set}_${formato}_borgo.png` });
if (vp.hasTouch) await page.tap('#_banco_dungeon'); else await page.click('#_banco_dungeon');
await page.waitForFunction(() => window.__game.state().dungeon?.phase === 'play' && window.__sp.info.dungeon, null, { timeout: 120000 });
await page.waitForTimeout(1500);
const qui = () => page.evaluate(() => {
  const sp = window.__sp, b = window.__banco, cam = b.camera, p = sp.st;
  const v = cam.position.clone().set(p.x, 0.9, p.z).project(cam);
  return { px: [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight], frame: sp.info.frame, anim: sp.info.anim, arma: sp.info.arma, vista: sp.info.vista };
});
const W = formato === 'largo' ? 420 : 300, H = formato === 'largo' ? 340 : 280;
const clipDi = (p) => ({ x: Math.max(0, Math.min(vp.width - W, Math.round(p.px[0] - W / 2))), y: Math.max(0, Math.min(vp.height - H, Math.round(p.px[1] - H / 2))), width: W, height: H });
const risultati = [];
for (const [arma, nome] of [['leggera', 'Leggera'], ['pesante', 'Pesante'], ['arco', 'Arco']]) {
  const el = page.locator('#_banco_armi div', { hasText: nome });
  if (vp.hasTouch) await el.tap(); else await el.click();
  // cambiare arma = risalire e riscendere con l'arma nuova in mano
  await page.waitForFunction((a) => window.__game.state().dungeon?.phase === 'play' && window.__sp.info.arma === a, arma, { timeout: 120000 });
  await page.waitForTimeout(1500);
  // cammina verso destra: frecce (finestra larga) o il joystick col dito (telefono: la tastiera spegnerebbe i bottoni)
  const dito = vp.hasTouch ? await page.context().newCDPSession(page) : null;
  if (dito) { await dito.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 72, y: 750 }] }); await dito.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 122, y: 750 }] }); } else await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(500);
  const passi = [];
  for (let i = 0; i < 8; i++) { const p = await qui(); if (!passi.includes(p.frame)) passi.push(p.frame); await page.waitForTimeout(60); }
  if (dito) await dito.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); else await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(400);
  const p0 = await qui();
  await page.screenshot({ path: `${OUT}/armi_${set}_${formato}_${arma}_fermo.png`, clip: clipDi(p0) });
  // il colpo: A (mouse o bottone A); l'arco si tiene premuto per tendere
  const visti = [];
  const guarda = async (n) => { for (let i = 0; i < n; i++) { const p = await qui(); if (p.frame !== visti.at(-1)?.frame) { visti.push({ frame: p.frame, anim: p.anim }); await page.screenshot({ path: `${OUT}/armi_${set}_${formato}_${arma}_${visti.length}.png`, clip: clipDi(p0) }); } await page.waitForTimeout(25); } };
  const tieni = arma === 'arco' ? 900 : 60;
  if (vp.hasTouch) {
    const quale = arma === 'arco' ? '#mzDngMira' : '#btnA'; // con l'arco in mano A diventa lo stick di mira (tieni = tendi)
    await page.locator(quale).waitFor({ state: 'visible' });
    const b = await page.locator(quale).boundingBox();
    const cdp = await page.context().newCDPSession(page);
    const t = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [t] });
    if (arma === 'arco') await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: t.x - 30, y: t.y }] }); // lo stick di mira: tira il pomello per tendere
    await guarda(Math.round(tieni / 40));
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else {
    await page.mouse.move(vp.width / 2 + 200, vp.height / 2); await page.mouse.down(); await guarda(Math.round(tieni / 40)); await page.mouse.up();
  }
  await guarda(40);
  risultati.push({ arma: p0.arma, vista: p0.vista, fermo: p0.frame, passi, colpo: visti.map((v) => `${v.frame} (${v.anim})`) });
}
await page.screenshot({ path: `${OUT}/armi_${set}_${formato}_schermo.png` });
console.log(JSON.stringify(risultati, null, 1));
console.log('errori:', errori.length ? errori : 'nessuno');
console.log('foto in', OUT);
await chiudi(); await browser.close();
