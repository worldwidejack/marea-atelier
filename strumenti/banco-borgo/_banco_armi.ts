// BANCO USA-E-GETTA (non committare, non fa parte del gioco): le armi a strati dello sprite nel dungeon di prova (?test=1&net=0).
// L'eroe del dungeon diventa lo sprite: camminata con l'arma in mano (leggera, pesante, arco) e il colpo della sim a 4 disegni.
// L'arma vera la decide la sim. L'eroe del dungeon senza server non può cambiarla dallo zaino (la sim lo vieta senza personaggio salvato),
// quindi i bottoni del banco la mettono nell'equipaggiamento di partenza e, se sei già giù, risalgono e riscendono da soli.
// Il bastone di ciano dei disegni diventa un segnaposto del colore dell'arma (?ciano=1 lo lascia ciano). Lo usa _banco_sprite.ts.
// Stessa meccanica per le magie (_banco_magie.ts): una seconda fila di bottoni Missile · Flusso · Bomba mette in mano la magia (equip.mano) e risale/riscende.
import { RPG } from '@marea/content/rpg.ts';
import { hasItem, itemDef } from '@marea/sim/rpg/items.ts';
import { dungeonLink } from './game/ingressi.ts';
import { PAL } from './ui/style.ts';
import { INCANTO, MAGIE, NOME, magiaDi } from './_banco_magie.ts';
import type { Magia } from './_banco_magie.ts';

export type Arma = 'leggera' | 'pesante' | 'arco';
/** Per ogni arma: la camminata con l'arma in mano (fa anche da posa ferma, disegno 2) e il colpo. */
export const MOSSE: Record<Arma, { porta: string; colpo: string }> = {
  leggera: { porta: 'leggera', colpo: 'fendente' }, pesante: { porta: 'pesante', colpo: 'mazzata' }, arco: { porta: 'arco', colpo: 'tiro' },
};
/** L'oggetto che i bottoni del banco mettono in mano: l'eroe nuovo del dungeon di prova ha katana e arco, lo spadone glielo diamo noi. */
const PROVA: Record<Arma, string> = { leggera: 'katana_legno', pesante: 'spadone_legno', arco: 'arco_legno' };
/** Il colore del segnaposto al posto del ciano: lama di pietra chiara, ferro scuro, legno. */
const TINTA: Record<Arma, string> = { leggera: PAL.pietraChiara, pesante: PAL.pietra, arco: PAL.legno };

export function armaDi(id: string | null | undefined): Arma | null {
  if (!id || !hasItem(id)) return null;
  const it = itemDef(id);
  return it.kind === 'arco' ? 'arco' : it.kind === 'arma' ? (it.classe === 'pesante' ? 'pesante' : 'leggera') : null;
}
/** Secondi di un colpo con quell'arma (velocita = colpi al secondo); la durata vera la misura `colpo` dopo il primo. */
const tempoDi = (id: string) => { const v = Number((itemDef(id) as { velocita?: number }).velocita) || 1; return 1 / v; };

/** Prima di scendere: l'arma (o la magia) scelta in mano e le tre armi e le tre magie nello zaino (newHero copia RPG.partenza quando si scende). */
type Scelta = { arma: Arma } | { magia: Magia };
function preparaZaino(c: Scelta): void {
  const P = (RPG as unknown as { partenza: { inv: Record<string, number>; equip: Record<string, string>; magie: string[] } }).partenza;
  for (const id of Object.values(PROVA)) if (hasItem(id) && !P.inv[id]) P.inv[id] = 1;
  for (const id of Object.values(INCANTO)) if (!P.magie.includes(id)) P.magie.push(id);
  if ('arma' in c) { P.equip.arma = PROVA[c.arma]; delete P.equip.mano; } else { P.equip.magia = INCANTO[c.magia]; P.equip.mano = 'magia'; }
}
const aspetta = async (ok: () => boolean, ms = 15000) => { const t = performance.now(); while (!ok() && performance.now() - t < ms) await new Promise((r) => setTimeout(r, 150)); return ok(); };
/** Risale dal dungeon come dal menu di pausa (Esc → Esci dal dungeon → Sì). */
function risali(): void {
  const tasto = (code: string) => dispatchEvent(new KeyboardEvent('keydown', { code, key: code, bubbles: true }));
  tasto('Escape');
  const esci = [...document.querySelectorAll('button, .mz-btn')].find((b) => b.textContent?.trim() === 'ESCI DAL DUNGEON') as HTMLElement | undefined;
  esci?.click();
  tasto('KeyY');
}

