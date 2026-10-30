import { launch, OUT, IPHONE, LARGO } from './lib.mjs';
import { pathToFileURL } from 'node:url';
import { WT } from './lib.mjs';
const B = await import(pathToFileURL(WT + '/tests/lib/browser.mjs').href);
const browser = await launch();
for (const [nome, vp] of [['largo', { ...LARGO, deviceScaleFactor: 1 }], ['tel', IPHONE]]) {
  for (const nitido of ['0', '1']) {
    const { page, errors, close } = await B.openPage(browser, `http://localhost:5173/_banco.html?test=1&net=0&slot=0&sprite=${process.argv[2] || 'f3-prova'}&nitido=${nitido}`, { viewport: vp });
    await B.waitReady(page, 120000);
    await page.waitForTimeout(3500);
    const p = await page.evaluate(() => { const b = window.__banco, cam = b.camera, sp = window.__sp; const v = sp.st; const o = cam.position.clone(); o.set(v.x, 0.4 + 1.0, v.z).project(cam); return { x: (o.x + 1) / 2 * innerWidth, y: (1 - o.y) / 2 * innerHeight, info: sp.info }; });
    const w = 160, h = 180;
    const clip = { x: Math.max(0, Math.round(p.x - w / 2)), y: Math.max(0, Math.round(p.y - h / 2)), width: w, height: h };
    await page.screenshot({ path: `${OUT}/_nit_${nome}_${nitido}.png`, clip });
    console.log(nome, 'nitido', nitido, JSON.stringify({ k: p.info.k, pxGiocoPerUnita: p.info.pxGiocoPerUnita, altoPxGioco: p.info.altoPxGioco, h: +p.info.altezzaSprite.toFixed(2) }), errors.slice(0, 2));
    await close();
  }
}
await browser.close();
