// BANCO USA-E-GETTA (non committare, non fa parte del gioco): uno sprite 2.5D (look 3) dentro il Borgo vero, accanto all'avatar 3D.
// Si carica da Playwright con import('/src/_banco_sprite.ts'); scena e camera arrivano da window.__banco (_banco/lib.mjs).
// Legge sprite/elenco.json di pixel.py: <vista>_<mossa>_<n> con w,h,ax,ay (ancora = i piedi), s = pixel per unità di mondo.
import * as THREE from 'three';
import { armaDi, creaBottoni, creaColpo, eroe, MOSSE, tingi } from './_banco_armi.ts';
import type { Arma } from './_banco_armi.ts';
import { ascoltaA, creaLancio, INCANTO, magiaDi } from './_banco_magie.ts';
import { creaFulmine } from './_banco_fulmine.ts';
import { creaHd, texturaHd } from './_banco_hd.ts';
import type { Magia } from './_banco_magie.ts';

type Voce = { w: number; h: number; ax: number; ay: number; s: number };
type Cfg = { set: string; dx?: number; dz?: number; scala?: 'elenco' | 'avatar'; fps?: number; segui?: boolean; x?: number; z?: number; facing?: number; nascondi?: boolean; nitido?: boolean; hd?: boolean; mossa?: string; lento?: number; distanza?: boolean };
const VISTE = ['S', 'SSE', 'SE', 'ESE', 'E', 'ENE', 'NE', 'NNE', 'N']; // 0°, 22.5° … 180° dalla camera (davanti → dietro passando da destra)

