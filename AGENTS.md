# L'Atelier di MAREA — regole per gli AI (Claude, Codex, Gemini…)

**Cos'è.** Il posto comune dove nascono e stanno i personaggi di MAREA: disegni, modelli in 5 viste, fogli generati, sprite a pixel, animazioni. Non è il gioco (`worldwidejack/marea`) e non è il banco delle prove (`worldwidejack/marea-prova-look`): qui si tiene **cosa è stato fatto, da chi, con che prompt, e cosa è approvato**. Online: **https://worldwidejack.github.io/marea-atelier/** (si aggiorna da solo a ogni push su `main`, ~1 minuto).

**Chi ci lavora.** Jack, Riccardo e Alberto (birbasan), ognuno col suo AI: noi 6 alla pari. Nessuno è il capo. Il gusto di un lavoro lo decide chi lo fa, con la sua persona; quello che vedono tutti (il protagonista, gli abitanti, lo stile comune) lo decidono le tre persone, 2 su 3 se non si è d'accordo. Gli AI dicono la loro preferenza col perché; «chiediamo a Jack» non è una risposta. Alle persone chiedi solo il cosa, con scelte A/B e immagini, mai domande aperte.

## Prima di generare qualsiasi cosa
1. `git pull`.
2. Leggi **`STILE.md`** (tutto: è corto) e la `scheda.json` del personaggio.
3. Allega al generatore **gli approvati della stessa vista** (il modello, il foglio a pixel della vista vicina): è questo che tiene i fogli coerenti, non le parole. Il generatore vede solo quello che gli alleghi.
4. Le quest aperte sono in `quest/`: se ne prendi una, scrivi il tuo nome nella riga `chi:` e fai push **prima** di cominciare, così gli altri lo sanno.

## Dove va cosa
```
personaggi/<id>/
  scheda.json      chi è (descrizione in inglese, identica in ogni prompt), misure, mosse, stato
  design/          il disegno scelto, le 5 viste, i fogli di confronto (JPG)
  fogli/           TUTTO quello che esce dal generatore, PNG a grandezza piena, anche i bocciati
  fogli/REGISTRO.md  una riga per foglio: data · chi · generatore · allegati · esito (ok / bocciato e perché)
  sprite/          gli sprite a pixel tagliati (<vista>_<mossa>_<n>.png + elenco.json): solo quelli approvati
  armi/            le mosse col bastone di ciano, già lette (presa, angolo, *_sopra.png)
quest/             i lavori aperti, uno per file
STILE.md           le regole del look, i numeri e cosa è già stato bocciato
strumenti/         galleria.py (la pagina online)
```
- `stato` nella scheda: `idea` → `in lavorazione` → `approvato` (o `riferimento`, come F3 della prova). Un personaggio è `approvato` quando le persone l'hanno visto e nessuno è contrario (o 2 su 3).
- I bocciati **non si cancellano**: restano in `fogli/` con il perché nel REGISTRO. Servono a non rifare gli stessi errori.
- Solo immagini (PNG, JPG, WEBP), JSON e testo. Mai segreti, token, link personali o dati personali: il repo è pubblico.

## Gli attrezzi
- **Gli script degli sprite** stanno nel repo del gioco, `marea/tools/sprite/` (prompt, genera, pixel, foglio, in_fenaki), con la ricetta completa nella skill `marea/.claude/skills/sprite-marea/SKILL.md`. Funzionano su una cartella di personaggio: dagli `personaggi/<id>` dell'Atelier.
- **Le armi a strati** (bastone di ciano → arma 3D in mano): ricetta e script nel banco, `marea-prova-look/CLAUDE.md`.
- **Fenaki** (`worldwidejack/fenaki`) per guardare un'animazione un disegno alla volta: la persona segna dove un passaggio scatta, tu leggi i segni (`giudizi`) e correggi. `in_fenaki.py` prepara la cartella. Su questi sprite non usare `teste`, `zampe` e i «doppioni» della diagnosi: sono tarati sul gatto di Matemagica.
- **La galleria**: `python3 strumenti/galleria.py` scrive `galleria.json`; in locale `python3 -m http.server` e apri http://localhost:8000. Online la rifà GitHub da solo.

## Come si lavora
- Si scrive direttamente su `main` (è un atelier di file, non c'è codice da rompere). Commit piccoli, un messaggio che dice cosa hai aggiunto. Mai `push --force`.
- Prima di dire «fatto»: apri il foglio e guardalo davvero (piedi, testa, colori, gambe unite nei disegni 2 e 4). Un generatore che risponde «ok» non prova niente.
- Italiano, corto, operativo con le persone. Prima le parole, poi i numeri.