/** Il ciano #00FFFF dei disegni → il colore del segnaposto (le chiavi della mossa dicono di che arma è). */
export function tingi(img: HTMLImageElement, mossa: string): HTMLImageElement | HTMLCanvasElement {
  const arma = (Object.keys(MOSSE) as Arma[]).find((a) => MOSSE[a].porta === mossa || MOSSE[a].colpo === mossa);
  if (!arma || new URLSearchParams(location.search).get('ciano') === '1') return img;
  const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
  const g = c.getContext('2d')!; g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height), t = parseInt(TINTA[arma].slice(1), 16);
  for (let i = 0; i < d.data.length; i += 4) {
    if (d.data[i + 3]! > 0 && d.data[i]! < 40 && d.data[i + 1]! > 215 && d.data[i + 2]! > 215) { d.data[i] = t >> 16; d.data[i + 1] = (t >> 8) & 255; d.data[i + 2] = t & 255; }
  }
  g.putImageData(d, 0, 0);
  return c;
}

/** Lo stato del dungeon (lo stesso di __game.state().dungeon, ma solo lui: si legge a ogni fotogramma). */
export type Eroe = { x: number; z: number; fx: number; fz: number; anim: string; arma: string | null; magia: string | null };
export function eroe(): Eroe | null {
  const s = dungeonLink.state?.() as { phase?: string; hero?: Eroe } | undefined;
  return s && s.hero && s.phase !== 'over' ? s.hero : null;
}

/** Il disegno del colpo da mostrare adesso (null = nessun colpo: camminata o posa ferma). Pose chiave a tempo, come in Fenaki:
 *  mischia 1 anticipazione (anche per tutta la carica) · 2 fendente/mazzata nella finestra del colpo della sim (0,3-0,58) · 3 follow-through · 4 si ricompone;
 *  arco 1 incocca · 2 tende (fermo finché tieni) · 3 rilascia · 4 abbassa. Il 4 resta un attimo dopo la fine, così il colpo non si tronca. */
export function creaColpo() {
  let anim0 = '', prima = '', t0 = 0;
  const durata = new Map<string, number>();
  return (h: Eroe, arma: Arma | null, now: number): { mossa: string; n: number } | null => {
    if (h.anim !== anim0) {
      if (anim0 === 'attacca' && h.arma) durata.set(h.arma, (now - t0) / 1000); // il colpo appena finito: la sua durata vera
      prima = anim0; anim0 = h.anim; t0 = now;
    }
    if (!arma || h.magia) return null;
    const m = MOSSE[arma], e = (now - t0) / 1000;
    if (arma === 'arco') {
      if (h.anim === 'tende') return { mossa: m.colpo, n: e < 0.16 ? 1 : 2 };
      if (h.anim === 'tira') return { mossa: m.colpo, n: e < 0.12 ? 3 : 4 };
      return prima === 'tira' && e < 0.22 ? { mossa: m.colpo, n: 4 } : null;
    }
    if (h.anim === 'carica') return { mossa: m.colpo, n: 1 };
    if (h.anim === 'attacca') {
      const k = e / (durata.get(h.arma!) ?? tempoDi(h.arma!));
      return { mossa: m.colpo, n: k < 0.3 ? 1 : k < 0.58 ? 2 : k < 0.8 ? 3 : 4 };
    }
    return prima === 'attacca' && e < 0.15 ? { mossa: m.colpo, n: 4 } : null;
  };
}

