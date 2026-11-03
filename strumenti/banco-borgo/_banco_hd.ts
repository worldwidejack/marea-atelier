// BANCO USA-E-GETTA (non committare, non fa parte del gioco): lo sprite a risoluzione piena (HD), a qualunque distanza della camera.
// Il gioco disegna il mondo a mezza risoluzione (tela piccola ingrandita dalla pagina, con o senza la passata finale di render/post.ts) e uno
// sprite messo dentro quella scena eredita i pixel grossi: da vicino a blocchi irregolari, da lontano sfumato dai mipmap. Qui il mondo resta
// com'è (stessi pixel): la scena va in un'immagine piccola, passa a schermo intero «nearest» (identica a prima) e SOPRA disegno lo sprite
// alla risoluzione vera dello schermo: bordi netti a ogni zoom, nascosto da ciò che gli sta davanti (profondità del gioco) e, se c'è la
// passata finale, con gli stessi ritocchi di colore del mondo (foschia, esposizione, saturazione, contrasto, palette).
import * as THREE from 'three';

type Uni = Record<string, THREE.IUniform>;
const PAL = 32; // MAXPAL di post.ts
// stessi uniform della passata finale del gioco: si prendono per riferimento, così seguono giorno/notte e stile
const DAL_POST = ['tDepth', 'uNear', 'uFar', 'uFog', 'uFogCol', 'uFogNear', 'uFogFar', 'uFogMax', 'uTint', 'uExp', 'uSat', 'uCon', 'uPal', 'uPalN'];

const VERT = /* glsl */ `varying vec2 vUv; varying float vZ;
void main() { vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vZ = -mv.z; gl_Position = projectionMatrix * mv; }`;
const FRAG = /* glsl */ `#include <packing>
varying vec2 vUv; varying float vZ;
uniform sampler2D map, tDepth;
uniform vec2 uTex, uCanvas;
uniform float uNear, uFar, uFog, uFogNear, uFogFar, uFogMax, uExp, uSat, uCon;
uniform vec3 uFogCol, uTint;
uniform vec3 uPal[${PAL}];
uniform int uPalN;
void main() {
  // nascosto da ciò che gli sta davanti: profondità del gioco (a mezza risoluzione, quindi i bordi seguono i pixel del mondo)
  float d = texture2D(tDepth, gl_FragCoord.xy / uCanvas).x;
  if (d < 0.99999 && -perspectiveDepthToViewZ(d, uNear, uFar) < vZ - 0.12) discard;
  // pixel d'arte netti: il campione sta al centro del pixel, e si sfuma solo per la larghezza di un pixel dello schermo sul bordo fra due pixel d'arte
  vec2 p = vUv * uTex, fw = max(fwidth(p), vec2(1e-4)), seam = floor(p + 0.5);
  vec2 s = seam + clamp((p - seam) / fw + 0.5, 0.0, 1.0) - 0.5;
  vec4 t = textureGrad(map, s / uTex, dFdx(vUv), dFdy(vUv)); // il gradiente vero sceglie il mipmap quando lo sprite è più piccolo del disegno
  if (t.a < 0.5) discard;
  vec3 c = t.rgb; // lineare (la texture è sRGB)
  if (uFog > 0.5) {
    float f = uFogMax * clamp((vZ - uFogNear) / (uFogFar - uFogNear), 0.0, 1.0) + (1.0 - uFogMax) * clamp((vZ - uFogFar) / 500.0, 0.0, 1.0);
    c = mix(c, uFogCol, min(1.0, floor(f * 5.0 + 0.5) / 5.0));
  }
  c *= uExp * uTint;
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = max(mix(vec3(l), c, uSat), 0.0);
  vec3 o = clamp(sRGBTransferOETF(vec4(c, 1.0)).rgb, 0.0, 1.0);
  o = clamp((o - 0.5) * uCon + 0.5, 0.0, 1.0);
  if (uPalN > 0) {
    vec3 b1 = o; float d1 = 1e9;
    for (int i = 0; i < ${PAL}; i++) {
      if (i >= uPalN) break;
      vec3 dd = o - uPal[i];
      float e = dot(dd * dd, vec3(2.0, 4.0, 3.0));
      if (e < d1) { d1 = e; b1 = uPal[i]; }
    }
    o = b1;
  }
  gl_FragColor = vec4(o, 1.0);
}`;

