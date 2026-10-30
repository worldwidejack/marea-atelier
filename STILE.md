# Lo stile di MAREA

> Da leggere prima di generare qualsiasi cosa: personaggi, modelli 3D, luoghi, effetti. Quando il protagonista definitivo è approvato (quest 1), le misure dei personaggi si aggiornano su di lui; fino ad allora il metro è F3 della prova dei look (`personaggi/f3-prova/`), e per il mondo il porto «nero 1» (`luoghi/porto-nero-1/`).

## Il look, in una riga
**Mondo 3D che sembra disegnato, personaggi 2.5D in pixel art** (voto del gruppo, 28/10/2026). Chi ha una faccia (giocatori, abitanti, mostri, boss) è a sprite; le cose e le macchine sono 3D, come alberi ed edifici.

## Il mondo (modelli 3D e luoghi)
- **Prima il disegno, poi il modello.** Ogni cosa 3D nasce da un disegno nello stile del luogo (il porto: «nero 1», contorni neri, via di mezzo fra i giri 1-4 della moodboard). Il disegno sta nella cartella del modello.
- **I modelli si dipingono e texturizzano**: texture dipinte, luce vera, oggetti piccoli. Proporzioni da gioco cartoon, mai da vita vera.
- **Mondo pulito**: tinte unite con le sole forme grandi (assi, mattoni, ciottoli), niente puntini di rumore. Niente sfocatura né tilt-shift.
- **Cosa è 3D**: edifici, alberi, palme, lampioni, rocce, barche e ogni oggetto non tondo dove si passa (con la camera che gira, un disegno piatto si vede di cartone). Restano disegni solo gli oggetti piccoli e tondi.
- **Dal disegno al modello** (prova dei look): SAM 3 (1 credito, fedele al disegno) è meglio di Hunyuan per edifici, palme, lampioni, rocce. Gli alberi tondi col contorno nero spesso SAM 3 li fa piatti come adesivi: togli prima il contorno (`senza_bordo.py`). SAM 3 non sa da che lato guardava il disegno: il giro giusto lo trova `giro_modello.py`. Poi Blender: `blender_modello.py --alto H --liscio --base --tri 3500-4000`.
- **Crediti**: Higgsfield non si ricarica («non intendo pagare higgsfield più di così», Jack 28/10): generatori gratis, crediti del mese, kit CC0 ridipinti.

## I personaggi: i numeri
- **16 direzioni**: 9 viste disegnate (S, SSE, SE, ESE, E, ENE, NE, NNE, N), le altre 7 sono lo specchio e le fa il gioco.
- **4 disegni per mossa e per vista** → **36 disegni per mossa**. La camminata fa anche da posa ferma (disegno 2, gambe unite).
- Protagonista alto **48 px** in piedi. F3: testa grande, circa il **45 %** dell'altezza coi capelli, corpo corto. Proporzioni da gioco cartoon, mai da vita vera.
- **Armi a strati**: il personaggio si disegna con un bastone di ciano puro `#00FFFF` al posto dell'arma, il gioco ci mette l'arma 3D. Un'arma nuova = 0 disegni; un'impugnatura nuova = 36 disegni per mossa. Le impugnature oggi sono 2: leggera nel pugno, pesante in spalla.
- **Armature e vestiti**: lo stesso pezzo in un altro materiale è un cambio di tavolozza (0 disegni). Una sagoma diversa costa 36 disegni per ogni mossa: poche, 2-3.

## I personaggi: la pixel art
- Pixel grossi e netti: niente sfumature, niente anti-aliasing, niente gradienti lisci.
- Contorno scuro di 1 pixel.
- Una tavolozza piccola per personaggio, la stessa in tutte le viste (`sprite/tavolozza.json`, la tiene `pixel.py`). Colori di MAREA: la tabella dell'Art Bible, `marea/docs/ART_BIBLE.md` §2.
- Fondo magenta pieno `#FF00FF` nei fogli: niente pavimento, ombre, scritte o griglie.

## I personaggi: come si muovono (i 12 principi, in 4 disegni)
Dai 12 principi dell'animazione di Disney (Thomas e Johnston, *The Illusion of Life*, 1981). Con 4 disegni a mossa non ci stanno tutti: questi sono quelli che si scrivono nella frase della mossa in `scheda.json` e che si guardano nel controllo.
- **Anticipazione**: ogni mossa forte comincia al contrario. Accucciato prima dello scatto, mani all'anca prima dell'onda: è il disegno 1.
- **Squash e stretch**: schiacciato e compatto, poi allungato e più sottile, poi palla, poi atterraggio. Il volume resta lo stesso: se si allunga, si stringe.
- **Archi**: braccia, gambe, capriola e arma vanno su curve, mai su rette.
- **Follow through e overlapping**: capelli e camicia arrivano dopo il corpo e si fermano dopo di lui, nel disegno 4.
- **Pose to pose**: i disegni sono pose chiave. Si guarda prima il giro 1, e solo dopo si fa il resto.
- **Slow in e slow out, timing**: con pochi disegni si decide coi tempi (in Fenaki, quanto sta fermo ogni disegno), non coi disegni in più. Lungo sull'anticipazione, veloce nell'azione.
- **Solid drawing, niente gemelli**: sinistra e destra mai identiche (braccia e gambe a altezze diverse), volume e taglia uguali in tutte le viste.
- **Staging**: la sagoma si legge a 48 px, con le braccia fuori dal busto e nessun dettaglio che si perde.
- **Exaggeration e appeal**: un po' sopra la realtà ma riconoscibile (il sorriso, la cicatrice, i capelli), mai caricatura.
- **Azione secondaria**: il braccio libero, i capelli, la boccetta.
- **Nel controllo**: dove un disegno «scatta» (testa che salta, braccia nascoste, bastone che cambia lunghezza), si guarda il cambio con `momento` di Fenaki.

