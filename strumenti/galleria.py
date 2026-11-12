"""La galleria dell'Atelier: legge le cartelle del mondo (personaggi, modelli, luoghi, effetti, riferimenti) e quest/,
e scrive galleria.json, che index.html mostra.

Personaggi: nella pagina principale c'è solo chi ha "ufficiale": true nella scheda (oggi il protagonista, una sola cartella).
Tutti gli altri sono lo «Storico idee»: vanno in galleria-storico.json, che la pagina scarica solo quando si apre il menù.
Se non c'è esattamente un protagonista ufficiale ("ruolo": "protagonista" e "ufficiale": true) la galleria non si rifà.

Solo libreria standard (gira anche su GitHub a ogni push). Uso: python3 strumenti/galleria.py
"""
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

QUI = Path(__file__).resolve().parent.parent
IMMAGINI = {'.png', '.jpg', '.jpeg', '.webp'}
# le stanze dell'Atelier, nell'ordine della pagina
CATEGORIE = ['personaggi', 'modelli', 'luoghi', 'effetti', 'riferimenti']
# l'ordine delle viste disegnate, da davanti a dietro passando da destra
VISTE = ['S', 'SSE', 'SE', 'ESE', 'E', 'ENE', 'NE', 'NNE', 'N']
NOME = re.compile(r'^(?P<vista>[NSE]{1,3})_(?P<mossa>[a-z]+)_(?P<n>\d+)(?P<sopra>_sopra)?\.png$')


def immagini(cartella):
    if not cartella.is_dir():
        return []
    return sorted(f.relative_to(QUI).as_posix() for f in cartella.iterdir() if f.suffix.lower() in IMMAGINI)


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
        disegno = {'src': f.relative_to(QUI).as_posix(), 'n': int(m['n']), 'ax': d.get('ax'), 'ay': d.get('ay')}
        if 'presa' in d:
            disegno.update(presa=d['presa'], ang=d.get('ang'), lungo=d.get('lungo'))
        sopra = cartella / f'{chiave}_sopra.png'
        if sopra.exists():
            disegno['sopra'] = sopra.relative_to(QUI).as_posix()
        tutte.setdefault(m['mossa'], {}).setdefault(m['vista'], []).append(disegno)
    for viste in tutte.values():
        for disegni in viste.values():
            disegni.sort(key=lambda d: d['n'])
    return {m: {v: viste[v] for v in VISTE if v in viste} for m, viste in tutte.items()}


def voce(cartella, categoria):
    """Un pezzo del mondo: la sua scheda e quello che c'è nella sua cartella."""
    scheda = {}
    if (cartella / 'scheda.json').exists():
        scheda = json.loads((cartella / 'scheda.json').read_text(encoding='utf-8'))
    return {
        'id': cartella.name,
        'categoria': categoria,
        'tipo': scheda.get('tipo', categoria),
        'nome': scheda.get('nome', cartella.name),
        'stato': scheda.get('stato', 'idea'),
        'ufficiale': scheda.get('ufficiale') is True,
        'ruolo': scheda.get('ruolo', ''),
        'nota': scheda.get('nota', ''),
        'descrizione': scheda.get('descrizione', ''),
        'generatore': scheda.get('generatore', ''),
        'link': scheda.get('link', ''),
        'alto': scheda.get('alto'),
        'copertina': immagini(cartella)[:1],
        'design': immagini(cartella / 'design') + [m for m in immagini(cartella / 'modello') if not m.endswith('.png')],
        'disegni': immagini(cartella / 'disegni'),
        'fogli': immagini(cartella / 'fogli'),
        'modelli': sorted(f.relative_to(QUI).as_posix() for f in cartella.glob('*.glb')),
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
    return {'file': f.relative_to(QUI).as_posix(), 'titolo': titolo, 'stato': campi.get('stato', 'aperta'), 'chi': campi.get('chi', ''), 'testo': ' '.join(testo)}


def main():
    ora = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    categorie = {c: [voce(d, c) for d in sorted((QUI / c).iterdir()) if d.is_dir()] if (QUI / c).is_dir() else [] for c in CATEGORIE}
    # personaggi: solo gli ufficiali in pagina, il resto è lo Storico idee (file a parte, caricato su richiesta)
    ufficiali = [p for p in categorie['personaggi'] if p['ufficiale']]
    storico = [p for p in categorie['personaggi'] if not p['ufficiale']]
    protagonisti = [p['id'] for p in ufficiali if p['ruolo'] == 'protagonista']
    if len(protagonisti) != 1:
        sys.exit("ERRORE: ci vuole ESATTAMENTE UN protagonista ufficiale (scheda con \"ruolo\": \"protagonista\" e \"ufficiale\": true), "
                 f"ne ho trovati {len(protagonisti)}: {protagonisti}. Leggi CLAUDE.md, «Il protagonista ufficiale».")
    for p in storico:
        if p['stato'] != 'storico':
            print(f"ATTENZIONE: personaggi/{p['id']} non è ufficiale ma ha stato «{p['stato']}»: finisce nello Storico idee: metti \"stato\": \"storico\" nella scheda.")
    categorie['personaggi'] = ufficiali
    dati = {
        'aggiornato': ora,
        'quest': [quest(f) for f in sorted((QUI / 'quest').glob('*.md'))],
        'storico': {'file': 'galleria-storico.json', 'n': len(storico)},
        'categorie': categorie,
    }
    (QUI / 'galleria.json').write_text(json.dumps(dati, ensure_ascii=False, indent=1), encoding='utf-8')
    (QUI / 'galleria-storico.json').write_text(json.dumps({'aggiornato': ora, 'personaggi': storico}, ensure_ascii=False, indent=1), encoding='utf-8')
    conta = ', '.join(f'{len(v)} {c}' for c, v in dati['categorie'].items())
    print(f"galleria.json: {conta}, {len(dati['quest'])} quest; protagonista ufficiale: {protagonisti[0]}; galleria-storico.json: {len(storico)} personaggi")


if __name__ == '__main__':
    main()
