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


## Due giocatori sullo stesso dispositivo
Ragazza rossa (1): WASD. Ragazza blu (2): frecce. Su touch ogni ragazza ha un gruppo di pulsanti, con supporto multitouch. Punteggi separati: vince chi ha più punti alla fine dei 60 secondi; è possibile il pareggio. Il topo fugge dalla ragazza più vicina. Se entrambe lo catturano esattamente alla stessa distanza, ricevono entrambe 10 punti.

## Funghi e buchi
Ogni 10 secondi compaiono quattro funghi: viola aumenta la velocità, rosso ingrandisce la ragazza e il raggio di cattura, nero rallenta, giallo rimpicciolisce e riduce il raggio di cattura. Gli effetti durano 6 secondi di gioco e non si accumulano; un nuovo fungo sostituisce quello precedente. Ogni nuova comparsa sostituisce i funghi rimasti. Quattro buchi sui lati permettono al topo di scappare: ricompare altrove senza assegnare punti. Pausa e nuova partita gestiscono anche gli effetti.

## Topi e tunnel
Cinque topi contemporaneamente, 12 funghi subito e ogni 10 secondi, 12 buchi. Anche i topi mangiano i funghi: stessi effetti per 6 secondi. Le ragazze entrano nei buchi e riappaiono in un altro buco con una pausa di 1,5 secondi prima di poter rientrare.
