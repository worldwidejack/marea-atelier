// Banco usa-e-getta (non committare). Uso: node _banco/scena.mjs <set> <tel|largo> <accanto|furetto|giro> [zoom]
// <set> = cartella in apps/client/public/_banco_sprite/ (f3 = gli sprite di Jack, riccardo = quelli di pixel.py dal foglio di Riccardo)
import fs from 'node:fs';
import { launch, apri, OUT, IPHONE, LARGO } from './lib.mjs';
const [, , set = 'f3', formato = 'tel', scenario = 'accanto', scala = 'elenco', zoomArg] = process.argv;
const vp = formato === 'largo' ? LARGO : IPHONE;
const browser = await launch();
const { page, errori, chiudi } = await apri(browser, 'http://localhost:5173/?test=1&net=0&slot=0', vp);
await page.waitForTimeout(2500);
const zoom = zoomArg ? Number(zoomArg) : null;
if (zoom) await page.evaluate((z) => window.__game.test.setZoom(z), zoom);

const perf0 = await page.evaluate(() => window.__game.perf());
const t0 = Date.now();
const carico = await page.evaluate(async ([s, sc]) => {
  const t = performance.now();
  const m = await import('/src/_banco_sprite.ts');
  window.__sp = await m.avvia({ set: s, dx: -2.6, scala: sc });
  return { ms: Math.round(performance.now() - t), viste: window.__sp.info.viste, righe: Object.keys(window.__sp.elenco).length };
}, [set, scala]);
console.log('caricamento sprite', JSON.stringify(carico));
await page.waitForTimeout(1500);
const perf1 = await page.evaluate(() => window.__game.perf());
console.log('perf prima', JSON.stringify(perf0), 'dopo', JSON.stringify(perf1));

async function posizioni() {
  return page.evaluate(() => {
    const b = window.__banco, cam = b.camera, sp = window.__sp;
    const prj = (x, y, z) => { const v = cam.position.clone(); v.set(x, y, z).project(cam); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; };
    const av = b.scene.children.find((c) => c.name === 'avatar');
    const y0 = av.position.y;
    const a = prj(av.position.x, y0 + 1.2, av.position.z), s = prj(sp.st.x, y0 + 1.2, sp.st.z);
    return { avatar: a, sprite: s, info: { ...sp.info }, stato: window.__game.state().avatar };
  });
}
async function foto(nome, extra = {}) {
  const p = await posizioni();
  const cx = (p.avatar[0] + p.sprite[0]) / 2, cy = (p.avatar[1] + p.sprite[1]) / 2;
  const w = extra.w ?? (formato === 'largo' ? 420 : 300), h = extra.h ?? (formato === 'largo' ? 280 : 330);
  const clip = { x: Math.max(0, Math.round(cx - w / 2)), y: Math.max(0, Math.round(cy - h / 2)), width: w, height: h };
  clip.x = Math.min(clip.x, vp.width - w); clip.y = Math.min(clip.y, vp.height - h);
  const f = `${OUT}/banco_${set}_${scala}_${formato}_${nome}.png`;
  await page.screenshot({ path: f, clip });
  const intero = `${OUT}/banco_${set}_${scala}_${formato}_${nome}_intero.png`;
  if (extra.intero) await page.screenshot({ path: intero });
  console.log(nome, JSON.stringify({ vista: p.info.vista, specchio: p.info.specchio, frame: p.info.frame, h_sprite: +p.info.altezzaSprite.toFixed(2), h_avatar: +p.info.altezzaAvatar.toFixed(2) }));
  return f;
}

if (scenario === 'furetto') {
  const np = await page.evaluate(() => { let r = null; window.__banco.scene.traverse((o) => { if (o.name === 'npc_furetto_rig') { const v = o.position.clone(); o.getWorldPosition(v); r = [v.x, v.z]; } }); return r; });
  console.log('furetto', np);
  if (np) await page.evaluate(([x, z]) => window.__game.test.teleport(x + 3.2, z + 1.5), np);
  await page.waitForTimeout(1500);
}
if (scenario === 'giro') {
  // la camera gira attorno ai due fermi: gli stessi angoli di vista che si avrebbero girando il personaggio
  const base = await page.evaluate(() => window.__game.test.camYaw());
  for (let i = 0; i < 8; i++) {
    await page.evaluate(([b, k]) => window.__game.test.camYaw(b + k * Math.PI / 4), [base, i]);
    await page.waitForTimeout(900);
    await foto('giro_' + String(i * 45).padStart(3, '0'), { w: 240, h: 260 });
  }
} else {
  await page.waitForTimeout(1500);
  await foto(`${scenario}_fermi`, { intero: true });
  // camminano insieme (tasto freccia: l'avatar 3D e lo sprite che lo segue)
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(600);
  await foto(`${scenario}_cammina_a`);
  await page.waitForTimeout(110);
  await foto(`${scenario}_cammina_b`);
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(500);
  console.log('tempo totale s', ((Date.now() - t0) / 1000).toFixed(1));
}
console.log('errori', errori.slice(0, 4));
await chiudi(); await browser.close();
