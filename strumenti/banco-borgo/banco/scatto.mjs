// Banco usa-e-getta (non committare). Foto della capriola: node _banco/scatto.mjs <personaggio> [tel|largo]
// Per 4 direzioni (frecce) cammina un attimo, preme R e fotografa la capriola a intervalli; controlla che l'avatar vada avanti.
// Porta del gioco: PORTA=5195 node _banco/scatto.mjs … (di serie 5173).
import { launch, apri, OUT, IPHONE, LARGO } from './lib.mjs';
const [, , set = 'viandante', formato = 'tel'] = process.argv;
const vp = formato === 'largo' ? LARGO : IPHONE;
const porta = process.env.PORTA || '5173';
const browser = await launch();
const { page, errori, chiudi } = await apri(browser, `http://localhost:${porta}/_banco.html?test=1&net=0&slot=0&sprite=${set}&mossa=camminata`, vp);
await page.waitForFunction(() => window.__sp, null, { timeout: 180000 });
await page.waitForTimeout(800);
const qui = () => page.evaluate(() => {
  const b = window.__banco, cam = b.camera, sp = window.__sp, v = cam.position.clone();
  const av = b.scene.children.find((c) => c.name === 'avatar');
  v.set(sp.st.x, av.position.y + 0.7, sp.st.z).project(cam);
  const a = window.__game.state().avatar;
  return { px: [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight], frame: sp.info.frame, vista: sp.info.vista, specchio: sp.info.specchio, rotola: sp.info.rotola, x: a.x, z: a.z };
});
const risultati = [];
for (const tasto of ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft']) {
  await page.keyboard.down(tasto); await page.waitForTimeout(450); await page.keyboard.up(tasto);
  await page.waitForTimeout(500);
  const p0 = await qui();
  const W = formato === 'largo' ? 360 : 260, H = formato === 'largo' ? 300 : 240;
  const clip = { x: Math.max(0, Math.min(vp.width - W, Math.round(p0.px[0] - W / 2))), y: Math.max(0, Math.min(vp.height - H, Math.round(p0.px[1] - H / 2))), width: W, height: H };
  await page.keyboard.press('KeyR');
  const visti = [];
  for (let i = 0; i < 6; i++) {
    const p = await qui();
    if (!visti.includes(p.frame)) { visti.push(p.frame); await page.screenshot({ path: `${OUT}/scatto_${set}_${formato}_${tasto}_${visti.length}.png`, clip }); }
    await page.waitForTimeout(70);
  }
  await page.waitForTimeout(600);
  const p1 = await qui();
  risultati.push({ tasto, vista: p0.vista, specchio: p0.specchio, disegni: visti, metri: +Math.hypot(p1.x - p0.x, p1.z - p0.z).toFixed(2), finito: !p1.rotola, dopo: p1.frame });
}
// il bottone ROTOLA (telefono: un tocco)
await page.screenshot({ path: `${OUT}/scatto_${set}_${formato}_schermo.png` });
const b0 = await qui();
if (vp.hasTouch) await page.tap('#_banco_rotola'); else await page.click('#_banco_rotola');
await page.waitForTimeout(120);
const b1 = await qui();
await page.waitForTimeout(900);
const b2 = await qui();
risultati.push({ bottone: true, partito: b1.rotola, disegno: b1.frame, metri: +Math.hypot(b2.x - b0.x, b2.z - b0.z).toFixed(2) });
for (const r of risultati) console.log(JSON.stringify(r));
console.log('errori', errori.slice(0, 4));
await chiudi(); await browser.close();
