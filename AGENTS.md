# L'Atelier di MAREA — regole per gli AI (Claude, Codex, Gemini…)

**Cos'è.** Il posto comune dove nasce il mondo di MAREA: personaggi, modelli 3D (edifici, alberi, oggetti, texture), luoghi, effetti, riferimenti. Tutto il world building, non solo i personaggi. Qui si tiene **cosa è stato fatto, da chi, con che generatore e che prompt, e cosa è approvato**, così ogni AI lavora nello stesso stile. Non è il gioco (`worldwidejack/marea`: lì entra quello che è approvato) e non è il banco delle prove (`worldwidejack/marea-prova-look`: lì si prova come rende nel motore).
Online: **https://worldwidejack.github.io/marea-atelier/** (si rifà da solo a ogni push su `main`, ~1 minuto).

**Chi ci lavora.** Jack, Riccardo e Alberto (birbasan), ognuno col suo AI: noi 6 alla pari. Nessuno è il capo. Il gusto di un lavoro lo decide chi lo fa, con la sua persona; quello che vedono tutti (il protagonista, lo stile comune, un'isola) lo decidono le tre persone, 2 su 3 se non si è d'accordo. Gli AI dicono la loro preferenza col perché; «chiediamo a Jack» non è una risposta. Alle persone chiedi solo il cosa, con scelte A/B e immagini, mai domande aperte.

## Prima di generare qualsiasi cosa
1. `git pull`.
2. Leggi **`STILE.md`** (è corto) e la `scheda.json` del pezzo su cui lavori. Se è nuovo, guarda prima gli approvati della stessa stanza (la galleria, filtrata).
3. Allega al generatore **gli approvati più vicini** (lo stesso personaggio nella vista vicina, un edificio dello stesso luogo): è questo che tiene tutto coerente, non le parole. Il generatore vede solo quello che gli alleghi. Le cose in `riferimenti/` non si allegano come se fossero nostre: si citano a parole.
4. Le quest aperte sono in `quest/`: se ne prendi una, scrivi il tuo nome nella riga `chi:` e fai push **prima** di cominciare, così gli altri lo sanno.

## Dove va cosa
```
personaggi/<id>/   chi ha una faccia (giocatori, abitanti, mostri, boss): sprite a pixel in 16 direzioni
modelli/<id>/      le cose 3D: edifici, alberi, rocce, oggetti, barche (disegno → modello, texture dipinte)
luoghi/<id>/       isole, zone, posti: il kit dei disegni, la mappa, i fogli di com'è venuto
effetti/<id>/      onde, fulmini, evocazioni, polvere
riferimenti/<id>/  cose di altri che ci piacciono: si studiano, non sono canone
quest/             i lavori aperti, uno per file
```
Dentro ogni cartella, quello che serve:
- `scheda.json` — sempre: `nome`, `tipo`, `stato`, `nota` (cos'è e perché, in italiano); per i personaggi anche `descrizione` in inglese (identica in ogni prompt), `alto`, `mosse`; per i modelli `alto` in metri e `generatore`.
- il disegno da cui nasce (`disegno.webp`/`.png` nella cartella) e `design/` per i fogli di confronto (JPG);
- `fogli/` — **tutto** quello che esce dal generatore, a grandezza piena, anche i bocciati, con `fogli/REGISTRO.md`: una riga per foglio, data · chi · generatore · allegati · esito (ok / bocciato e perché);
- `disegni/` — un kit di disegni singoli (gli oggetti di un luogo);
- `modello.glb` — il modello 3D finito (quello che va nel gioco);
- `sprite/`, `armi/` — gli sprite a pixel tagliati (`<vista>_<mossa>_<n>.png` + `elenco.json`), solo gli approvati.

`stato`: `idea` → `in lavorazione` → `approvato` (o `riferimento`, come le cose della prova dei look). Approvato = le persone l'hanno visto e nessuno è contrario (o 2 su 3). I bocciati **non si cancellano**: restano in `fogli/` col perché nel REGISTRO, servono a non rifare gli stessi errori.
Solo immagini (PNG, JPG, WEBP), modelli GLB, JSON e testo. Mai segreti, token, link personali o dati personali: il repo è pubblico.

## Gli attrezzi
- **Sprite dei personaggi**: gli script stanno nel repo del gioco, `marea/tools/sprite/` (prompt, genera, pixel, foglio, in_fenaki), con la ricetta nella skill `marea/.claude/skills/sprite-marea/SKILL.md`. Funzionano su una cartella: dagli `personaggi/<id>`.
- **Armi a strati** (bastone di ciano → arma 3D in mano): ricetta e script nel banco, `marea-prova-look/CLAUDE.md`.
- **Modelli 3D dai disegni**: la catena della prova dei look (in `marea-prova-look/strumenti/`: `ritaglia_3d.py`, `senza_bordo.py`, `blender_modello.py`, `giro_modello.py`); le lezioni sono in `STILE.md`.
- **Fenaki** (`worldwidejack/fenaki`) per guardare un'animazione un disegno alla volta: la persona segna dove un passaggio scatta, tu leggi i segni (`giudizi`) e correggi. `in_fenaki.py` prepara la cartella. Sugli sprite non usare `teste`, `zampe` e i «doppioni» della diagnosi: sono tarati sul gatto di Matemagica.
- **La galleria**: `python3 strumenti/galleria.py` scrive `galleria.json`; per vederla in locale serve un server qualsiasi nella cartella (es. `python3 -m http.server`). Online la rifà GitHub da solo. Una stanza o un campo nuovo: `strumenti/galleria.py` e `index.html`.

## Come si lavora
- Si scrive direttamente su `main` (è un atelier di file, non c'è codice da rompere). Commit piccoli, un messaggio che dice cosa hai aggiunto. Mai `push --force`.
- Prima di dire «fatto»: apri il foglio o il modello e guardalo davvero. Un generatore che risponde «ok» non prova niente.
- Italiano, corto, operativo con le persone. Prima le parole, poi i numeri.
