// script.js

// Liste des fichiers MP3 chargés dynamiquement depuis playlist.json
let tracks = [];

let currentTrackIndex = 0;

// Sélection des éléments
const audioPlayer = document.getElementById('audioPlayer');
const playlistElement = document.getElementById('playlist');
const albumArt = document.getElementById('albumArt');

// Fonction pour mettre à jour la source de l'image
function updateAlbumArt(track) {
    // Utiliser l'image spécifiée dans le JSON, avec fallback sur default.jpg
    const imagePath = `./images/${track.image || 'default.jpg'}`;
    albumArt.src = imagePath;
}

// Fonction pour charger et jouer une piste
function loadTrack(index) {
    if (index < 0 || index >= tracks.length) {
        return;
    }
    currentTrackIndex = index;

    // Marquer la piste active dans la playlist
    const items = document.querySelectorAll('#playlist li');
    items.forEach((item, idx) => {
        if (idx === index) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Mettre à jour le lecteur audio et l'image
    audioPlayer.src = `./audio/${tracks[index].filename}`;
    updateAlbumArt(tracks[index]);
    
    // Démarrer la lecture immédiatement
    audioPlayer.play();
}

// Remplacer par default.jpg si l'image ne charge pas
albumArt.addEventListener('error', function() {
    albumArt.src = './images/default.jpg';
});

// Passer à la piste suivante automatiquement après la lecture
audioPlayer.addEventListener('ended', () => {
    let nextTrack = currentTrackIndex + 1;
    if (nextTrack >= tracks.length) {
        nextTrack = 0; // recommencer depuis le début
    }
    loadTrack(nextTrack);
});

// Charger les pistes au démarrage
function fetchTracks() {
    fetch('./playlist.json')
      .then(response => response.json())
      .then(data => {
          // Trier les pistes par ordre
          tracks = data.tracks.sort((a, b) => a.order - b.order);
          
          // Remplir la playlist
          tracks.forEach((track, index) => {
              const li = document.createElement('li');
              li.textContent = track.title;
              li.dataset.filename = track.filename;
              li.dataset.image = track.image;

              li.addEventListener('click', () => loadTrack(index));
              playlistElement.appendChild(li);
          });
          
          // Afficher default.jpg au chargement
          albumArt.src = './images/default.jpg';
          
          // Ne pas démarrer la lecture automatiquement
          // Désactiver le lecteur audio
          audioPlayer.removeAttribute('src');
          audioPlayer.pause();
      })
      .catch(error => console.error('Erreur chargement pistes:', error));
}

fetchTracks();
