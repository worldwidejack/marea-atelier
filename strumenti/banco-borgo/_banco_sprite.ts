// BANCO USA-E-GETTA (non committare, non fa parte del gioco): uno sprite 2.5D (look 3) dentro il Borgo vero, accanto all'avatar 3D.
// Si carica da Playwright con import('/src/_banco_sprite.ts'); scena e camera arrivano da window.__banco (_banco/lib.mjs).
// Legge sprite/elenco.json di pixel.py: <vista>_<mossa>_<n> con w,h,ax,ay (ancora = i piedi), s = pixel per unità di mondo.
import * as THREE from 'three';

type Voce = { w: number; h: number; ax: number; ay: number; s: number };
type Cfg = { set: string; dx?: number; dz?: number; scala?: 'elenco' | 'avatar'; fps?: number; segui?: boolean; x?: number; z?: number; facing?: number; nascondi?: boolean; nitido?: boolean; mossa?: string };
const VISTE = ['S', 'SSE', 'SE', 'ESE', 'E', 'ENE', 'NE', 'NNE', 'N']; // 0°, 22.5° … 180° dalla camera (davanti → dietro passando da destra)

export async function avvia(cfg: Cfg) {
  const B = (window as unknown as { __banco: { scene: THREE.Scene; camera: THREE.PerspectiveCamera; pre?: (s: THREE.Scene, c: THREE.Camera) => void } }).__banco;
  const G = (window as unknown as { __game: { state: () => { avatar: { x: number; z: number; yaw: number; vx: number; vz: number } } } }).__game;
  const base = `/_banco_sprite/${cfg.set}/`;
  const elenco: Record<string, Voce> = await (await fetch(base + 'elenco.json')).json();
  const chiavi = Object.keys(elenco);
  const viste = VISTE.filter((v) => chiavi.some((k) => k.startsWith(v + '_')));
  const tex = new Map<string, THREE.Texture>();
  await Promise.all(chiavi.map(async (k) => {
    const img = new Image(); img.src = base + k + '.png'; await img.decode();
    const t = new THREE.Texture(img);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true;
    tex.set(k, t);
  }));

  // altezza dell'avatar 3D, per confronto di scala
  const avObj = B.scene.children.find((c) => c.name === 'avatar')!;
  const box = new THREE.Box3().setFromObject(avObj);
  const altezzaAvatar = box.max.y - box.min.y;

  const mat = new THREE.MeshBasicMaterial({ transparent: false, alphaTest: 0.5, side: THREE.DoubleSide, toneMapped: false });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  quad.name = '_banco_sprite';
  quad.frustumCulled = false;
  const pivot = new THREE.Group(); pivot.name = '_banco_sprite_pivot';
  pivot.add(quad);
  // ombra tonda sotto i piedi: disco piatto a spigoli (12 lati), scuro e semitrasparente, senza scrivere la profondità
  const ombra = new THREE.Mesh(new THREE.CircleGeometry(0.62, 12), new THREE.MeshBasicMaterial({ color: 0x1a1030, transparent: true, opacity: 0.38, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  ombra.rotation.x = -Math.PI / 2; ombra.name = '_banco_sprite_ombra';
  B.scene.add(pivot, ombra);

  const st = { x: cfg.x ?? 0, z: cfg.z ?? 0, facing: cfg.facing ?? 0, mossa: cfg.mossa ?? 'cammina', muove: false, mezzo: 0, t: 0, dist: 0 };
  const av0 = G.state().avatar;
  const dx = cfg.dx ?? -2.6, dz = cfg.dz ?? 0; // scostamento in «schermo»: dx negativo = a sinistra dell'avatar (asse destra della camera)
  let avPrec = { x: av0.x, z: av0.z };
  let ultimoPoll = -1e9, av = av0;
  const fps = cfg.fps ?? 10;
  const info: Record<string, unknown> & { altezzaAvatar: number; altezzaSprite: number; vista: string; specchio: boolean; frame: string } = { vista: '', specchio: false, frame: '', altezzaAvatar, altezzaSprite: 0, viste, set: cfg.set };
  const sz = new THREE.Vector2(), vtmp = new THREE.Vector3();
  let ultimo = performance.now();

  function aggiorna(cam: THREE.Camera) {
    if (!(cam as THREE.PerspectiveCamera).isPerspectiveCamera) return;
    if (cfg.nascondi) avObj.visible = false; // lo sprite prende il posto del 3D (il gioco puo' riaccenderlo: lo spengo a ogni fotogramma)
    const now = performance.now(); const dt = Math.min(0.1, (now - ultimo) / 1000); ultimo = now;
    if (now - ultimoPoll > 90) { av = G.state().avatar; ultimoPoll = now; }
    // camera: direzione dal personaggio alla camera sul piano
    const cp = cam.position;
    // posizione: segue l'avatar con uno scostamento sull'asse destra della camera (e uno avanti/indietro)
    const fx = avObj.position.x, fz = avObj.position.z;
    let tcx = cp.x - fx, tcz = cp.z - fz; const L = Math.hypot(tcx, tcz) || 1; tcx /= L; tcz /= L;
    const rx = tcz, rz = -tcx; // destra schermo = (−f.z, f.x) con f = −toCam
    // (f = (-tcx,-tcz) → (−f.z, f.x) = (tcz, −tcx))
    if (cfg.segui !== false) { st.x = fx + rx * dx - tcx * dz; st.z = fz + rz * dx - tcz * dz; }
    // movimento e direzione: quella dell'avatar (avanti = (sin yaw, −cos yaw))
    const v = Math.hypot(av.vx, av.vz);
    st.muove = v > 0.2;
    if (cfg.segui !== false) st.facing = Math.atan2(Math.sin(av.yaw), -Math.cos(av.yaw)); // angolo di «avanti» sul piano
    const vx = Math.sin(av.yaw), vz = -Math.cos(av.yaw);
    // angolo fra il davanti del personaggio e la direzione verso la camera: 0 = guarda la camera, + = verso destra schermo
    const ang = Math.atan2(vx * rx + vz * rz, vx * tcx + vz * tcz) * 180 / Math.PI;
    const a = Math.abs(ang);
    // la vista disegnata più vicina fra quelle che ci sono (a scatti di 22,5°)
    let best = viste[0]!, bd = 1e9;
    for (const vi of viste) { const d = Math.abs(VISTE.indexOf(vi) * 22.5 - a); if (d < bd) { bd = d; best = vi; } }
    const specchio = ang < -1e-6 && best !== 'S' && best !== 'N';
    st.t += dt;
    let nf = 0; while (elenco[`${best}_${st.mossa}_${nf + 1}`]) nf++; // i disegni che ci sono: 4 (cammina) o 8 (camminata, corsa)
    const n = st.muove ? 1 + (Math.floor(st.t * fps) % Math.max(1, nf)) : (nf === 4 ? 2 : 1); // da fermo: il disegno 2 della camminata a 4 (gambe unite), il 1 delle altre
    const chiave = `${best}_${st.mossa}_${n}`;
    const e = elenco[chiave]; if (!e) return;
    mat.map = tex.get(chiave)!; mat.needsUpdate = false;
    // il quad guarda la camera (billboard sferico: i pixel restano quadrati sullo schermo), perno ai piedi
    cam.updateMatrixWorld();
    pivot.position.set(st.x, avObj.position.y, st.z);
    pivot.quaternion.copy(cam.quaternion);
    // NITIDO: il gioco disegna a mezza risoluzione (1 pixel di gioco = 2 del tuo schermo). Uno sprite alto come il 3D occupa meno pixel
    // di gioco di quanti ne ha (48), e con la texture «nearest» il campionamento ne salta qualcuno: pixel di larghezza diversa, immagine sgranata.
    // Qui 1 pixel dello sprite = k pixel di gioco, k intero (almeno 1), e i piedi stanno sulla griglia dei pixel.
    const rend = B.renderer, pr = rend.getPixelRatio(); rend.getSize(sz);
    const RW = sz.x * pr, RH = sz.y * pr;
    vtmp.copy(pivot.position).applyMatrix4(cam.matrixWorldInverse);
    const ppu = RH / (2 * Math.tan((cam as THREE.PerspectiveCamera).fov * Math.PI / 360) * -vtmp.z); // pixel di gioco per unità di mondo, a quella distanza
    const voluto = cfg.scala === 'avatar' ? altezzaAvatar / 50 : 1 / e.s; // unità di mondo per pixel dello sprite, come lo si vorrebbe
    const k = cfg.nitido === false ? 0 : Math.max(1, Math.round(voluto * ppu));
    const u = k ? k / ppu : voluto;
    const W = e.w * u, H = e.h * u;
    const sx = specchio ? -1 : 1;
    // ancora ai piedi: il quad ha il centro a (w/2 − ax, h/2 − ay) dall'ancora
    quad.scale.set(sx * W, H, 1);
    quad.position.set(sx * (e.w / 2 - e.ax - 0.5) * u, (e.ay - e.h / 2) * u, 0);
    if (k) {
      vtmp.copy(pivot.position).project(cam);
      let xa = (vtmp.x + 1) / 2 * RW, ya = (1 - vtmp.y) / 2 * RH;
      const xl = xa + sx * (e.w / 2 - e.ax - 0.5) * k - e.w * k / 2; // bordo sinistro del quad, in pixel di gioco
      const yb = ya + (e.h - e.ay) * k; // bordo basso
      xa += Math.round(xl) - xl; ya += Math.round(yb) - yb;
      vtmp.set(xa / RW * 2 - 1, 1 - ya / RH * 2, vtmp.z).unproject(cam);
      pivot.position.copy(vtmp);
    }
    ombra.position.set(st.x, avObj.position.y + 0.03, st.z);
    info.vista = best; info.specchio = specchio; info.frame = chiave; info.altezzaSprite = e.h * u; info.k = k; info.pxGiocoPerUnita = +ppu.toFixed(2); info.altoPxGioco = e.h * k;
    void box; void avPrec; avPrec = { x: av.x, z: av.z };
  }
  B.pre = (_s, c) => aggiorna(c);
  return {
    info, st, elenco, rimuovi() { B.pre = undefined; B.scene.remove(pivot, ombra); },
    metti(p: { x?: number; z?: number; facing?: number; mossa?: string; segui?: boolean }) { if (p.x !== undefined) st.x = p.x; if (p.z !== undefined) st.z = p.z; if (p.facing !== undefined) st.facing = p.facing; if (p.mossa) st.mossa = p.mossa; if (p.segui !== undefined) cfg.segui = p.segui; },
  };
}
