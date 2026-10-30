// Controlla che lo sprite resti alto come il 3D a ogni zoom (scala continua e a interi, per confronto). Uso: node _banco/zoom.mjs [personaggio]
import { launch, apri, OUT, LARGO } from './lib.mjs';
const browser = await launch();
for (const nitido of ['0', '1']) {
  const { page, errori, chiudi } = await apri(browser, `http://localhost:5173/_banco.html?test=1&net=0&slot=0&sprite=${process.argv[2] || 'protagonista'}&accanto=1&mossa=camminata&nitido=${nitido}`, { ...LARGO, deviceScaleFactor: 1 });
  try { await page.waitForFunction(() => window.__sp && window.__sp.info, null, { timeout: 180000 }); } catch (e) { console.log('NO SPRITE, errori:', errori.slice(0, 5)); process.exit(1); }
  for (const z of [0.6, 0.8, 1, 1.3, 1.7]) {
    await page.evaluate((z) => window.__game.test.setZoom(z), z);
    await page.waitForTimeout(1200);
    // altezza in pixel di schermo: testa-piedi proiettati
    const r = await page.evaluate(() => {
      const b = window.__banco, cam = b.camera, sp = window.__sp;
      const av = b.scene.children.find((c) => c.name === 'avatar');
      const prj = (x, y, z) => { const v = cam.position.clone(); v.set(x, y, z).project(cam); return (1 - v.y) / 2 * innerHeight; };
      const hAv = prj(av.position.x, av.position.y, av.position.z) - prj(av.position.x, av.position.y + sp.info.altezzaAvatar, av.position.z);
      const hSp = prj(sp.st.x, av.position.y, sp.st.z) - prj(sp.st.x, av.position.y + sp.info.altezzaSprite, sp.st.z);
      return { hAv: +hAv.toFixed(1), hSp: +hSp.toFixed(1), k: sp.info.k };
    });
    console.log('nitido', nitido, 'zoom', z, JSON.stringify(r), 'rapporto', (r.hSp / r.hAv).toFixed(2));
    if (nitido === '0' && (z === 0.8 || z === 1.7)) await page.screenshot({ path: `${OUT}/zoom_continuo_${z}.png` });
  }
  console.log('errori', errori.slice(0, 3));
  await chiudi();
}
await browser.close();
