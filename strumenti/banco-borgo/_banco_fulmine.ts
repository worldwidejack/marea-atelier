// BANCO USA-E-GETTA (non committare, non fa parte del gioco): il fulmine dello sprite (&incanto=fulmine), sopra al Proiettile elettrico del gioco.
// Carica (disegno 1 del missile): scintille che saltano attorno alla mano. Lancio (disegno 2): un fulmine a zig-zag dalla mano fino a ~7 m,
// che si ridisegna ogni 45 ms per 0,3 s (sfarfalla), con due rami, e un lampo dove finisce. Tinte piatte della palette, niente luci né sfumature.
import * as THREE from 'three';

const COL = { anima: '#F4E3C1', giallo: '#F5D547', ciano: '#7FE3E0' }; // sabbiaChiara, giallo, acquaBassa (PAL del gioco)
const VITA = 0.3, RIDISEGNA = 0.045, LUNGO = 7, ALTO = 1.05;

export function creaFulmine(scene: THREE.Scene) {
  const grp = new THREE.Group(); grp.name = '_banco_fulmine'; scene.add(grp);
  const mat = (c: string, o = 1) => new THREE.MeshBasicMaterial({ color: c, transparent: o < 1, opacity: o, depthWrite: false, toneMapped: false });
  const M = { anima: mat(COL.anima), giallo: mat(COL.giallo), ciano: mat(COL.ciano, 0.75), lampo: mat(COL.giallo, 0.85), anello: mat(COL.ciano, 0.8) };
  const box = new THREE.BoxGeometry(1, 1, 1);
  const pool: THREE.Mesh[] = [];
  let usati = 0;
  const seg = (a: THREE.Vector3, b: THREE.Vector3, spesso: number, m: THREE.Material) => {
    let s = pool[usati];
    if (!s) { s = new THREE.Mesh(box, m); s.renderOrder = 20; pool.push(s); grp.add(s); }
    usati++;
    s.material = m; s.visible = true;
    const l = a.distanceTo(b);
    s.position.copy(a).add(b).multiplyScalar(0.5);
    s.scale.set(spesso, spesso, l);
    s.lookAt(b);
  };
  const lampo = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), M.lampo);
  const anello = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 16), M.anello);
  anello.rotation.x = -Math.PI / 2;
  lampo.renderOrder = anello.renderOrder = 21;
  grp.add(lampo, anello);

  let colpo: { t0: number; da: THREE.Vector3; a: THREE.Vector3; dir: THREE.Vector3 } | null = null;
  let disegnato = -1;
  const perp = new THREE.Vector3(), su = new THREE.Vector3(0, 1, 0), p = new THREE.Vector3(), q = new THREE.Vector3();

  // una linea spezzata da a verso b in n pezzi, ogni punto spostato a caso di ±scarto di lato e in alto; ritorna i punti
  const zigzag = (a: THREE.Vector3, b: THREE.Vector3, n: number, scarto: number) => {
    const d = q.copy(b).sub(a); perp.crossVectors(d, su).normalize();
    const pt = [a.clone()];
    for (let i = 1; i < n; i++) {
      const k = i / n;
      pt.push(a.clone().addScaledVector(d, k).addScaledVector(perp, (Math.random() * 2 - 1) * scarto).add(new THREE.Vector3(0, (Math.random() * 2 - 1) * scarto * 0.6, 0)));
    }
    pt.push(b.clone());
    return pt;
  };
  const traccia = (pt: THREE.Vector3[], spesso: number) => {
    for (let i = 1; i < pt.length; i++) {
      seg(pt[i - 1]!, pt[i]!, spesso * 2.4, M.ciano);
      seg(pt[i - 1]!, pt[i]!, spesso * 1.7, M.giallo);
      seg(pt[i - 1]!, pt[i]!, spesso * 0.8, M.anima);
    }
  };

  return {
    gruppo: grp,
    /** il colpo parte: dalla mano (x, z del personaggio + un passo avanti) verso (fx, fz) */
    spara(x: number, y: number, z: number, fx: number, fz: number, now: number) {
      const dir = new THREE.Vector3(fx, 0, fz).normalize();
      const da = new THREE.Vector3(x, y + ALTO, z).addScaledVector(dir, 0.55);
      colpo = { t0: now, da, a: da.clone().addScaledVector(dir, LUNGO).setY(y + 0.35), dir };
      disegnato = -1;
    },
    /** a ogni fotogramma. carica = la mano mentre mira (disegno 1), per le scintille */
    aggiorna(now: number, carica: { x: number; y: number; z: number; fx: number; fz: number } | null) {
      const quadro = Math.floor(now / RIDISEGNA);
      if (quadro === disegnato) return;
      disegnato = quadro;
      usati = 0;
      lampo.visible = anello.visible = false;
      if (carica) {
        const dir = new THREE.Vector3(carica.fx, 0, carica.fz).normalize();
        const mano = new THREE.Vector3(carica.x, carica.y + ALTO + 0.1, carica.z).addScaledVector(dir, 0.35);
        for (let i = 0; i < 3; i++) {
          p.set(Math.random() * 2 - 1, Math.random() * 1.6 - 0.6, Math.random() * 2 - 1).normalize().multiplyScalar(0.28 + Math.random() * 0.12);
          traccia(zigzag(mano, mano.clone().add(p), 3, 0.06), 0.03);
        }
      }
      if (colpo) {
        const e = now - colpo.t0;
        if (e > VITA) colpo = null;
        else {
          const svanisce = 1 - e / VITA;
          const pt = zigzag(colpo.da, colpo.a, 12, 0.45);
          traccia(pt, 0.11 * (0.5 + svanisce));
          for (const i of [3, 6]) { // due rami che si staccano dal fulmine
            const da = pt[i]!; perp.crossVectors(colpo.dir, su).normalize();
            const a = da.clone().addScaledVector(colpo.dir, 1.2).addScaledVector(perp, (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 0.5)).add(new THREE.Vector3(0, -0.35, 0));
            traccia(zigzag(da, a, 3, 0.2), 0.06);
          }
          const r = 0.35 + 0.5 * (e / VITA);
          lampo.visible = e < VITA * 0.7; lampo.position.copy(colpo.a); lampo.scale.setScalar(r * (quadro % 2 ? 1 : 0.8));
          anello.visible = true; anello.position.copy(colpo.a).setY(colpo.a.y - 0.3); anello.scale.setScalar(0.4 + 1.6 * (e / VITA));
          for (let i = 0; i < 5; i++) { // schizzi dove colpisce
            p.set(Math.random() * 2 - 1, Math.random() * 0.8 + 0.2, Math.random() * 2 - 1).normalize().multiplyScalar(0.5 + Math.random() * 0.6);
            traccia(zigzag(colpo.a, colpo.a.clone().add(p), 2, 0.1), 0.03);
          }
        }
      }
      for (let i = usati; i < pool.length; i++) pool[i]!.visible = false;
    },
  };
}