/** Texture per lo shader: i pixel trasparenti prendono il colore del vicino pieno, così il bordo non si scurisce quando si sfuma. */
export function texturaHd(img: CanvasImageSource & { width?: number; height?: number; naturalWidth?: number; naturalHeight?: number }): THREE.DataTexture {
  const w = img.naturalWidth ?? img.width!, h = img.naturalHeight ?? img.height!;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true })!; g.drawImage(img, 0, 0);
  const src = g.getImageData(0, 0, w, h).data, out = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4, o = ((h - 1 - y) * w + x) * 4; // la riga 0 della texture è in basso
    let r = src[i]!, gg = src[i + 1]!, b = src[i + 2]!;
    if (src[i + 3]! === 0) {
      let n = 0; r = gg = b = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
        const j = (yy * w + xx) * 4; if (src[j + 3]! === 0) continue;
        r += src[j]!; gg += src[j + 1]!; b += src[j + 2]!; n++;
      }
      if (n) { r = Math.round(r / n); gg = Math.round(gg / n); b = Math.round(b / n); }
    }
    out[o] = r; out[o + 1] = gg; out[o + 2] = b; out[o + 3] = src[i + 3]!;
  }
  const t = new THREE.DataTexture(out, w, h, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
  t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true;
  return t;
}

/**
 * Lo strato HD. `quad` è il quadrato dello sprite già messo in scena dal banco (lo nascondo quando lo disegno io), `mostra()` va chiamata a
 * ogni fotogramma in cui lo sprite c'è, `disegno()` dice quale. Due casi, li vede da solo: con la passata finale del gioco (contorni, meteo…
 * accesi nelle impostazioni) intercetta quella; senza, intercetta il disegno diretto della scena sulla tela.
 */