/** Bottoni del banco: DUNGEON nel Borgo (scende nella Grotta, eroe nuovo), LEGGERA / PESANTE / ARCO e MISSILE / FLUSSO / BOMBA nel dungeon (e i tasti V e M che le girano). */
export function creaBottoni(haMosse: (a: Arma) => boolean, haMagia: (m: Magia) => boolean) {
  const G = (window as unknown as { __game: { test: { enterDungeon?: (id: string) => boolean } } }).__game;
  const css = 'position:absolute;z-index:30;font:bold 13px system-ui,sans-serif;color:#fff;border:3px solid ' + PAL.neroCaldo + ';border-radius:10px;padding:0 10px;height:40px;display:flex;align-items:center;justify-content:center;touch-action:none;user-select:none;';
  const scendi = document.createElement('div');
  scendi.id = '_banco_dungeon'; scendi.textContent = 'Dungeon delle armi';
  scendi.style.cssText = css + `left:12px;bottom:calc(env(safe-area-inset-bottom) + 200px);background:${PAL.viola};`;
  let scelta: Scelta = { arma: 'leggera' }, occupato = false;
  /** Scende con l'arma o la magia `c` (se sei già giù, prima risale): l'eroe nuovo del dungeon parte con quella in mano. */
  const vai = async (c: Scelta) => {
    if (occupato) return;
    occupato = true; scelta = c; preparaZaino(c);
    try {
      if (dungeonLink.state) { risali(); await aspetta(() => !dungeonLink.state); }
      await aspetta(() => !!G.test.enterDungeon?.('grotta'));
    } finally { occupato = false; }
  };
  scendi.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); void vai(scelta); });
  const fila = (id: string, alto: number) => {
    const f = document.createElement('div');
    f.id = id;
    f.style.cssText = `position:absolute;z-index:30;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top) + ${alto}px);display:none;gap:6px;`; // sotto l'HUD del dungeon (vita, magia, stamina)
    return f;
  };
  const filaArmi = fila('_banco_armi', 132), filaMagie = fila('_banco_magie', 178);
  const armi = (Object.keys(MOSSE) as Arma[]).filter(haMosse), magie = MAGIE.filter(haMagia);
  const b = new Map<Arma, HTMLDivElement>(), bm = new Map<Magia, HTMLDivElement>();
  const bottone = (testo: string, c: Scelta, dove: HTMLElement) => {
    const el = document.createElement('div');
    el.textContent = testo; el.style.cssText = css + 'position:static;';
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); metti(c); });
    dove.appendChild(el);
    return el;
  };
  /** Se non ce l'hai già in mano, risale e riscende con quella. */
  const metti = (c: Scelta) => {
    const h = eroe();
    const gia = 'arma' in c ? !h?.magia && armaDi(h?.arma) === c.arma : h?.magia === INCANTO[c.magia];
    if (!gia) void vai(c);
  };
  for (const a of armi) b.set(a, bottone(a === 'leggera' ? 'Leggera' : a === 'pesante' ? 'Pesante' : 'Arco', { arma: a }, filaArmi));
  for (const m of magie) bm.set(m, bottone(NOME[m], { magia: m }, filaMagie));
  document.body.append(scendi, filaArmi, filaMagie);
  const tasto = (e: KeyboardEvent) => {
    const h = eroe();
    if ((e.code !== 'KeyV' && e.code !== 'KeyM') || e.repeat || !h) return;
    if (e.code === 'KeyV' && armi.length) { const ora = armaDi(h.arma), i = ora ? armi.indexOf(ora) : -1; metti({ arma: armi[(i + 1) % armi.length]! }); }
    if (e.code === 'KeyM' && magie.length) { const ora = h.magia ? magiaDi(h.magia) : null, i = ora ? magie.indexOf(ora) : -1; metti({ magia: magie[(i + 1) % magie.length]! }); }
  };
  addEventListener('keydown', tasto);
  return {
    /** A ogni fotogramma: nel dungeon i bottoni delle armi e delle magie (quella in mano accesa), fuori il bottone per scendere. */
    aggiorna(dentro: boolean, arma: Arma | null, magia: Magia | null) {
      scendi.style.display = dentro || !(armi.length || magie.length) ? 'none' : 'flex';
      filaArmi.style.display = dentro && armi.length ? 'flex' : 'none';
      filaMagie.style.display = dentro && magie.length ? 'flex' : 'none';
      for (const [a, el] of b) el.style.background = a === arma ? PAL.erbaChiara : PAL.legnoScuro;
      for (const [m, el] of bm) el.style.background = m === magia ? PAL.erbaChiara : PAL.legnoScuro;
    },
    rimuovi() { scendi.remove(); filaArmi.remove(); filaMagie.remove(); removeEventListener('keydown', tasto); },
  };
}
