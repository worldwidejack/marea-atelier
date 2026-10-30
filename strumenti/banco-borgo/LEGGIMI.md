# Il banco del Borgo: provare gli sprite nel gioco

Serve a vedere uno sprite **dentro il Borgo vero**, accanto all'avatar 3D, prima di decidere se un look va bene. Non cambia il gioco: aggiunge qualche file in più al tuo checkout di `worldwidejack/marea` e li tiene fuori da git.

## Da zero (Jack, Alberto, e i vostri AI)
Vuoi vedere il tuo sprite nel Borgo? Chiedilo al tuo AI: «prova il mio personaggio nel Borgo col banco dell'Atelier». Lui deve fare questo:
1. `git pull` nell'Atelier (e il tuo personaggio deve avere `personaggi/<id>/sprite/` con `elenco.json`).
2. Se non hai il gioco: `git clone https://github.com/worldwidejack/marea.git`, poi `npm install` dentro (Windows PowerShell: `npm.cmd`). Se ce l'hai, `git pull` (meglio una copia pulita o una worktree: il banco aggiunge file, ma li esclude da git).
3. `node strumenti/banco-borgo/installa.mjs <cartella-del-gioco> <id>` (dall'Atelier).
4. Nel gioco: `npm run dev` (porta 5173; sul tuo PC, non serve nessun server di Cloudflare).
5. Apri `http://localhost:5173/_banco.html?test=1&net=0&slot=0&sprite=<id>&accanto=1&mossa=camminata` (frecce o joystick per muoverti, rotella o pizzico per lo zoom).
6. Per controllare la grandezza: `node _banco/zoom.mjs <id>` (dentro il gioco): ogni riga deve dire rapporto 1.00.
Aspetta: la pagina ci mette 30-60 secondi a caricare tutti i disegni (il server li serve uno alla volta). Non serve account né connessione al gioco vero (`net=0`).

## Installarlo (una volta, e ogni volta che arrivano sprite nuovi)
Ti serve il gioco clonato e con `npm install` fatto (e Playwright, che il gioco ha già per i test). Dall'Atelier:
```
node strumenti/banco-borgo/installa.mjs <cartella-del-gioco>
node strumenti/banco-borgo/installa.mjs <cartella-del-gioco> protagonista   # solo un personaggio
```
Mette nel gioco `_banco/` (gli script), `apps/client/_banco.html` (il gioco con due righe in più, rifatta ogni volta da `index.html`: così non invecchia), `apps/client/src/_banco_sprite.ts` e, in `apps/client/public/_banco_sprite/<personaggio>/`, gli sprite di ogni `personaggi/<id>/sprite/` dell'Atelier che ha l'`elenco.json`. Poi li esclude da git (`.git/info/exclude`), quindi non finiscono mai in un commit del gioco.

## Provarlo
Con il gioco acceso (`npm run dev`, porta 5173):
- **A mano**: `http://localhost:5173/_banco.html?test=1&net=0&slot=0&sprite=<personaggio>`
  - `&accanto=1` lo mette di fianco al 3D (senza, prende il posto del 3D);
  - `&scala=elenco` lo tiene alla grandezza con cui è stato disegnato (default: alto come l'avatar);
  - `&mossa=camminata` o `&mossa=corsa` usa le 8 pose invece dei 4 disegni di `cammina` (default);
    i disegni avanzano con la distanza percorsa, non col tempo (il passo si misura sul profilo E: i piedi non scivolano); da fermo mostra `cammina_2`, le gambe unite, se c'è.
  - `&nitido=1` scala lo sprite a numeri interi per avere pixel tutti uguali, ma allora a ogni zoom la grandezza salta (1×, 2×…) e non resta uguale al 3D. Di default invece la scala è continua: alto sempre come il 3D a ogni zoom, con i pixel un po' sfumati (vedi sotto).
- **Foto automatiche** (dalla cartella del gioco): `node _banco/scena.mjs <personaggio> <tel|largo> <accanto|furetto|giro> <elenco|avatar>`
  - `tel` = telefono, `largo` = finestra larga; `giro` fa il giro delle 8 viste; `furetto` lo porta vicino a un paesano.
  - Le immagini escono in `tests/out/banco-sprite/`. `python _banco/fogli.py <personaggio>` le mette in fogli A/B (serve Pillow).
  - `node _banco/nitidezza.mjs <personaggio>` confronta con e senza la correzione dei pixel.

Il personaggio è il nome della cartella in `personaggi/` (ora: `f3-prova` = gli sprite di Jack della prova, `protagonista` = la quest in corso). Gli sprite devono essere quelli di `pixel.py`: `<vista>_<mossa>_<n>.png` + `elenco.json` con `w, h, ax, ay` (ancora = i piedi) e `s` (pixel per unità di mondo).

## Cosa abbiamo imparato (29 ott)
- Il gioco disegna a **mezza risoluzione** (finestra larga: 1 px di gioco = 2 px dello schermo). Uno sprite alto 48 px come il 3D sta in ~31 px di gioco: il «nearest» salta pixel e sgrana. Il banco scala a interi e aggancia i piedi alla griglia (`nitido`, di default). Su telefono 1 px sprite = 1 px gioco ≈ altezza del 3D; su finestra larga dà 1,8× il 3D: per la parità serve uno sprite da ~32 px alti (`pixel.py --alto 32`) o uno strato sprite a risoluzione piena. È una decisione del motore, non del banco.
- Costo misurato: 108 PNG ≈ 148 KB; +2 draw call (sprite + ombra), +14 triangoli. Camera del Borgo: fov 30, a 45°; l'avatar 3D è alto 1,84 u, lo sprite «come disegnato» 2,5 u.
- Come prende la scena: three avvisa `window.__THREE_DEVTOOLS__` a ogni `Scene` e `WebGLRenderer`; la pagina del banco lo ascolta e si tiene scena, renderer e camera in `window.__banco`. Per questo non serve toccare il codice del gioco.
