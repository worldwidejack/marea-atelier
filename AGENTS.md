# L'Atelier di MAREA — regole per gli AI (Claude, Codex, Gemini…)

## Il protagonista ufficiale — leggi questo per primo
**Il protagonista di MAREA è «Il protagonista (PixelLab di Jack)»: la cartella `personaggi/protagonista-pixellab/`. Solo lui. Deciso da Riccardo il 12/11/2026.**
- «Il protagonista», «il PG», «l'eroe», «il personaggio principale» vogliono dire **sempre** `personaggi/protagonista-pixellab/`. Non chiedere quale.
- Ogni cosa nuova del protagonista (corsa, attacco, magia, armi, viste) si fa lì dentro, partendo dalle sue direzioni ferme (`fogli/pixellab/direzioni/`), dai suoi sprite (`sprite/`) e dalla sua `scheda.json`. Regole fisse: tela 64×64, figura alta 58 px, pixel art vera, palette dell'`ART_BIBLE`; viste disegnate S, SE, E, NE, N, le altre 3 sono lo specchio.
- **Tutti gli altri personaggi sono «Storico idee»**: idee e prove superate, **non canone**. Non si allegano come riferimento d'aspetto, non si estendono con mosse o viste nuove, non si portano nel gioco (il banco di prova va bene per guardarli). Nella scheda hanno `"stato": "storico"`, nella cartella un file `STORICO.md`; nella galleria stanno nel menù «Storico idee», chiuso e non caricato finché non lo apri.
- **Attenzione ai nomi, ci si sbaglia facilmente.** `protagonista` (Quest 1), `protagonista-lino` (ha la stessa camicia di lino e lo stesso zaino, ma è la versione Codex a 48 px), `f3-prova`, `scugnizzo`, `viandante` **non sono** il protagonista ufficiale. Lo è solo `protagonista-pixellab`.
- **Come verificare:** `"ufficiale": true` e `"ruolo": "protagonista"` stanno nella scheda di **una sola** cartella di `personaggi/`; `personaggi/LEGGIMI.md` ha l'elenco. `strumenti/galleria.py` si ferma con un errore se i protagonisti ufficiali non sono esattamente uno.
- **Prima di toccare una cartella di `personaggi/`**, controlla che sia `protagonista-pixellab`. Se è un'altra, ferma e di' alla persona quale (nome della cartella + una riga). Lo storico si tocca solo se la persona lo chiede per nome.
- Riprendere un'idea dallo storico serve la decisione delle tre persone (2 su 3): si scrive qui e nella scheda, poi si toglie `storico`. Mai di iniziativa di un AI.

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
personaggi/<id>/   chi ha una faccia (giocatori, abitanti, mostri, boss): sprite a pixel. In pagina c'è solo chi ha "ufficiale": true (oggi il protagonista); il resto è lo Storico idee (vedi sopra)
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
- per i personaggi fatti con gli script degli sprite: anche `modello/` (la sagoma e le 5 viste) e `lavori.txt` (i prompt); `controllo/` (il banco di Fenaki) resta sul computer.

`stato`: `idea` → `in lavorazione` → `approvato` (o `riferimento`, come le cose della prova dei look; o `storico`: idea o prova superata, non canone, per i personaggi che non sono il protagonista ufficiale). Approvato = le persone l'hanno visto e nessuno è contrario (o 2 su 3). I bocciati **non si cancellano**: restano in `fogli/` col perché nel REGISTRO, servono a non rifare gli stessi errori.
Solo immagini (PNG, JPG, WEBP), modelli GLB, JSON e testo. Mai segreti, token, link personali o dati personali: il repo è pubblico.

## Gli attrezzi
- **Sprite dei personaggi**: gli script stanno nel repo del gioco, `marea/tools/sprite/` (prompt, genera, pixel, foglio, in_fenaki), con la ricetta nella skill `marea/.claude/skills/sprite-marea/SKILL.md`. Funzionano su una cartella: dagli `personaggi/<id>`.
- **Provare gli sprite nel Borgo vero** (accanto all'avatar 3D, telefono e finestra larga, foto e fogli A/B): il banco in `strumenti/banco-borgo/` (`LEGGIMI.md`). `node strumenti/banco-borgo/installa.mjs <cartella-del-gioco>` lo mette nel tuo checkout di `marea` senza toccare git. **Se la persona ti chiede di provare uno sprite (o il suo personaggio) nel Borgo, fallo tu:** i passi sono in `strumenti/banco-borgo/LEGGIMI.md`, sezione «Da zero» (clone del gioco, `npm install`, `installa.mjs`, `npm run dev`, link da aprire). Dille il link pronto e che il caricamento dura 30-60 s.
- **Armi a strati** (bastone di ciano → arma 3D in mano): ricetta e script nel banco, `marea-prova-look/CLAUDE.md`.
- **Modelli 3D dai disegni**: la catena della prova dei look (in `marea-prova-look/strumenti/`: `ritaglia_3d.py`, `senza_bordo.py`, `blender_modello.py`, `giro_modello.py`); le lezioni sono in `STILE.md`.
- **Fenaki** (`worldwidejack/fenaki`) per guardare un'animazione un disegno alla volta: la persona segna dove un passaggio scatta, tu leggi i segni (`giudizi`) e correggi. `in_fenaki.py` prepara la cartella. Sugli sprite non usare `teste`, `zampe` e i «doppioni» della diagnosi: sono tarati sul gatto di Matemagica.
- **La galleria**: `python3 strumenti/galleria.py` scrive `galleria.json`; per vederla in locale serve un server qualsiasi nella cartella (es. `python3 -m http.server`). Online la rifà GitHub da solo. Una stanza o un campo nuovo: `strumenti/galleria.py` e `index.html`.

## Come si lavora
- Si scrive direttamente su `main` (è un atelier di file, non c'è codice da rompere). Commit piccoli, un messaggio che dice cosa hai aggiunto. Mai `push --force`.
- Prima di dire «fatto»: apri il foglio o il modello e guardalo davvero. Un generatore che risponde «ok» non prova niente.
- Italiano, corto, operativo con le persone. Prima le parole, poi i numeri.