export function creaHd(rend: THREE.WebGLRenderer, quad: THREE.Mesh, mondo: () => THREE.Object3D | null) {
  const canvas = rend.domElement;
  const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, side: THREE.DoubleSide, depthTest: false, depthWrite: false,
    uniforms: { map: { value: null }, uTex: { value: new THREE.Vector2(1, 1) }, uCanvas: { value: new THREE.Vector2(1, 1) } } });
  // senza passata finale il mondo non ha ritocchi: valori neutri
  const neutri: Uni = {
    tDepth: { value: null }, uNear: { value: 1 }, uFar: { value: 300 }, uFog: { value: 0 }, uFogCol: { value: new THREE.Color(1, 1, 1) }, uFogNear: { value: 35 }, uFogFar: { value: 200 }, uFogMax: { value: 0 },
    uTint: { value: new THREE.Color(1, 1, 1) }, uExp: { value: 1 }, uSat: { value: 1 }, uCon: { value: 1 }, uPal: { value: Array.from({ length: PAL }, () => new THREE.Vector3()) }, uPalN: { value: 0 },
  };
  const usa = (da: Uni) => { for (const k of DAL_POST) mat.uniforms[k] = da[k]!; };
  usa(neutri);
  const mioQuad = new THREE.Mesh(quad.geometry, mat); mioQuad.frustumCulled = false; mioQuad.matrixAutoUpdate = false;
  const scenaHd = new THREE.Scene(); scenaHd.name = '_banco_hd'; scenaHd.add(mioQuad);
  // passata a schermo intero: l'immagine piccola del gioco, ingrandita «nearest» (come faceva la pagina)
  const blit = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: 'varying vec2 vUv; uniform sampler2D tColor; uniform float uCodifica; void main() { vec3 c = texture2D(tColor, vUv).rgb; gl_FragColor = vec4(uCodifica > 0.5 ? sRGBTransferOETF(vec4(c, 1.0)).rgb : c, 1.0); }',
    uniforms: { tColor: { value: null }, uCodifica: { value: 0 } }, depthTest: false, depthWrite: false }));
  blit.frustumCulled = false;
  const blitU = (blit.material as THREE.ShaderMaterial).uniforms as Uni;
  const scenaBlit = new THREE.Scene(); scenaBlit.add(blit);
  const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  // due immagini piccole: quella della passata finale (colore grezzo, scrive già in sRGB) e quella della scena disegnata diretta (sRGB + profondità)
  const finale = new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false });
  const prof = new THREE.DepthTexture(1, 1); prof.type = THREE.UnsignedIntType;
  const diretta = new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true, depthTexture: prof, colorSpace: THREE.SRGBColorSpace });

  // la tela a risoluzione piena; il gioco continua a credere di avere quella piccola (getSize), che è quella del suo resize
  const logico = new THREE.Vector2(0, 0);
  const setSize0 = rend.setSize.bind(rend), getSize0 = rend.getSize.bind(rend);
  rend.setSize = (w: number, h: number, stile?: boolean) => {
    const cw = canvas.clientWidth || innerWidth, ch = canvas.clientHeight || innerHeight, d = Math.min(2, devicePixelRatio || 1);
    const W = Math.round(cw * d), H = Math.round(ch * d);
    if (w < W && Math.abs(w / h - cw / ch) < 0.02) { logico.set(w, h); setSize0(W, H, false); } // il resize del gioco (immagine piccola della finestra)
    else { logico.set(0, 0); setSize0(w, h, stile); } // altro (foto, anteprime): com'era
  };
  rend.getSize = ((t: THREE.Vector2) => logico.x ? t.copy(logico) : getSize0(t)) as typeof rend.getSize;
  dispatchEvent(new Event('resize')); // il gioco rifà subito il suo resize, ora passa da qui

  let mostra = false, attivo = false;
  const dimensiona = (t: THREE.WebGLRenderTarget) => { if (t.width !== logico.x || t.height !== logico.y) t.setSize(logico.x, logico.y); };
  const sprite = (cam: THREE.Camera) => {
    if (!mostra) return;
    mioQuad.matrix.copy(quad.matrixWorld); mioQuad.matrixWorldNeedsUpdate = true;
    const ac = rend.autoClear; rend.autoClear = false;
    mat.uniforms.uCanvas!.value.set(canvas.width, canvas.height);
    render0.call(rend, scenaHd, cam);
    rend.autoClear = ac;
  };
  const render0 = rend.render; // quello del banco (cattura scena e camera, chiama B.pre)
  rend.render = (s: THREE.Object3D, c: THREE.Camera) => {
    if (!c || logico.x <= 0 || rend.getRenderTarget()) return render0.call(rend, s, c); // dentro un'altra immagine (la scena della passata finale): com'è
    const m = (s as THREE.Mesh).material as THREE.ShaderMaterial | undefined;
    if ((c as THREE.OrthographicCamera).isOrthographicCamera) {
      // la passata finale del gioco: un quadrato a schermo intero con la profondità della scena
      const U = m?.uniforms as Uni | undefined;
      if (!U || !U.tDepth || !U.tColor) return render0.call(rend, s, c);
      const mancano = DAL_POST.filter((k) => !U[k]);
      if (mancano.length) { if (attivo) console.warn('banco HD: la passata finale del gioco non ha', mancano.join(', '), '(post.ts è cambiato): HD spento'); attivo = false; return render0.call(rend, s, c); }
      usa(U); attivo = true;
      dimensiona(finale);
      rend.setRenderTarget(finale); render0.call(rend, s, c);
      rend.setRenderTarget(null); blitU.tColor!.value = finale.texture; blitU.uCodifica!.value = 0; render0.call(rend, scenaBlit, ortho);
      sprite((window as unknown as { __banco: { camera: THREE.Camera } }).__banco.camera);
    } else if ((c as THREE.PerspectiveCamera).isPerspectiveCamera && rend.autoClear) {
      // senza passata finale il gioco disegna la scena diretta sulla tela: la rifaccio in piccolo e la ingrandisco
      attivo = true;
      dimensiona(diretta);
      rend.setRenderTarget(diretta); render0.call(rend, s, c);
      rend.setRenderTarget(null); blitU.tColor!.value = diretta.texture; blitU.uCodifica!.value = 1; render0.call(rend, scenaBlit, ortho);
      const w = mondo();
      if (w && (s === w || s.name.startsWith('dungeon_'))) {
        usa(neutri); neutri.tDepth!.value = prof; neutri.uNear!.value = (c as THREE.PerspectiveCamera).near; neutri.uFar!.value = (c as THREE.PerspectiveCamera).far;
        sprite(c);
      }
    } else return render0.call(rend, s, c);
    mostra = false;
  };
  return {
    mat,
    attivo: () => attivo, // true da quando una passata è passata da qui: da allora il quadrato in scena non serve più
    mostra() { mostra = true; },
    disegno(t: THREE.Texture, w: number, h: number) { mat.uniforms.map!.value = t; (mat.uniforms.uTex!.value as THREE.Vector2).set(w, h); },
    rimuovi() { rend.render = render0; rend.setSize = setSize0 as typeof rend.setSize; rend.getSize = getSize0 as typeof rend.getSize; logico.set(0, 0); dispatchEvent(new Event('resize')); mat.dispose(); finale.dispose(); diretta.dispose(); },
  };
}
