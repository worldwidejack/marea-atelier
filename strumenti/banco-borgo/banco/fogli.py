"""Banco usa-e-getta: mette insieme gli screenshot in fogli da guardare (A/B e giro delle viste). Uso: fogli.py <set>"""
import glob
import os
import sys

from PIL import Image, ImageDraw, ImageFont

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'tests', 'out', 'banco-sprite')
SET = sys.argv[1] if len(sys.argv) > 1 else 'f3'


def font(n):
    for f in ('arial.ttf', 'C:/Windows/Fonts/arial.ttf'):
        try:
            return ImageFont.truetype(f, n)
        except OSError:
            pass
    return ImageFont.load_default()


def ab(formato, nome):
    a = f'{OUT}/banco_{SET}_elenco_{formato}_{nome}.png'
    b = f'{OUT}/banco_{SET}_avatar_{formato}_{nome}.png'
    if not (os.path.exists(a) and os.path.exists(b)):
        return
    ia, ib = Image.open(a).convert('RGB'), Image.open(b).convert('RGB')
    gap, top = 12, 64
    W = ia.width + ib.width + gap * 3
    H = max(ia.height, ib.height) + top + gap
    fg = Image.new('RGB', (W, H), (24, 22, 30))
    d = ImageDraw.Draw(fg)
    d.text((gap, 10), 'A · come disegnato: 48 px = 2,5 unita (lo sprite e piu alto del 3D)', fill=(244, 227, 193), font=font(18))
    d.text((ia.width + gap * 2, 10), 'B · alto come il 3D: 1,84 unita (stessa statura)', fill=(244, 227, 193), font=font(18))
    d.text((gap, 36), 'a sinistra lo sprite, a destra il personaggio 3D di oggi', fill=(160, 150, 170), font=font(15))
    fg.paste(ia, (gap, top)); fg.paste(ib, (ia.width + gap * 2, top))
    out = f'{OUT}/AB_scala_{SET}_{formato}_{nome}.png'
    fg.save(out)
    print(out, fg.size)


def giro(scala='avatar', formato='tel'):
    fs = sorted(glob.glob(f'{OUT}/banco_{SET}_{scala}_{formato}_giro_*.png'))
    if not fs:
        return
    ims = [Image.open(f).convert('RGB') for f in fs]
    w, h = ims[0].size
    cols = 4
    rows = (len(ims) + cols - 1) // cols
    fg = Image.new('RGB', (cols * w, rows * (h + 28)), (24, 22, 30))
    d = ImageDraw.Draw(fg)
    for i, im in enumerate(ims):
        x, y = (i % cols) * w, (i // cols) * (h + 28)
        fg.paste(im, (x, y + 28))
        d.text((x + 8, y + 5), f'camera a {i * 45} gradi', fill=(244, 227, 193), font=font(16))
    out = f'{OUT}/giro_{SET}_{formato}.png'
    fg.save(out)
    print(out, fg.size)


for fm in ('tel', 'largo'):
    for n in ('accanto_cammina_a', 'accanto_cammina_b', 'accanto_fermi'):
        ab(fm, n)
giro()


def confronto(nome='giro_090', scala='avatar', formato='tel'):
    """Lo stesso Borgo, la stessa vista (SE per tutti e due): lo sprite di Riccardo (ChatGPT) e quello di Jack (Codex)."""
    a = f'{OUT}/banco_riccardo_{scala}_{formato}_{nome}.png'
    b = f'{OUT}/banco_f3_{scala}_{formato}_{nome}.png'
    if not (os.path.exists(a) and os.path.exists(b)):
        return
    ia, ib = Image.open(a).convert('RGB'), Image.open(b).convert('RGB')
    gap, top = 12, 64
    fg = Image.new('RGB', (ia.width + ib.width + gap * 3, max(ia.height, ib.height) + top + gap), (24, 22, 30))
    d = ImageDraw.Draw(fg)
    d.text((gap, 10), 'A · il foglio di Riccardo (ChatGPT gratis)', fill=(244, 227, 193), font=font(18))
    d.text((ia.width + gap * 2, 10), 'B · F3 di Jack (Codex)', fill=(244, 227, 193), font=font(18))
    d.text((gap, 36), 'stessa vista (SE), stessa scala (alti come il 3D), 3D a destra', fill=(160, 150, 170), font=font(15))
    fg.paste(ia, (gap, top)); fg.paste(ib, (ia.width + gap * 2, top))
    out = f'{OUT}/AB_chi_{formato}_{nome}.png'
    fg.save(out)
    print(out, fg.size)


if SET == 'riccardo':
    confronto()
