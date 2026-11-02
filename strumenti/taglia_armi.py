# Dai fogli delle armi agli sprite del viandante, senza toccare quelli che ci sono già (camminata ritoccata a mano, scatto):
# pixel.py gira su una copia con i soli fogli delle armi e la tavolozza di prima (+ il ciano in coda), poi entrano in sprite/
# solo i <vista>_<mossa>_<n> delle 6 mosse nuove. L'appoggio (ax) va sul centro della testa senza contare l'arma (come ancora_cicli.py,
# ma l'arma alzata sopra la testa non sposta il conto); la riga dei piedi non conta l'arma (una punta a terra più in basso dei piedi
# farebbe galleggiare il personaggio).
# Il ciano sottile a 48 px diventava contorno nero: prima del taglio si allarga sul foglio (INGROSSA pixel, di serie 5).
# Uso: python strumenti/taglia_armi.py personaggi/<id>   (la copia di lavoro va nella cartella temporanea)
import glob, json, os, re, shutil, subprocess, sys, tempfile
import numpy as np
from PIL import Image

PY = sys.executable
SPRITE = os.path.join(os.environ.get('MAREA') or os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'marea'), 'tools', 'sprite')
MOSSE = ['leggera', 'fendente', 'pesante', 'mazzata', 'arco', 'tiro']
cart = os.path.abspath(sys.argv[1])
tmp = os.path.join(tempfile.gettempdir(), 'marea_armi_tmp')
shutil.rmtree(tmp, ignore_errors=True)
os.makedirs(os.path.join(tmp, 'fogli')); os.makedirs(os.path.join(tmp, 'sprite'))
shutil.copy(os.path.join(cart, 'scheda.json'), tmp)
fogli = [f for f in glob.glob(os.path.join(cart, 'fogli', '*_cammina-*-*.png')) if re.search(r'_cammina-(leggera-fendente|pesante-mazzata|arco-tiro)\.png$', f)]
import cv2
R = int(os.environ.get('INGROSSA', 5))  # pixel del foglio: il ciano si allarga di tanto sul magenta e sul contorno, così a 48 px resta ≥ 2 pixel
for f in fogli:
    a = np.array(Image.open(f).convert('RGB'))
    r, g, b = [a[..., i].astype(int) for i in range(3)]
    ciano = (g > 170) & (b > 170) & (r < 130)
    largo = cv2.dilate(ciano.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * R + 1, 2 * R + 1))).astype(bool)
    fondo = ((r > 190) & (b > 190) & (g < 90)) | (r + g + b < 160)  # magenta o contorno scuro: la mano e i vestiti restano
    a[largo & fondo] = (0, 255, 255)
    a[ciano] = (0, 255, 255)  # i bordi sfumati del bastone: ciano pieno
    Image.fromarray(a).save(os.path.join(tmp, 'fogli', os.path.basename(f)))
    os.utime(os.path.join(tmp, 'fogli', os.path.basename(f)), (os.path.getmtime(f), os.path.getmtime(f)))
tav = json.load(open(os.path.join(cart, 'sprite', 'tavolozza.json'), encoding='utf-8'))
if '#00FFFF' not in tav:
    tav.append('#00FFFF')
json.dump(tav, open(os.path.join(tmp, 'sprite', 'tavolozza.json'), 'w', encoding='utf-8'), indent=0)
subprocess.run([PY, os.path.join(SPRITE, 'pixel.py'), tmp], check=True)

el_tmp = json.load(open(os.path.join(tmp, 'sprite', 'elenco.json'), encoding='utf-8'))
el = json.load(open(os.path.join(cart, 'sprite', 'elenco.json'), encoding='utf-8'))
CIANO = np.array([0, 255, 255])


def sistema(nome):
    """Toglie il fondo vuoto sotto i piedi se l'arma scende più in basso (ay) e mette ax sul centro della testa senza l'arma."""
    p = os.path.join(tmp, 'sprite', nome + '.png')
    a = np.array(Image.open(p).convert('RGBA'))
    pieno = a[..., 3] > 0
    ciano = pieno & (np.abs(a[..., :3].astype(int) - CIANO).sum(-1) < 30)
    # l'arma con il suo contorno: il ciano allargato di 1 pixel
    arma = ciano.copy()
    arma[1:] |= ciano[:-1]; arma[:-1] |= ciano[1:]; arma[:, 1:] |= ciano[:, :-1]; arma[:, :-1] |= ciano[:, 1:]
    corpo = pieno & ~arma
    righe = np.nonzero(corpo.any(1))[0]
    y0, y1 = righe.min(), righe.max()
    alto = corpo[y0:y0 + max(4, int((y1 - y0 + 1) * 0.38))]
    scuri = alto & (a[y0:y0 + alto.shape[0], :, :3].astype(int).sum(-1) < 200)
    xs = np.nonzero(scuri)[1]
    if not len(xs):
        xs = np.nonzero(alto)[1]
    e = dict(el_tmp[nome])
    e['ax'] = int(round(float(xs.mean())))
    e['ay'] = int(y1)  # i piedi: l'ultima riga del corpo, non la punta dell'arma
    return e, int(ciano.sum())


nuovi, ciani = 0, {}
for nome in sorted(el_tmp):
    m = re.match(r'^([A-Z]+)_([a-z0-9]+)_(\d+)$', nome)
    if not m or m.group(2) not in MOSSE:
        continue
    e, nc = sistema(nome)
    el[nome] = e
    ciani[nome] = nc
    shutil.copy2(os.path.join(tmp, 'sprite', nome + '.png'), os.path.join(cart, 'sprite', nome + '.png'))
    nuovi += 1
json.dump(dict(sorted(el.items())), open(os.path.join(cart, 'sprite', 'elenco.json'), 'w', encoding='utf-8'), indent=0)
json.dump(tav, open(os.path.join(cart, 'sprite', 'tavolozza.json'), 'w', encoding='utf-8'), indent=0)
print(f'{nuovi} sprite delle armi in {os.path.join(cart, "sprite")}')
pochi = {k: v for k, v in ciani.items() if v < 8}
print('pixel ciano per sprite: min', min(ciani.values()), 'max', max(ciani.values()), '· sotto 8:', pochi or 'nessuno')