## I personaggi: come si chiede al generatore (lezioni pagate)
- **Una vista per foglio**, 4 colonne × una riga per mossa, la camminata sempre nella prima riga (fa da metro per altezza e piedi). Al massimo 3 mosse per foglio.
- **La cosa più importante va in testa al prompt.** La testa grande Codex l'ha rispettata solo quando la frase della testa era la prima.
- **Le dosi a parole**: «VERY BIG», «HUGE» → esagera (teste al 49 % invece che al 38-43). «a little MORE than one third (38 %)», «a little LESS than half (43 %)» vengono giuste a ±3 punti.
- **Camminata**: «passing pose with the legs together» nei disegni 2 e 4, sennò da fermo resta a metà passo.
- **Allega il foglio a pixel approvato della stessa vista**: con quello Codex ha fatto 9 fogli su 9 buoni al primo colpo.
- Spazio vuoto fra le righe: il generatore fa salire i capelli nella riga sopra.
- **Codex in parallelo**: con 4 fogli alla volta due possono uscire identici (copiano l'ultima immagine generata, nella stessa cartella di Codex). Dopo ogni lotto confronta gli `md5sum` dei fogli; se due coincidono, rifai una vista alla volta (`genera.py … --rifai --paralleli 1`).
- **Cicli a 8 pose: il secondo passo non è lo specchio del primo.** Nelle viste di schiena (NE, NNE, N) la prima volta il secondo passo usciva con la testa girata dall'altra parte (centro della pelle rispetto ai capelli +5 px nei primi 4 disegni, −5 negli ultimi 4): in gioco il personaggio «si voltava a destra e a sinistra» a ogni passo. Nel prompt di `passo2`/`corsa2` c'è «this second step is NOT a mirror image… the same side of the head stays visible». Controllo: per ogni vista la differenza fra le due metà del ciclo (script nel REGISTRO del protagonista) deve restare sotto 3 px.
- **Passi e velocità.** I piedi stanno fermi a terra solo se i disegni al secondo = disegni per passo × velocità / lunghezza del passo disegnato. A 4,2 unità al secondo, un passo di 0,94 unità e 4 disegni per passo servirebbero 18 disegni al secondo (28 correndo): a 10 e 14 i piedi scorrevano al 56 % e al 50 % del terreno («moonwalk»). Il motore deve legare il disegno alla distanza percorsa, non al tempo, e la velocità va scelta sul passo disegnato.
- **Dopo `pixel.py`, per i cicli:** `strumenti/nomi_8pose.py` (nomi di F3), poi `strumenti/ancora_cicli.py` (l'appoggio sul centro della testa: nella corsa la testa ballava di 2,6-4,3 px da un disegno all'altro, ora 0,5-0,9).
- **Il bastone di ciano**: di spalle la prima volta usciva sottile e quasi sparito sotto il contorno (1-5 pixel ciano contro 17-25 delle altre viste). Nel prompt serve «bright pure cyan #00FFFF, at least 2 full pixels thick along its whole length, drawn on top of everything». Si controlla contando i pixel `#00FFFF` per sprite.

## Generatori
- **Codex / ChatGPT**: è quello che funziona (108 sprite di F3 e le 3 mosse delle armi, buoni al primo colpo). Codex in automatico (`genera.py`), ChatGPT a mano (`prompt.py --stampa`) anche coi crediti gratuiti del giorno. *Nota per chi usa ChatGPT free (Riccardo, Alberto/birba)*: permette di allegare al **massimo 2 immagini di riferimento** per messaggio; se uno script ne indica 3, allegare solo le 2 prioritarie (la vista di posa e il foglio di stile/design).
- **Gemini**: bocciato per le mosse (prova di Riccardo, 29/10). Colori, proporzioni e pixel quasi a posto, ma le pose no: camminata con 4 disegni quasi uguali e gambe mai unite, capriola senza preparazione né atterraggio, la boccetta che cambia forma a ogni disegno. Anche col foglio approvato allegato.
- **Un personaggio, un generatore**: un personaggio nato con Codex si finisce con Codex.

## Già bocciato (non si rifà)
- Cartoon «da bambini» e i giocattoli alla Roblox / Fall Guys. Piacciono: Sunny Trails, Oh My Doug, Cuphead.
- Disegnare sopra forme fatte da codice: prima il disegno approvato, poi le viste.
- Più viste nello stesso foglio (le proporzioni scappano).
- Il 2.5D tutto disegnato (anche il mondo) e il personaggio 3D da vicino «impastato».
- Scritte tutte maiuscole nella UI; i font Titan, Fredoka, Nunito.

## I personaggi: il controllo, prima di farli vedere
1. I piedi toccano la linea di terra della riga.
2. La testa ha la stessa taglia in tutte le viste e in tutti i disegni; i capelli interi.
3. Gli stessi colori girando (stessa maglietta, stesse scarpe nelle 9 viste).
4. Camminata: 2 e 4 a gambe unite, il giro 4 → 1 non scatta.
5. Il giro delle 16 direzioni: la sagoma cambia a poco a poco, nessuna vista «di un altro artista».
