// BANCO USA-E-GETTA (non committare, non fa parte del gioco): le tre magie dello sprite nel dungeon di prova (?test=1&net=0).
// Missile (proiettile), flusso (raggio) e bomba, ognuna con 4 disegni <vista>_<missile|flusso|bomba>_<1-4>, mani nude: gli effetti li disegna il gioco.
// Le pose vanno legate alla sim, come per le armi (vedi _banco_armi.ts). La forma la dice la magia in mano (spells.json: forma raggio / bomba / proiettile).
//  missile e bomba: il 1 (anticipazione) dura finché tieni A (la sim mira), al rilascio la sim fa 'lancia' per 0,35 s: 2 il lancio, 3 il follow-through, 4 si ricompone.
//  flusso: il 1 all'accensione del raggio (anim «lancia»), poi 2 e 3 si alternano a ritmo di tremito finché il raggio è acceso, il 4 al rilascio.
// Il gioco non dice se stai mirando (l'anim del raggio spento è «fermo»), quindi il banco ascolta A da sé: Spazio, clic sul canvas, bottone A, joystick di mira.
import { spellDef } from '@marea/content/rpg.ts';
import type { Eroe } from './_banco_armi.ts';

export type Magia = 'missile' | 'flusso' | 'bomba';
export const MAGIE: Magia[] = ['missile', 'flusso', 'bomba'];
/** La magia che i bottoni del banco mettono in mano per ogni forma (l'eroe nuovo del dungeon ha solo la fiammata). */
// &incanto=<id di spells.json> cambia la magia del missile (es. &incanto=fulmine, il Proiettile elettrico)
export const INCANTO: Record<Magia, string> = { missile: new URLSearchParams(location.search).get('incanto') || 'fiammata', flusso: 'fuoco_continuo', bomba: 'bomba_fuoco' };
export const NOME: Record<Magia, string> = { missile: INCANTO.missile === 'fulmine' ? 'Fulmine' : 'Missile', flusso: 'Flusso', bomba: 'Bomba' };

/** La forma di una magia: raggio → flusso, bomba → bomba, tutto il resto (proiettile, evocazione) → il gesto del missile. */
export function magiaDi(id: string | null | undefined): Magia | null {
  if (!id) return null;
  try { const f = spellDef(id).forma; return f === 'raggio' ? 'flusso' : f === 'bomba' ? 'bomba' : 'missile'; } catch { return null; }
}

/** A tenuta premuta: lo stesso che legge il gioco (Spazio, clic sinistro sul canvas, bottone A, joystick di mira del telefono). */
export function ascoltaA() {
  let giu = false;
  const su = () => { giu = false; };
  const kd = (e: KeyboardEvent) => { if (e.code === 'Space') giu = true; };
  const ku = (e: KeyboardEvent) => { if (e.code === 'Space') giu = false; };
  const pd = (e: PointerEvent) => {
    const t = e.target as Element | null;
    if ((e.pointerType === 'mouse' && e.button === 0 && t?.tagName === 'CANVAS') || t?.closest?.('#btnA, #mzDngMira')) giu = true;
  };
  addEventListener('keydown', kd, true); addEventListener('keyup', ku, true); addEventListener('pointerdown', pd, true);
  addEventListener('pointerup', su, true); addEventListener('pointercancel', su, true); addEventListener('blur', su);
  return { giu: () => giu, rimuovi() { removeEventListener('keydown', kd, true); removeEventListener('keyup', ku, true); removeEventListener('pointerdown', pd, true); removeEventListener('pointerup', su, true); removeEventListener('pointercancel', su, true); removeEventListener('blur', su); } };
}

/** Tempi, in secondi. Lungo sull'anticipazione e sulla posa tesa, veloce nello scatto (slow in / slow out coi pochi disegni che ci sono).
 *  `lancia` = frazioni del lancio della sim (LANCIA, 0,35 s) in cui cambia disegno; il 4 resta ancora un poco dopo la fine, così il gesto non si tronca. */
export const LANCIA = 0.35;
export const TEMPI = { lancia: [0.22, 0.62], resta4: 0.18, accendi: 0.12, tremito: 0.09, rilascio: 0.22 };

/** Il disegno di magia da mostrare adesso (null = niente: camminata o posa ferma). Da chiamare a ogni fotogramma.
 *  Lo stato del dungeon dà solo l'anim: «lancia» dura 0,35 s dopo il rilascio di un missile o di una bomba, e per tutto il tempo del raggio acceso. */
export function creaLancio() {
  let anim0 = '', tAnim = 0, finito = -1e9;
  return (h: Eroe, ms: number, aGiu: boolean): { mossa: Magia; n: number } | null => {
    const now = ms / 1000, m = magiaDi(h.magia);
    if (h.anim !== anim0) { if (anim0 === 'lancia') finito = now; anim0 = h.anim; tAnim = now; }
    if (!m) return null;
    const lancia = h.anim === 'lancia', e = now - tAnim;
    if (m === 'flusso') {
      if (lancia) { const k = e - TEMPI.accendi; return { mossa: m, n: k < 0 ? 1 : Math.floor(k / TEMPI.tremito) % 2 === 0 ? 2 : 3 }; }
      if (aGiu) return { mossa: m, n: 1 }; // premuto ma il raggio non parte (Magicka finita, riposo): resta la posa di partenza
      return now - finito < TEMPI.rilascio ? { mossa: m, n: 4 } : null;
    }
    if (lancia) { const t = e / LANCIA; return { mossa: m, n: t < TEMPI.lancia[0]! ? 2 : t < TEMPI.lancia[1]! ? 3 : 4 }; }
    if (aGiu) return { mossa: m, n: 1 };
    return now - finito < TEMPI.resta4 ? { mossa: m, n: 4 } : null;
  };
}
