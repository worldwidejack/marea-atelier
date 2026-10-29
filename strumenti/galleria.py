"""La galleria dell'Atelier: legge personaggi/ e quest/ e scrive galleria.json, che index.html mostra.

Solo libreria standard (gira anche su GitHub a ogni push). Uso: python3 strumenti/galleria.py
"""
import json
import re
from datetime import datetime, timezone
from pathlib import Path

QUI = Path(__file__).resolve().parent.parent
IMMAGINI = {'.png', '.jpg', '.jpeg', '.webp'}
# l'ordine delle viste disegnate, da davanti a dietro passando da destra
VISTE = ['S', 'SSE', 'SE', 'ESE', 'E', 'ENE', 'NE', 'NNE', 'N']
NOME = re.compile(r'^(?P<vista>[NSE]{1,3})_(?P<mossa>[a-z]+)_(?P<n>\d+)(?P<sopra>_sopra)?\.png$')


def immagini(cartella):
    if not cartella.is_dir():
        return []
    return sorted(str(f.relative_to(QUI)) for f in cartella.iterdir() if f.suffix.lower() in IMMAGINI)


def mosse(cartella):
    """{mossa: {vista: [disegno, …]}} dai file <vista>_<mossa>_<n>.png, coi dati di elenco.json (ancora, presa, angolo)."""
    if not cartella.is_dir():
        return {}
    elenco = {}
    if (cartella / 'elenco.json').exists():
        elenco = json.loads((cartella / 'elenco.json').read_text(encoding='utf-8'))
    tutte = {}
    for f in sorted(cartella.glob('*.png')):
        m = NOME.match(f.name)
        if not m or m['sopra']:
            continue
        chiave = f.stem
        d = elenco.get(chiave, {})
        disegno = {'src': str(f.relative_to(QUI)), 'n': int(m['n']), 'ax': d.get('ax'), 'ay': d.get('ay')}
        if 'presa' in d:
            disegno.update(presa=d['presa'], ang=d.get('ang'), lungo=d.get('lungo'))
        sopra = cartella / f'{chiave}_sopra.png'
        if sopra.exists():
            disegno['sopra'] = str(sopra.relative_to(QUI))
        tutte.setdefault(m['mossa'], {}).setdefault(m['vista'], []).append(disegno)
    for viste in tutte.values():
        for disegni in viste.values():
            disegni.sort(key=lambda d: d['n'])
    return {m: {v: viste[v] for v in VISTE if v in viste} for m, viste in tutte.items()}


def personaggio(cartella):
    scheda = {}
    if (cartella / 'scheda.json').exists():
        scheda = json.loads((cartella / 'scheda.json').read_text(encoding='utf-8'))
    return {
        'id': cartella.name,
        'nome': scheda.get('nome', cartella.name),
        'stato': scheda.get('stato', 'idea'),
        'nota': scheda.get('nota', ''),
        'descrizione': scheda.get('descrizione', ''),
        'alto': scheda.get('alto'),
        'design': immagini(cartella / 'design'),
        'fogli': immagini(cartella / 'fogli'),
        'mosse': mosse(cartella / 'sprite'),
        'armi': mosse(cartella / 'armi'),
    }


def quest(f):
    righe = f.read_text(encoding='utf-8').splitlines()
    titolo = next((r[2:] for r in righe if r.startswith('# ')), f.stem)
    campi = dict(re.match(r'^(stato|chi|cartella):\s*(.*)$', r).groups() for r in righe if re.match(r'^(stato|chi|cartella):', r))
    # il primo paragrafo dopo i campi
    testo, dentro = [], False
    for r in righe[1:]:
        if re.match(r'^(stato|chi|cartella):', r):
            continue
        if r.strip() and not r.startswith('#'):
            testo.append(r.strip()); dentro = True
        elif dentro:
            break
    return {'file': str(f.relative_to(QUI)), 'titolo': titolo, 'stato': campi.get('stato', 'aperta'), 'chi': campi.get('chi', ''), 'testo': ' '.join(testo)}


def main():
    dati = {
        'aggiornato': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
        'quest': [quest(f) for f in sorted((QUI / 'quest').glob('*.md'))],
        'personaggi': [personaggio(c) for c in sorted((QUI / 'personaggi').iterdir()) if c.is_dir()],
    }
    (QUI / 'galleria.json').write_text(json.dumps(dati, ensure_ascii=False, indent=1), encoding='utf-8')
    n = sum(len(d) for p in dati['personaggi'] for k in ('mosse', 'armi') for v in p[k].values() for d in v.values())
    print(f"galleria.json: {len(dati['personaggi'])} personaggi, {len(dati['quest'])} quest, {n} disegni nelle mosse")


if __name__ == '__main__':
    main()
