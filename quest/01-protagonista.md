# Il protagonista, da zero
stato: gradini 1-6 fatti e approvati dai tre (30/10/2026); manca solo il passo «nel banco prende il posto di F3» (il Borgo di prova di Riccardo e `marea-prova-look`)
chi: tutti e tre (Jack, Riccardo, Alberto) con i loro AI
cartella: personaggi/protagonista/

F3 ha vinto il voto sul look, ma era il personaggio di una prova. Il protagonista vero di MAREA lo rifacciamo insieme, da zero, ed è il primo personaggio dell'Atelier: da lui prendono le misure tutti gli altri (abitanti, mostri, boss).

## I gradini
Ogni gradino si guarda su immagini, mai a parole. Si passa al gradino dopo quando nessuno dei tre è contrario (o 2 su 3).

1. **Chi è.** Età, carattere, cosa fa nel mondo di MAREA, come si veste. Una frase a testa nel gruppo, poi la scheda (`scheda.json`, descrizione in inglese). Cosa teniamo di F3 e cosa no.
2. **Il disegno.** Ognuno dei tre fa generare 2-3 varianti (A/B/C) col proprio AI, con F3 accanto come metro dello stile. Tutte in `personaggi/protagonista/fogli/` con la riga nel REGISTRO. Si vota il disegno.
3. **Il modello in 5 viste** (davanti, 3/4 davanti, profilo, 3/4 dietro, dietro) dal disegno scelto: `viste.py` e `prompt.py --modello`.
4. **Giro 1**: le viste SE, E, NE a pixel, con la camminata. È il gradino che decide lo stile degli sprite.
5. **Giro 2**: le altre sei viste.
6. **Le mosse base**: camminata, scatto con capriola, pozione, le due impugnature col bastone di ciano (leggera, pesante), l'onda energetica. Come F3, ma sue.

## Fatto quando
Il protagonista ha 16 direzioni, le mosse base e le due impugnature, la `scheda.json` è `approvato`, e nel banco (`marea-prova-look`) prende il posto di F3.

## Cosa serve sapere
- Le regole e gli errori già fatti: `STILE.md`.
- Il riferimento di come deve venire: `personaggi/f3-prova/` (anche online nella galleria).
- La ricetta passo per passo: `marea/.claude/skills/sprite-marea/SKILL.md`.
