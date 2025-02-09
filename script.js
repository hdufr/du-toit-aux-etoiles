// script.js

// Liste des fichiers MP3 chargés dynamiquement depuis playlist.json
let tracks = [];

let currentTrackIndex = 0;

// Sélection des éléments
const audioPlayer = document.getElementById('audioPlayer');
const playlistElement = document.getElementById('playlist');
const albumArt = document.getElementById('albumArt');

// Remplacer les contrôles natifs par nos propres contrôles
audioPlayer.removeAttribute('controls');
const audioControls = document.createElement('div');
audioControls.className = 'audio-controls';
audioControls.innerHTML = `
    <div class="progress-container">
        <div class="progress-bar">
            <div class="progress"></div>
        </div>
        <div class="time">
            <span class="current-time">0:00</span>
            <span class="duration">0:00</span>
        </div>
    </div>
    <button class="play-pause-btn">
        <span class="play">▶</span>
        <span class="pause" style="display:none">⏸</span>
    </button>
`;
audioPlayer.parentNode.insertBefore(audioControls, audioPlayer.nextSibling);

const playPauseBtn = audioControls.querySelector('.play-pause-btn');
const playBtn = playPauseBtn.querySelector('.play');
const pauseBtn = playPauseBtn.querySelector('.pause');
const progressBar = audioControls.querySelector('.progress-bar');
const progress = audioControls.querySelector('.progress');
const currentTimeEl = audioControls.querySelector('.current-time');
const durationEl = audioControls.querySelector('.duration');

// Fonction pour formater le temps en minutes:secondes
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Mettre à jour la barre de progression
function updateProgress() {
    if (audioPlayer.duration) {
        const percentage = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progress.style.width = percentage + '%';
        currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
        durationEl.textContent = formatTime(audioPlayer.duration);
    }
}

// Gérer le clic sur la barre de progression
progressBar.addEventListener('click', (e) => {
    const rect = progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audioPlayer.currentTime = pos * audioPlayer.duration;
});

// Mettre à jour la progression pendant la lecture
audioPlayer.addEventListener('timeupdate', updateProgress);

// Mettre à jour la durée quand les métadonnées sont chargées
audioPlayer.addEventListener('loadedmetadata', () => {
    durationEl.textContent = formatTime(audioPlayer.duration);
});

// Fonction pour mettre à jour la source de l'image
function updateAlbumArt(track) {
    // Utiliser l'image spécifiée dans le JSON, avec fallback sur default.jpg
    albumArt.src = track.image ? `../images/${track.image}` : '../images/default.jpg';
}

// Fonction pour mettre à jour l'état des icônes de lecture/pause
function updatePlayPauseIcons(isPlaying) {
    playBtn.style.display = isPlaying ? 'none' : 'block';
    pauseBtn.style.display = isPlaying ? 'block' : 'none';
}

// Fonction pour vérifier si une piste est chargée
function isTrackLoaded() {
    return audioPlayer.src && !audioPlayer.src.endsWith('default.jpg');
}

// Fonction pour basculer la lecture/pause
function togglePlayPause() {
    if (audioPlayer.paused) {
        // Si aucune piste n'est chargée, charger la première
        if (!isTrackLoaded()) {
            if (tracks.length > 0) {
                loadTrack(0);
                return;
            }
        }
        audioPlayer.play();
    } else {
        audioPlayer.pause();
    }
}

// Écouteur d'événements pour le bouton de lecture/pause personnalisé
playPauseBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (currentTrackIndex === -1 && tracks.length > 0) {
        loadTrack(0);
    } else {
        togglePlayPause();
    }
});

// Mise à jour des icônes lors du changement d'état de lecture
audioPlayer.addEventListener('play', () => {
    updatePlayPauseIcons(true);
});

audioPlayer.addEventListener('pause', () => {
    updatePlayPauseIcons(false);
});

// Intercepter le clic sur le contrôle audio
audioPlayer.addEventListener('click', (e) => {
    // Si on clique sur le bouton play et qu'aucune piste n'est chargée
    if (!isTrackLoaded() && tracks.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        loadTrack(0);
    }
}, true);

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
    albumArt.src = '../images/default.jpg';
});

// Passer à la piste suivante automatiquement après la lecture
audioPlayer.addEventListener('ended', () => {
    let nextTrack = currentTrackIndex + 1;
    if (nextTrack < tracks.length) {
        loadTrack(nextTrack);
    } else {
        // Réinitialiser le player comme au démarrage
        albumArt.src = './images/default.jpg';
        audioPlayer.src = '';
        currentTrackIndex = -1;
        progress.style.width = '0%';
        currentTimeEl.textContent = '0:00';
        durationEl.textContent = '0:00';
        // Désélectionner la piste active dans la playlist
        const items = document.querySelectorAll('#playlist li');
        items.forEach(item => item.classList.remove('active'));
    }
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
          albumArt.src = '../images/default.jpg';
          
          // Ne pas démarrer la lecture automatiquement
          // Désactiver le lecteur audio
          audioPlayer.removeAttribute('src');
          audioPlayer.pause();
      })
      .catch(error => console.error('Erreur chargement pistes:', error));
}

// Fonction pour récupérer la version depuis version.txt
async function updateVersion() {
    try {
        const response = await fetch('./version.txt');
        if (response.ok) {
            const version = await response.text();
            const versionElement = document.querySelector('.version');
            if (versionElement) {
                versionElement.textContent = `v${version.trim()}`;
            }
        }
    } catch (error) {
        console.error('Erreur lors de la récupération de la version:', error);
    }
}

fetchTracks();
updateVersion();
