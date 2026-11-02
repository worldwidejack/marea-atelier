# Prompt dei fogli delle magie del viandante: <vista>_cammina-<mossa>-<mossa>.png, 4 colonne x (1 + mosse) righe
# (camminata come metro, poi le mosse). Come lavori_armi.py, ma senza arma di ciano: mani nude e nessun effetto, li disegna il gioco.
# Allegati: vista/e del modello (+ disegno nel giro 1), il foglio della camminata del viandante della STESSA vista (metro di pixel e testa),
# dal giro 2 lo stesso foglio di magia della vista vicina.
# Uso: python strumenti/lavori_magie.py personaggi/<id> <viste,...> [gruppi lancio,flusso] ["frase in più per un foglio da rifare"]
#   -> aggiorna lavori.txt (l'ultima riga per nome vince), poi <marea>/tools/sprite/genera.py personaggi/<id> <nomi> --paralleli 3.
# Le frasi delle mosse stanno in scheda.json (mosse missile, bomba, flusso). Serve il gioco accanto (../marea) o MAREA=<cartella>.
import json, os, sys
sys.path.insert(0, os.path.join(os.environ.get('MAREA') or os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'marea'), 'tools', 'sprite'))
from comune import VISTE, GIRO1, GIRO2, VISTE_MODELLO, PRONOMI
from prompt import STILE, DALL_ALTO, FRASE

# missile e bomba nello stesso foglio (due gesti diversi: orizzontale e a cupola); il flusso, a due mani, da solo
GRUPPI = {'lancio': ['cammina', 'missile', 'bomba'], 'flusso': ['cammina', 'flusso']}
cart = sys.argv[1]; viste = sys.argv[2].split(','); gruppi = (sys.argv[3] if len(sys.argv) > 3 else 'lancio,flusso').split(',')
s = json.load(open(os.path.join(cart, 'scheda.json'), encoding='utf-8'))
he, his = PRONOMI[s.get('pronome', 'he')]
desc = s['descrizione']
EXTRA = {
 'S': ' He faces STRAIGHT toward the viewer in every frame: the arms reach toward the viewer (drawn foreshortened, the hands big and near) but stay wide enough to show on both sides of the body, nothing turns sideways.',
 'SSE': ' The arms reach toward the viewer and a little to the right, both hands stay visible outside the body.',
 'N': ' He faces STRAIGHT away from the viewer in every frame: the arms reach away from the viewer, the hands stay visible beside the head and shoulders, nothing turns sideways.',
 'NNE': ' The arms reach away from the viewer and a little to the right, both hands stay visible beside the body.',
 'ESE': ' Keep this view exactly halfway between the two attached angles: a little of his chest and face toward the viewer, not a pure profile.',
 'ENE': ' Keep this view exactly halfway between the two attached angles: a little of his back toward the viewer, not a pure profile.',
}
righe = []
for v in viste:
    for g in gruppi:
        mosse = GRUPPI[g]; nome = f"{v}_{'-'.join(mosse)}"
        cammina = f'fogli/{v}_cammina-passo1-passo2.png'
        frase = FRASE[v].format(he=he, his=his)
        if v in GIRO1:
            rif = [s['viste'][v], s['modello'], cammina]
            view = f'VIEW: {frase}, {DALL_ALTO} (the FIRST image shows this view).'
            chi = ('Three images are attached. The FIRST image is the character seen from the needed angle, the SECOND image is the '
                   f'approved character design: copy EXACTLY the same character ({desc}). The THIRD image is the approved pixel art '
                   'WALK sheet of this SAME character from this SAME view: match EXACTLY its pixel size, palette, outline, proportions '
                   'and head size; row 1 of the new sheet repeats its first row.')
        else:
            da, vicina = GIRO2[v]
            vicino = f"fogli/{vicina}_{'-'.join(mosse)}.png"
            rif = [s['viste'][x] for x in da] + [cammina, vicino]
            view = f'VIEW: {frase}, {DALL_ALTO}.'
            n = len(da)
            chi = (f'Attached images: the first {"two images show" if n == 2 else "image shows"} the character from the angle(s) named '
                   f'above; then the approved pixel art WALK sheet of this SAME character from this SAME view: copy EXACTLY the same '
                   f'character ({desc}) and match EXACTLY its pixel size, palette, outline, proportions and head size (row 1 of the new '
                   f'sheet repeats its first row); the LAST image is the approved sheet of these SAME {len(mosse)} rows from a nearby angle: '
                   'copy its poses, timing and gestures, only turned to this view.')
        for r in rif:
            assert os.path.exists(os.path.join(cart, r)), (nome, r)
        righe_n = len(mosse)
        layout = (f'LAYOUT: one image, a grid of 4 columns x {righe_n} rows = {4 * righe_n} frames on a flat pure magenta background #FF00FF (no floor, no '
                  'shadow, no text, no grid lines), each frame the same size, the character the same size in every frame and his feet '
                  'on the same baseline in every cell of a row, nothing touching the cell borders, the whole figure with his arms and hair '
                  'inside its own cell, a wide empty magenta gap between the rows (no hair, hand or foot crosses into another row) and a '
                  'wide empty magenta margin below the last row.')
        rows = ' '.join(f'ROW {i} = {s["mosse"][m]}.' for i, m in enumerate(mosse, 1))
        fine = f'All {4 * righe_n} frames in the SAME view and the same pixel scale.' + EXTRA.get(v, '') + (' ' + sys.argv[4] if len(sys.argv) > 4 else '')
        righe.append(f"{nome}|{','.join(rif)}|{' '.join([STILE, view, chi, layout, rows, fine])}")
p = os.path.join(cart, "lavori.txt")
vecchie = {}
if os.path.exists(p):
    for r in open(p, encoding='utf-8').read().splitlines():
        if r.strip(): vecchie[r.split('|')[0]] = r
for r in righe: vecchie[r.split('|')[0]] = r
open(p, 'w', encoding='utf-8').write('\n'.join(vecchie.values()) + '\n')
print(len(righe), 'fogli:', ' '.join(r.split('|')[0] for r in righe))