export async function avvia(cfg: Cfg) {
  const B = (window as unknown as { __banco: { scene: THREE.Scene; camera: THREE.PerspectiveCamera; renderer: THREE.WebGLRenderer; pre?: (s: THREE.Scene, c: THREE.Camera) => void } }).__banco;
  const G = (window as unknown as { __game: { state: () => { avatar: { x: number; z: number; yaw: number; vx: number; vz: number } }; test: { teleport?: (x: number, z: number) => void } } }).__game;
  const base = `/_banco_sprite/${cfg.set}/`;
  const elenco: Record<string, Voce> = await (await fetch(base + 'elenco.json')).json();
  const chiavi = Object.keys(elenco);
  const viste = VISTE.filter((v) => chiavi.some((k) => k.startsWith(v + '_')));
  // HD (di serie, &hd=0 lo spegne): lo sprite si disegna a risoluzione piena sopra il mondo a mezza risoluzione (_banco_hd.ts), con la scala continua
  const hdVoluto = cfg.hd ?? (new URLSearchParams(location.search).get('hd') !== '0' && !cfg.nitido);
  const tex = new Map<string, THREE.Texture>(), sorgenti = new Map<string, HTMLImageElement | HTMLCanvasElement>();
  await Promise.all(chiavi.map(async (k) => {
    const img = new Image(); img.src = base + k + '.png'; await img.decode();
    const sorg = tingi(img, k.split('_')[1]!); sorgenti.set(k, sorg); // il ciano delle armi a strati diventa un segnaposto
    if (hdVoluto) { tex.set(k, texturaHd(sorg)); return; }
    const t = new THREE.Texture(sorg);
    t.magFilter = THREE.NearestFilter; t.minFilter = cfg.nitido ? THREE.NearestFilter : THREE.LinearMipmapLinearFilter; t.generateMipmaps = !cfg.nitido; t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; // a scala continua i pixel si rimpiccioliscono: il mipmap li sfuma invece di saltarli
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
  const hd = hdVoluto ? creaHd(B.renderer, quad, () => B.scene) : null;

  const st = { x: cfg.x ?? 0, z: cfg.z ?? 0, facing: cfg.facing ?? 0, mossa: cfg.mossa ?? 'cammina', muove: false, mezzo: 0, t: 0, dist: 0 };
  // PASSO: quanti pixel d'arte è lungo un passo disegnato, dal disegno di contatto di profilo (E_<mossa>_1): la larghezza dei piedi
  // nelle 3 righe più basse meno un piede (quella del disegno di passaggio, gambe unite). Coi disegni legati alla distanza i piedi non scivolano.
  const passoPx = new Map<string, number>();
  function larghezzaPiedi(k: string) {
    const t = sorgenti.get(k), e = elenco[k]; if (!t || !e) return 0;
    const c = document.createElement('canvas'); c.width = e.w; c.height = e.h;
    const g = c.getContext('2d')!; g.drawImage(t, 0, 0);
    const d = g.getImageData(0, 0, e.w, e.h).data; let x0 = e.w, x1 = -1;
    for (let y = Math.max(0, e.ay - 3); y < Math.min(e.h, e.ay); y++) for (let x = 0; x < e.w; x++) if (d[(y * e.w + x) * 4 + 3]! > 0) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
    return x1 >= x0 ? x1 - x0 + 1 : 0;
  }
  for (const m of new Set(chiavi.map((k) => k.split('_')[1]!))) {
    const nf = chiavi.filter((k) => k.startsWith(`E_${m}_`)).length;
    let largo = larghezzaPiedi(`E_${m}_1`), unito = larghezzaPiedi(`E_${m}_${nf === 8 ? 3 : 2}`);
    // cicli d'altro numero (i 6 di PixelLab cominciano a gambe unite): il disegno più largo meno il più stretto
    if (nf !== 4 && nf !== 8 && nf > 1) {
      const l = Array.from({ length: nf }, (_, i) => larghezzaPiedi(`E_${m}_${i + 1}`)).filter((x) => x > 0);
      if (l.length) { largo = Math.max(...l); unito = Math.min(...l); }
    }
    // le mosse con l'arma in mano (leggera, arco) hanno il disegno 2 a piedi larghi come il 1: il passo misurato viene 5-7 px e le gambe volano. Le porto al passo della pesante (16 px), che va bene.
    const minimo = nf === 4 && m !== 'cammina' ? 16 : 4;
    if (largo && unito) passoPx.set(m, Math.max(minimo, largo - unito));
  }
  const allaDistanza = cfg.distanza !== false;
  const lento = cfg.lento ?? 2.5; // quanto è più lungo il terreno per disegno rispetto al passo misurato: a 1 le gambe vanno troppo veloci (il passo misurato è corto per la corsa dell'avatar)
  const av0 = G.state().avatar;
  const dx = cfg.dx ?? -2.6, dz = cfg.dz ?? 0; // scostamento in «schermo»: dx negativo = a sinistra dell'avatar (asse destra della camera)
  let avPrec = { x: av0.x, z: av0.z };
  let ultimoPoll = -1e9, av = av0;
  const fps = cfg.fps ?? 10;
  const info: Record<string, unknown> & { altezzaAvatar: number; altezzaSprite: number; vista: string; specchio: boolean; frame: string } = { vista: '', specchio: false, frame: '', altezzaAvatar, altezzaSprite: 0, viste, set: cfg.set };
  const sz = new THREE.Vector2(), vtmp = new THREE.Vector3();
  let ultimo = performance.now();

  // SCATTO (capriola alla Dark Souls): R, o il bottone ROTOLA al posto di B (nel mondo B è spento). I disegni <vista>_scatto_1-4
  // vanno a tempo e l'avatar va avanti col gancio teleport del gioco (?test=1); un raggio verso i muri accorcia la capriola.
  const scatto = { durata: 0.55, metri: 3, soglie: [0.2, 0.42, 0.72] }; // disegno 1 piega, 2 tuffo, 3 palla, 4 si rialza
  const visteScatto = viste.filter((v) => elenco[`${v}_scatto_1`]);
  let rotola: { t0: number; x0: number; z0: number; dx: number; dz: number; l: number } | null = null;
  const raggio = new THREE.Raycaster();
  const nostri = new Set<THREE.Object3D>([avObj, pivot, ombra]);
  function libero(x: number, z: number, dx: number, dz: number, l: number) {
    raggio.set(new THREE.Vector3(x, avObj.position.y + 0.5, z), new THREE.Vector3(dx, 0, dz)); raggio.far = l + 0.45; raggio.camera = B.camera;
    let colpi: THREE.Intersection[] = [];
    try { colpi = raggio.intersectObjects(B.scene.children.filter((o) => !nostri.has(o)), true); } catch { return l; } // un oggetto strano del gioco non ferma la capriola
    for (const h of colpi) {
      if (!(h.object as THREE.Mesh).isMesh) continue; // scritte e icone (Sprite), linee e punti non sono muri
      let o: THREE.Object3D | null = h.object, visto = true;
      while (o) { if (!o.visible) { visto = false; break; } o = o.parent; }
      if (visto) return Math.max(0, h.distance - 0.45);
    }
    return l;
  }
  function scatta() {
    if (rotola || !visteScatto.length || !G.test.teleport) return false;
    const a = G.state().avatar, dx = Math.sin(a.yaw), dz = -Math.cos(a.yaw);
    rotola = { t0: performance.now(), x0: a.x, z0: a.z, dx, dz, l: libero(a.x, a.z, dx, dz, scatto.metri) };
    return true;
  }
  const tasto = (e: KeyboardEvent) => { if (e.code === 'KeyR' && !e.repeat && !e.metaKey && !e.ctrlKey) scatta(); };
  addEventListener('keydown', tasto);
  const btnB = document.getElementById('btnB');
  const bottone = document.createElement('div');
  bottone.id = '_banco_rotola'; bottone.textContent = 'ROTOLA';
  bottone.style.cssText = (btnB?.style.cssText ?? 'position:absolute;right:104px;bottom:40px;width:56px;height:56px;border-radius:50%;background:#2a7f9e;color:#fff;display:flex;align-items:center;justify-content:center;')
    .replace(/display:\s*none;?/g, '') + 'display:flex;align-items:center;justify-content:center;font-size:12px;letter-spacing:0;z-index:5;'; // B spento ha solo display:none: il flex va rimesso
  bottone.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); scatta(); });
  (btnB?.parentElement ?? document.body).appendChild(bottone);
  if (!visteScatto.length) bottone.style.display = 'none';

  // DUNGEON DELLE ARMI: nel dungeon di prova lo sprite prende il posto dell'eroe 3D (e della sua arma) e mostra l'arma in mano:
  // camminata con l'arma (MOSSE.porta) e il colpo della sim a pose chiave (MOSSE.colpo). Vedi _banco_armi.ts.
  // Con una magia in mano (missile, flusso, bomba) i disegni di _banco_magie.ts: mira, lancio, raggio acceso, rilascio.
  const haArma = (a: Arma) => chiavi.some((k) => k.split('_')[1] === MOSSE[a].colpo) && chiavi.some((k) => k.split('_')[1] === MOSSE[a].porta);
  const haMagia = (m: Magia) => [1, 2, 3, 4].every((n) => chiavi.some((k) => k.endsWith(`_${m}_${n}`)));
  const bottoni = creaBottoni(haArma, haMagia);
  const colpo = creaColpo(), lancio = creaLancio(), manoA = ascoltaA();
  const fulmine = INCANTO.missile === 'fulmine' ? creaFulmine(B.scene) : null;
  let fulmineVia = false;

  function aggiorna(scena: THREE.Scene, cam: THREE.Camera) {
    if (!(cam as THREE.PerspectiveCamera).isPerspectiveCamera) return;
    // nel dungeon il gioco disegna un'altra scena (dungeon_<id>): lo sprite ci passa dentro e segue l'eroe del dungeon
    const dun = scena.name.startsWith('dungeon_') ? scena : null;
    if (!dun && scena !== B.scene) return; // altre scene (anteprime): non sono il mondo
    const h = dun ? eroe() : null;
    const eroe3d = dun ? dun.children.find((c) => c.name === 'avatar') : avObj;
    if (dun && (!h || !eroe3d)) return;
    const qui = dun ?? B.scene;
    if (pivot.parent !== qui) qui.add(pivot, ombra);
    if (fulmine && fulmine.gruppo.parent !== qui) qui.add(fulmine.gruppo);
    bottoni.aggiorna(!!dun, h && !h.magia ? armaDi(h.arma) : null, h ? magiaDi(h.magia) : null);
    bottone.style.display = dun || !visteScatto.length ? 'none' : 'flex'; // ROTOLA solo nel Borgo
    if (dun) { eroe3d!.visible = false; for (const c of dun.children) if (c.name.startsWith('arm_')) c.visible = false; } // via l'eroe 3D e la sua arma
    else if (cfg.nascondi) avObj.visible = false; // lo sprite prende il posto del 3D (il gioco puo' riaccenderlo: lo spengo a ogni fotogramma)
    const now = performance.now(); const dt = Math.min(0.1, (now - ultimo) / 1000); ultimo = now;
    if (!dun && now - ultimoPoll > 90) { av = G.state().avatar; ultimoPoll = now; }
    // camera: direzione dal personaggio alla camera sul piano
    const cp = cam.position;
    // posizione: segue l'avatar con uno scostamento sull'asse destra della camera (e uno avanti/indietro)
    const fx = eroe3d!.position.x, fz = eroe3d!.position.z;
    let tcx = cp.x - fx, tcz = cp.z - fz; const L = Math.hypot(tcx, tcz) || 1; tcx /= L; tcz /= L;
    const rx = tcz, rz = -tcx; // destra schermo = (−f.z, f.x) con f = −toCam
    // (f = (-tcx,-tcz) → (−f.z, f.x) = (tcz, −tcx))
    if (dun) { st.x = fx; st.z = fz; } // nel dungeon al posto dell'eroe, non accanto
    else if (cfg.segui !== false) { st.x = fx + rx * dx - tcx * dz; st.z = fz + rz * dx - tcz * dz; }
    // movimento e direzione: quella dell'avatar (avanti = (sin yaw, −cos yaw))
    st.muove = h ? h.anim === 'cammina' || h.anim === 'corre' : Math.hypot(av.vx, av.vz) > 0.2;
    const fl = h ? Math.hypot(h.fx, h.fz) || 1 : 1;
    const vx = h ? h.fx / fl : Math.sin(av.yaw), vz = h ? h.fz / fl : -Math.cos(av.yaw); // avanti: la sim del dungeon (fx, fz) o l'avatar del Borgo (yaw)
    if (cfg.segui !== false) st.facing = Math.atan2(vx, vz); // angolo di «avanti» sul piano
    // angolo fra il davanti del personaggio e la direzione verso la camera: 0 = guarda la camera, + = verso destra schermo
    const ang = Math.atan2(vx * rx + vz * rz, vx * tcx + vz * tcz) * 180 / Math.PI;
    const a = Math.abs(ang);
    // la capriola: a che punto è (0..1, −1 = niente) e dove sta l'avatar; parte piano, va forte nel tuffo e nella palla, frena rialzandosi
    let rp = -1;
    if (rotola && dun) rotola = null; // nel dungeon niente capriola del banco (il teleport muove l'avatar del Borgo)
    if (rotola) {
      rp = (now - rotola.t0) / 1000 / scatto.durata;
      if (rp >= 1) { rotola = null; rp = -1; } else {
        const q = Math.min(1, Math.max(0, (rp - 0.1) / 0.75)), s = q * q * (3 - 2 * q);
        G.test.teleport!(rotola.x0 + rotola.dx * rotola.l * s, rotola.z0 + rotola.dz * rotola.l * s);
      }
    }
    // nel dungeon, con un'arma in mano: il colpo (se la sim sta colpendo o tendendo) o la camminata con l'arma
    const arma = h ? armaDi(h.arma) : null;
    const cm = h && h.magia ? lancio(h, now, manoA.giu()) : null; // la magia in mano: mira, lancio, raggio
    const c = cm && haMagia(cm.mossa) ? cm : h && arma && haArma(arma) ? colpo(h, arma, now) : null;
    if (fulmine && h) { // &incanto=fulmine: il fulmine del banco sopra al proiettile del gioco
      const lancia = cm && cm.mossa === 'missile' && cm.n === 2;
      if (lancia && !fulmineVia) fulmine.spara(st.x, eroe3d!.position.y, st.z, h.fx, h.fz, now / 1000);
      fulmineVia = !!(cm && cm.n >= 2);
      fulmine.aggiorna(now / 1000, cm && cm.mossa === 'missile' && cm.n === 1 ? { x: st.x, y: eroe3d!.position.y, z: st.z, fx: h.fx, fz: h.fz } : null);
    }
    const mossa = rp >= 0 ? 'scatto' : c ? c.mossa : arma && haArma(arma) && !h!.magia ? MOSSE[arma].porta : st.mossa;
    // la vista disegnata più vicina fra quelle che ci sono per quella mossa (a scatti di 22,5°)
    let best = viste[0]!, bd = 1e9;
    for (const vi of viste) { if (!elenco[`${vi}_${mossa}_1`]) continue; const d = Math.abs(VISTE.indexOf(vi) * 22.5 - a); if (d < bd) { bd = d; best = vi; } }
    const specchio = ang < -1e-6 && best !== 'S' && best !== 'N';
    let nf = 0; while (elenco[`${best}_${mossa}_${nf + 1}`]) nf++; // i disegni che ci sono: 4 (cammina) o 8 (camminata, corsa)
    const e0 = elenco[`${best}_${mossa}_1`]; if (!e0) return;
    const voluto0 = cfg.scala === 'avatar' ? altezzaAvatar / 50 : 1 / e0.s; // unità di mondo per pixel dello sprite
    const pp = passoPx.get(mossa);
    const fatti = Math.hypot(fx - avPrec.x, fz - avPrec.z); // quanto si è mosso l'avatar da un fotogramma all'altro
    if (allaDistanza && pp && fatti < 2) st.dist += st.muove ? fatti : 0;
    st.t += dt;
    // un passo = metà ciclo: 2 disegni nella camminata a 4, 4 in quelle a 8. Alla distanza: un disegno ogni (passo / disegni per passo) di terreno
    const fase = allaDistanza && pp ? st.dist / (pp * voluto0 * lento / (nf / 2)) : st.t * fps;
    const n = st.muove ? 1 + (Math.floor(fase) % Math.max(1, nf)) : (nf === 4 ? 2 : 1); // da fermo: il disegno 2 della camminata a 4 (gambe unite), il 1 delle altre
    if (!st.muove) st.dist = 0;
    // da fermo nelle mosse a 8 pose: la posa ferma della camminata a 4 (disegno 2, gambe unite), se c'è; il disegno 1 è un contatto a gambe aperte
    const fermo = !st.muove && nf === 8 && elenco[`${best}_cammina_2`] ? `${best}_cammina_2` : null;
    const chiave = rp >= 0 ? `${best}_scatto_${1 + scatto.soglie.filter((x) => rp >= x).length}` : c ? `${best}_${c.mossa}_${c.n}` : fermo ?? `${best}_${mossa}_${n}`;
    const e = elenco[chiave]; if (!e) return;
    mat.map = tex.get(chiave)!; mat.needsUpdate = false;
    if (hd) { hd.disegno(tex.get(chiave)!, e.w, e.h); hd.mostra(); quad.visible = !hd.attivo(); } // in HD lo disegna la passata finale, sopra il mondo
    // il quad guarda la camera (billboard sferico: i pixel restano quadrati sullo schermo), perno ai piedi
    cam.updateMatrixWorld();
    pivot.position.set(st.x, eroe3d!.position.y, st.z);
    pivot.quaternion.copy(cam.quaternion);
    // NITIDO: il gioco disegna a mezza risoluzione (1 pixel di gioco = 2 del tuo schermo). Uno sprite alto come il 3D occupa meno pixel
    // di gioco di quanti ne ha (48), e con la texture «nearest» il campionamento ne salta qualcuno: pixel di larghezza diversa, immagine sgranata.
    // Qui 1 pixel dello sprite = k pixel di gioco, k intero (almeno 1), e i piedi stanno sulla griglia dei pixel.
    const rend = B.renderer, pr = rend.getPixelRatio(); rend.getSize(sz);
    const RW = sz.x * pr, RH = sz.y * pr;
    vtmp.copy(pivot.position).applyMatrix4(cam.matrixWorldInverse);
    const ppu = RH / (2 * Math.tan((cam as THREE.PerspectiveCamera).fov * Math.PI / 360) * -vtmp.z); // pixel di gioco per unità di mondo, a quella distanza
    const voluto = cfg.scala === 'avatar' ? altezzaAvatar / 50 : 1 / e.s; // unità di mondo per pixel dello sprite, come lo si vorrebbe
    // default: scala CONTINUA (lo sprite alto sempre come il 3D, a ogni zoom). Con nitido=true (?nitido=1) la scala è a interi e a ogni zoom salta fra 1x, 2x...
    const k = !cfg.nitido ? 0 : Math.max(1, Math.round(voluto * ppu));
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
    ombra.position.set(st.x, eroe3d!.position.y + 0.03, st.z);
    info.dungeon = dun?.name ?? null; info.arma = arma; info.magia = h ? magiaDi(h.magia) : null; info.anim = h?.anim ?? null; info.rotola = rp >= 0; info.vista = best; info.specchio = specchio; info.frame = chiave; info.altezzaSprite = e.h * u; info.k = k; info.pxGiocoPerUnita = +ppu.toFixed(2); info.altoPxGioco = e.h * k; info.hd = !!hd?.attivo();
    info.passoPx = pp ?? 0; info.disegniAlSecondo = pp && dt > 0 ? +(fatti / dt / (pp * voluto0 * lento / (nf / 2))).toFixed(1) : 0;
    void box; avPrec = { x: fx, z: fz };
  }
  B.pre = (s, c) => aggiorna(s, c);
  return {
    info, st, elenco, scatto, scatta, rimuovi() { hd?.rimuovi(); quad.visible = true; B.pre = undefined; pivot.removeFromParent(); ombra.removeFromParent(); removeEventListener('keydown', tasto); bottone.remove(); bottoni.rimuovi(); manoA.rimuovi(); },
    metti(p: { x?: number; z?: number; facing?: number; mossa?: string; segui?: boolean }) { if (p.x !== undefined) st.x = p.x; if (p.z !== undefined) st.z = p.z; if (p.facing !== undefined) st.facing = p.facing; if (p.mossa) st.mossa = p.mossa; if (p.segui !== undefined) cfg.segui = p.segui; },
  };
}
