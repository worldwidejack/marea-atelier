# Dai fogli delle magie agli sprite del viandante, senza toccare quelli che ci sono già (camminata ritoccata a mano, scatto, armi):
# pixel.py gira su una copia con i soli fogli delle magie e la tavolozza di prima, poi entrano in sprite/ solo i <vista>_<mossa>_<n>
# delle 3 mosse nuove (missile, flusso, bomba). Mani nude, niente ciano: la tavolozza non cambia.
# L'appoggio (ax) va sul centro dei capelli (il blob di capelli più grande), come nei cicli: così la testa non salta fra un disegno e l'altro
# anche quando il braccio è teso in avanti o alzato sopra la testa (col centro del riquadro la figura «scivolerebbe» a ogni posa).
# I piedi (ay) restano quelli di pixel.py: ogni riga ha la sua linea di base, un piede alzato resta in aria quanto lo disegna il foglio.
# Uso: python strumenti/taglia_magie.py personaggi/<id>   (la copia di lavoro va nella cartella temporanea)
import glob, json, os, re, shutil, subprocess, sys, tempfile
import cv2
import numpy as np
from PIL import Image

PY = sys.executable
SPRITE = os.path.join(os.environ.get('MAREA') or os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'marea'), 'tools', 'sprite')
MOSSE = ['missile', 'flusso', 'bomba']
CAPELLI = ['#6D3A30', '#5B332C', '#432122', '#834A37', '#9B593D', '#BF724C']  # i marroni dei capelli nella tavolozza del viandante
cart = os.path.abspath(sys.argv[1])
tmp = os.path.join(tempfile.gettempdir(), 'marea_magie_tmp')
shutil.rmtree(tmp, ignore_errors=True)
os.makedirs(os.path.join(tmp, 'fogli')); os.makedirs(os.path.join(tmp, 'sprite'))
shutil.copy(os.path.join(cart, 'scheda.json'), tmp)
fogli = [f for f in glob.glob(os.path.join(cart, 'fogli', '*.png')) if re.search(r'_cammina-(missile-bomba|flusso)\.png$', os.path.basename(f))]
for f in fogli:
    d = os.path.join(tmp, 'fogli', os.path.basename(f))
    shutil.copy2(f, d)
shutil.copy(os.path.join(cart, 'sprite', 'tavolozza.json'), os.path.join(tmp, 'sprite', 'tavolozza.json'))
subprocess.run([PY, os.path.join(SPRITE, 'pixel.py'), tmp], check=True)

el_tmp = json.load(open(os.path.join(tmp, 'sprite', 'elenco.json'), encoding='utf-8'))
el = json.load(open(os.path.join(cart, 'sprite', 'elenco.json'), encoding='utf-8'))
CAPELLI = json.load(open(os.path.join(cart, 'scheda.json'), encoding='utf-8')).get('capelli') or CAPELLI  # scheda.json «capelli»: i colori dei capelli di quel personaggio
cap = np.array([[int(h[i:i + 2], 16) for i in (1, 3, 5)] for h in CAPELLI])


def centro_capelli(nome, dove=None):
    """x del centro del blob di capelli più grande (i pixel dei marroni dei capelli; la cintura e la tasca sono blob piccoli)."""
    a = np.array(Image.open(os.path.join(dove or os.path.join(tmp, 'sprite'), nome + '.png')).convert('RGBA'))
    rgb = a[..., :3].astype(int)
    m = ((np.abs(rgb[:, :, None, :] - cap[None, None]) <= 3).all(-1).any(-1)) & (a[..., 3] > 127)  # pixel.py arrotonda i colori: ±3
    n, lab, st, cen = cv2.connectedComponentsWithStats(m.astype(np.uint8), connectivity=8)
    if n <= 1:
        return None
    k = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
    return float(cen[k][0]) + 0.5


# lo scarto fra l'appoggio già scelto per la camminata ferma (cammina_2, sulla testa) e il centro dei capelli, per vista: lo stesso scarto
# ai disegni nuovi, così il passaggio camminata → magia non sposta la testa di un pixel
scarto = {}
for v in sorted({n.split('_')[0] for n in el_tmp}):
    k = f'{v}_cammina_2'
    c = centro_capelli(k, os.path.join(cart, 'sprite')) if k in el else None
    scarto[v] = (el[k]['ax'] - c) if c is not None else 0.0
nuovi, senza = 0, []
for nome in sorted(el_tmp):
    m = re.match(r'^([A-Z]+)_([a-z0-9]+)_(\d+)$', nome)
    if not m or m.group(2) not in MOSSE:
        continue
    e = dict(el_tmp[nome])
    c = centro_capelli(nome)
    if c is None:
        senza.append(nome)
    else:
        e['ax'] = int(round(c + scarto[m.group(1)]))
    el[nome] = e
    shutil.copy2(os.path.join(tmp, 'sprite', nome + '.png'), os.path.join(cart, 'sprite', nome + '.png'))
    nuovi += 1
json.dump(dict(sorted(el.items())), open(os.path.join(cart, 'sprite', 'elenco.json'), 'w', encoding='utf-8'), indent=0)
print(f'{nuovi} sprite delle magie in {os.path.join(cart, "sprite")}')
print('senza capelli trovati (appoggio al centro del riquadro):', senza or 'nessuno')
