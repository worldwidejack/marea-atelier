# Lo stile dei personaggi di MAREA

> Da leggere prima di generare. Quando il protagonista definitivo è approvato (quest 1), le misure si aggiornano su di lui; fino ad allora il metro è F3 della prova dei look (`personaggi/f3-prova/`).

## Il look, in una riga
**Mondo 3D che sembra disegnato, personaggi 2.5D in pixel art** (voto del gruppo, 28/10/2026). Chi ha una faccia (giocatori, abitanti, mostri, boss) è a sprite; le cose e le macchine sono 3D, come alberi ed edifici.

## I numeri
- **16 direzioni**: 9 viste disegnate (S, SSE, SE, ESE, E, ENE, NE, NNE, N), le altre 7 sono lo specchio e le fa il gioco.
- **4 disegni per mossa e per vista** → **36 disegni per mossa**. La camminata fa anche da posa ferma (disegno 2, gambe unite).
- Protagonista alto **48 px** in piedi. F3: testa grande, circa il **45 %** dell'altezza coi capelli, corpo corto. Proporzioni da gioco cartoon, mai da vita vera.
- **Armi a strati**: il personaggio si disegna con un bastone di ciano puro `#00FFFF` al posto dell'arma, il gioco ci mette l'arma 3D. Un'arma nuova = 0 disegni; un'impugnatura nuova = 36 disegni per mossa. Le impugnature oggi sono 2: leggera nel pugno, pesante in spalla.
- **Armature e vestiti**: lo stesso pezzo in un altro materiale è un cambio di tavolozza (0 disegni). Una sagoma diversa costa 36 disegni per ogni mossa: poche, 2-3.

## La pixel art
- Pixel grossi e netti: niente sfumature, niente anti-aliasing, niente gradienti lisci.
- Contorno scuro di 1 pixel.
- Una tavolozza piccola per personaggio, la stessa in tutte le viste (`sprite/tavolozza.json`, la tiene `pixel.py`). Colori di MAREA: la tabella dell'Art Bible, `marea/docs/ART_BIBLE.md` §2.
- Fondo magenta pieno `#FF00FF` nei fogli: niente pavimento, ombre, scritte o griglie.

## Come si chiede al generatore (lezioni pagate)
- **Una vista per foglio**, 4 colonne × una riga per mossa, la camminata sempre nella prima riga (fa da metro per altezza e piedi). Al massimo 3 mosse per foglio.
- **La cosa più importante va in testa al prompt.** La testa grande Codex l'ha rispettata solo quando la frase della testa era la prima.
- **Le dosi a parole**: «VERY BIG», «HUGE» → esagera (teste al 49 % invece che al 38-43). «a little MORE than one third (38 %)», «a little LESS than half (43 %)» vengono giuste a ±3 punti.
- **Camminata**: «passing pose with the legs together» nei disegni 2 e 4, sennò da fermo resta a metà passo.
- **Allega il foglio a pixel approvato della stessa vista**: con quello Codex ha fatto 9 fogli su 9 buoni al primo colpo.
- Spazio vuoto fra le righe: il generatore fa salire i capelli nella riga sopra.

## Generatori
- **Codex / ChatGPT**: è quello che funziona (108 sprite di F3 e le 3 mosse delle armi, buoni al primo colpo). Codex in automatico (`genera.py`), ChatGPT a mano (`prompt.py --stampa`) anche coi crediti gratuiti del giorno.
- **Gemini**: bocciato per le mosse (prova di Riccardo, 29/10). Colori, proporzioni e pixel quasi a posto, ma le pose no: camminata con 4 disegni quasi uguali e gambe mai unite, capriola senza preparazione né atterraggio, la boccetta che cambia forma a ogni disegno. Anche col foglio approvato allegato.
- **Un personaggio, un generatore**: un personaggio nato con Codex si finisce con Codex.

## Già bocciato (non si rifà)
- Cartoon «da bambini» e i giocattoli alla Roblox / Fall Guys. Piacciono: Sunny Trails, Oh My Doug, Cuphead.
- Disegnare sopra forme fatte da codice: prima il disegno approvato, poi le viste.
- Più viste nello stesso foglio (le proporzioni scappano).
- Il 2.5D tutto disegnato (anche il mondo) e il personaggio 3D da vicino «impastato».
- Scritte tutte maiuscole nella UI; i font Titan, Fredoka, Nunito.

## Il controllo, prima di farlo vedere
1. I piedi toccano la linea di terra della riga.
2. La testa ha la stessa taglia in tutte le viste e in tutti i disegni; i capelli interi.
3. Gli stessi colori girando (stessa maglietta, stesse scarpe nelle 9 viste).
4. Camminata: 2 e 4 a gambe unite, il giro 4 → 1 non scatta.
5. Il giro delle 16 direzioni: la sagoma cambia a poco a poco, nessuna vista «di un altro artista».
