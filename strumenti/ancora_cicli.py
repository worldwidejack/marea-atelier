"""Riancora i cicli di camminata e corsa sulla testa: il punto d'appoggio (ax) di ogni disegno cade sul centro dei capelli.

pixel.py mette l'appoggio al centro del ritaglio della figura: coi passi la figura si allarga ora davanti ora dietro e la testa
balla di 1-3 pixel da un disegno all'altro (a schermo, con i pixel grossi: un tremore). Qui l'appoggio segue la testa, che così
sta ferma mentre gambe e braccia fanno il passo. Si cambia solo elenco.json, i PNG restano com'erano.
Uso: python strumenti/ancora_cicli.py personaggi/<id>/sprite [mossa mossa ...]   (dopo pixel.py e nomi_8pose.py)
Predefinite: cammina, camminata, corsa. Numeri: prima e dopo, quanto balla la testa (pixel d'arte) per ogni vista e mossa.
"""
import json
import os
import re
import sys

import numpy as np
from PIL import Image

cartella = sys.argv[1]
mosse = sys.argv[2:] or ['cammina', 'camminata', 'corsa']
elenco_p = os.path.join(cartella, 'elenco.json')
elenco = json.load(open(elenco_p, encoding='utf-8'))


def centro_testa(nome):
    """x del centro dei pixel scuri (capelli e contorno) nel 38 % più alto della figura."""
    a = np.array(Image.open(os.path.join(cartella, nome + '.png')).convert('RGBA'))
    righe = np.nonzero(a[..., 3].any(1))[0]
    y0, y1 = righe.min(), righe.max()
    alto = a[y0:y0 + max(4, int((y1 - y0 + 1) * 0.38))]
    scuri = (alto[..., 3] > 0) & (alto[..., :3].astype(int).sum(-1) < 200)
    xs = np.nonzero(scuri)[1]
    return float(xs.mean())


gruppi = {}
for nome in elenco:
    m = re.match(r'^([A-Z]+)_([a-z0-9]+)_(\d+)$', nome)
    if m and m.group(2) in mosse:
        gruppi.setdefault((m.group(1), m.group(2)), []).append(nome)
for (vista, mossa), nomi in sorted(gruppi.items()):
    nomi.sort(key=lambda n: int(n.rsplit('_', 1)[1]))
    prima = [centro_testa(n) - elenco[n]['ax'] for n in nomi]
    for n in nomi:
        elenco[n]['ax'] = int(round(centro_testa(n)))
    dopo = [centro_testa(n) - elenco[n]['ax'] for n in nomi]
    print(f'{vista:3} {mossa:9} la testa balla di {max(prima) - min(prima):4.1f} px prima, {max(dopo) - min(dopo):4.1f} dopo')
json.dump(dict(sorted(elenco.items())), open(elenco_p, 'w', encoding='utf-8'), indent=0)
