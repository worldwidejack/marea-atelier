"""Porta gli sprite a 8 pose ai nomi di F3: passo1/passo2 -> camminata_1..8, corsa1/corsa2 -> corsa_1..8, e toglie le mezze mosse.

pixel.py dà i nomi dai fogli (<vista>_passo1_<n>, <vista>_passo2_<n>, ...). Il banco e il motore di F3 leggono
<vista>_camminata_<1-8> e <vista>_corsa_<1-8>: qui si copiano, si aggiunge la voce in elenco.json e si cancellano i passo1/2 e corsa1/2.
Si rilancia dopo ogni pixel.py (che li rifà).
Uso: python strumenti/nomi_8pose.py personaggi/<id>/sprite
"""
import json
import os
import shutil
import sys

cartella = sys.argv[1]
elenco_p = os.path.join(cartella, 'elenco.json')
elenco = json.load(open(elenco_p, encoding='utf-8'))
VISTE = ['S', 'SSE', 'SE', 'ESE', 'E', 'ENE', 'NE', 'NNE', 'N']
COPIE = [('camminata', 'passo1', 0), ('camminata', 'passo2', 4), ('corsa', 'corsa1', 0), ('corsa', 'corsa2', 4)]
fatte = 0
for v in VISTE:
    for nuova, vecchia, base in COPIE:
        for n in range(1, 5):
            da, a = f'{v}_{vecchia}_{n}', f'{v}_{nuova}_{base + n}'
            if da not in elenco:
                continue
            shutil.copyfile(os.path.join(cartella, da + '.png'), os.path.join(cartella, a + '.png'))
            elenco[a] = dict(elenco[da])
            fatte += 1
# RINOMINA: le mezze mosse passo1/2 e corsa1/2 non restano in sprite/ (la galleria le mostrerebbe come mosse a parte)
for v in VISTE:
    for vecchia in ('passo1', 'passo2', 'corsa1', 'corsa2'):
        for n in range(1, 5):
            k = f'{v}_{vecchia}_{n}'
            if k in elenco:
                del elenco[k]
                os.remove(os.path.join(cartella, k + '.png'))
json.dump(dict(sorted(elenco.items())), open(elenco_p, 'w', encoding='utf-8'), indent=0)
print(fatte, 'copie coi nomi di F3 (camminata_1-8, corsa_1-8)')
