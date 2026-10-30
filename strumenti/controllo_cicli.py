"""Controllo dei cicli di camminata e corsa di un personaggio, prima di farli vedere: tre numeri per vista e per ciclo.

1. «metà»: differenza fra le due metà del ciclo (primo e secondo passo) di dove sta la pelle visibile nella testa rispetto ai capelli.
   Sopra 3 px = nel secondo passo la testa è girata dall'altra parte (in gioco il personaggio «si volta a destra e a sinistra»).
2. «testa»: quanto balla la testa (px d'arte) rispetto al punto d'appoggio da un disegno all'altro: sopra ~2 px a schermo è un tremore.
   Si sistema con ancora_cicli.py.
3. «piedi»: con 4 disegni per passo (2 per la camminata a 4), a quanti disegni al secondo i piedi stanno fermi a terra, alla velocità data
   (unità al secondo; 1 unità = 's' pixel d'arte, 19,2 di serie), dal passo disegnato nei disegni di contatto della vista E.
Uso: python strumenti/controllo_cicli.py personaggi/<id>/sprite [velocita_camminata velocita_corsa]   (4,2 e 7,4 sono quelle del banco)
"""
import json
import os
import sys

import numpy as np
from PIL import Image

cartella = sys.argv[1]
vel = {'cammina': float(sys.argv[2]) if len(sys.argv) > 2 else 4.2, 'camminata': float(sys.argv[2]) if len(sys.argv) > 2 else 4.2,
       'corsa': float(sys.argv[3]) if len(sys.argv) > 3 else 7.4}
elenco = json.load(open(os.path.join(cartella, 'elenco.json'), encoding='utf-8'))
VISTE = ['S', 'SSE', 'SE', 'ESE', 'E', 'ENE', 'NE', 'NNE', 'N']
CICLI = (('cammina', 4, 2), ('camminata', 8, 4), ('corsa', 8, 4))   # nome, disegni, disegni per passo
PELLE = [(0xDD, 0x9F, 0x6D), (0xFA, 0xB9, 0x79), (0xD1, 0x81, 0x5D)]


def carica(nome):
    return np.array(Image.open(os.path.join(cartella, nome + '.png')).convert('RGBA'))


def scuri(a):
    return (a[..., 3] > 0) & (a[..., :3].astype(int).sum(-1) < 200)


def testa(nome):
    """(x del centro dei capelli, x del centro della pelle nella testa) in pixel del disegno."""
    a = carica(nome)
    righe = np.nonzero(a[..., 3].any(1))[0]
    y0, y1 = righe.min(), righe.max()
    h = max(4, int((y1 - y0 + 1) * 0.38))
    alto = a[y0:y0 + h]
    cx = float(np.nonzero(scuri(alto))[1].mean())
    pelle = np.zeros(alto.shape[:2], bool)
    for c in PELLE:
        pelle |= (alto[..., :3] == np.array(c)).all(-1)
    pelle &= alto[..., 3] > 0
    px = np.nonzero(pelle)[1]
    return cx, (float(px.mean()) if len(px) else float('nan'))


def passo_disegnato(nome):
    a = carica(nome)
    sotto = a[a.shape[0] - 8:, :, 3] > 0
    colonne = np.nonzero(sotto.any(0))[0]
    gruppi = np.split(colonne, np.nonzero(np.diff(colonne) > 1)[0] + 1)
    cen = [g.mean() for g in gruppi if len(g) >= 3]
    return (max(cen) - min(cen)) if len(cen) >= 2 else float('nan')


for mossa, n, per_passo in CICLI:
    if f'E_{mossa}_1' not in elenco:
        continue
    print(f'== {mossa}')
    for v in VISTE:
        nomi = [f'{v}_{mossa}_{i}' for i in range(1, n + 1)]
        if not all(x in elenco for x in nomi):
            continue
        t = [testa(x) for x in nomi]
        dx = [c - elenco[x]['ax'] for (c, _), x in zip(t, nomi)]
        pelle = [p - c for c, p in t]
        meta = abs(np.nanmean(pelle[:n // 2]) - np.nanmean(pelle[n // 2:])) if n > 2 else 0
        flag = '  <<< metà diverse' if meta > 3 else ''
        print(f'  {v:3} metà {meta:4.1f} px | testa balla {max(dx) - min(dx):4.1f} px{flag}')
    s = elenco[f'E_{mossa}_1']['s']
    contatti = (1, 1 + n // 2)
    L = np.nanmean([passo_disegnato(f'E_{mossa}_{i}') for i in contatti])
    giusti = per_passo * vel[mossa] * s / L
    print(f'  piedi: passo disegnato {L:.1f} px = {L / s:.2f} unità; a {vel[mossa]} unità al secondo servono {giusti:.1f} disegni al secondo')
