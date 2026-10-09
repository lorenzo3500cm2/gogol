# Catch the Mouse
Gioco browser cartoon 2D: una ragazza rincorre un topo grigio in un prato.

## Giocare
Apri index.html nel browser. Non servono installazioni né dipendenze.
Muoviti con frecce/WASD o i pulsanti touch. Avvicinati al topo: ogni cattura vale 10 punti. La partita dura 60 secondi; il topo fugge e accelera progressivamente. Pausa con il pulsante o Esc. Cambiando scheda la partita va automaticamente in pausa. Il record viene salvato sul dispositivo.

## GitHub Pages
Nel repository gogol vai in Settings → Pages → Build and deployment.
Seleziona “Deploy from a branch”, branch “main”, cartella “/(root)” e Save.
Dopo il completamento della pubblicazione il gioco sarà disponibile su:
https://lorenzo3500cm2.github.io/gogol/
Documentazione: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## File
- index.html: pagina e controlli accessibili
- style.css: layout responsive
- game.js: disegno, movimento, fuga, punteggio e timer
- .nojekyll: sito statico senza Jekyll

Nessuna risorsa esterna, raccolta dati o richiesta di rete. Il canvas e tutti i personaggi sono disegnati localmente.

