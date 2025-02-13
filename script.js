// script.js

// Liste des fichiers MP3 chargés dynamiquement depuis playlist.json
let tracks = [];

let currentTrackIndex = 0;

// État de lecture
let isPlaying = false;

// Sélection des éléments
const audioPlayer = document.getElementById('audioPlayer');
const playlistElement = document.getElementById('playlist');
const albumArt = document.getElementById('albumArt');

// Remplacer les contrôles natifs par nos propres contrôles
if (audioPlayer) {
    audioPlayer.removeAttribute('controls');
}

const audioControls = document.querySelector('.audio-controls');
const progressContainer = audioControls.querySelector('.progress-container');
const progressBar = progressContainer.querySelector('.progress-bar');
const progress = progressBar.querySelector('.progress');
const currentTimeEl = progressContainer.querySelector('.current-time');
const durationEl = progressContainer.querySelector('.duration');

const playPauseBtn = audioControls.querySelector('.play-pause-btn');
const playBtn = playPauseBtn.querySelector('.play');
const pauseBtn = playPauseBtn.querySelector('.pause');

// Sélection des boutons de navigation de piste
let prevTrackBtn;
let nextTrackBtn;

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

// Fonction pour mettre à jour les icônes de lecture/pause
function updatePlayPauseIcons(playing) {
    const playBtn = playPauseBtn.querySelector('.play');
    const pauseBtn = playPauseBtn.querySelector('.pause');
    playBtn.style.display = playing ? 'none' : 'inline';
    pauseBtn.style.display = playing ? 'inline' : 'none';
}

// Fonction pour vérifier si une piste est chargée
function isTrackLoaded() {
    return audioPlayer.src && !audioPlayer.src.endsWith('default.jpg');
}

// Fonction pour basculer la lecture/pause
function togglePlayPause() {
    if (!audioPlayer.src) {
        // Si aucune piste n'est chargée et que la playlist n'est pas vide, charger la première piste
        if (tracks && tracks.length > 0) {
            loadTrack(0);
        }
        return;
    }

    if (isPlaying) {
        audioPlayer.pause();
        isPlaying = false;
        updatePlayPauseIcons(false);
    } else {
        audioPlayer.play()
            .then(() => {
                isPlaying = true;
                updatePlayPauseIcons(true);
            })
            .catch(error => {
                console.error("Erreur lors de la lecture :", error);
                isPlaying = false;
            });
    }
}

// Écouteur d'événements pour le bouton de lecture/pause personnalisé
playPauseBtn.addEventListener('click', togglePlayPause);

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

// Charger les pistes au démarrage
function fetchTracks() {
    fetch('./playlist.json')
        .then(response => response.json())
        .then(data => {
            // Trier les pistes par ordre
            tracks = data.tracks.sort((a, b) => a.order - b.order);
            console.log('Pistes chargées:', tracks);
            
            // Vider la playlist existante
            playlistElement.innerHTML = '';
            
            // Créer les éléments de la playlist
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
            
            // Forcer la mise à jour des boutons de navigation
            currentTrackIndex = -1;
            updateNavigationButtons();
        })
        .catch(error => {
            console.error('Erreur lors du chargement des pistes:', error);
            currentTrackIndex = -1;
            updateNavigationButtons();
        });
}

// Fonction pour charger et jouer une piste
function loadTrack(index) {
    if (index < 0 || index >= tracks.length) return;

    // Supprimer la classe active de tous les éléments de la playlist
    const playlistItems = document.querySelectorAll('#playlist li');
    playlistItems.forEach(item => item.classList.remove('active'));
    
    // Ajouter la classe active à l'élément sélectionné
    playlistItems[index].classList.add('active');
    
    currentTrackIndex = index;
    const track = tracks[index];
    
    audioPlayer.src = `../audio/${track.filename}`;
    updateAlbumArt(track);
    
    // Mettre à jour les boutons de navigation
    updateNavigationButtons();
    
    // Jouer la piste
    audioPlayer.play()
        .then(() => {
            isPlaying = true;
            updatePlayPauseIcons(true);
        })
        .catch(error => {
            console.error('Erreur lors de la lecture de la piste:', error);
            isPlaying = false;
            updatePlayPauseIcons(false);
        });
}

// Remplacer par default.jpg si l'image ne charge pas
albumArt.addEventListener('error', function() {
    albumArt.src = '../images/default.jpg';
});

// Fonction pour aller à la piste précédente
function goToPreviousTrack() {
    if (tracks.length === 0) return;
    
    currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    loadTrack(currentTrackIndex);
}

// Fonction pour aller à la piste suivante
function goToNextTrack() {
    if (tracks.length === 0) return;
    
    currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
    loadTrack(currentTrackIndex);
}

// Ajout des écouteurs d'événements pour les boutons de navigation
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM chargé, initialisation des boutons de navigation');
    
    // Sélection explicite des boutons
    prevTrackBtn = document.getElementById('prevTrack');
    nextTrackBtn = document.getElementById('nextTrack');
    
    console.log('Boutons sélectionnés:', {
        prevTrack: prevTrackBtn,
        nextTrack: nextTrackBtn
    });
    
    // Ajouter la classe de masquage par défaut
    if (prevTrackBtn) prevTrackBtn.classList.add('track-nav-hidden');
    if (nextTrackBtn) nextTrackBtn.classList.add('track-nav-hidden');
    
    updateNavigationButtons();
});

// Fonction pour mettre à jour la visibilité des boutons de navigation
function updateNavigationButtons() {
    console.log('Mise à jour des boutons de navigation');
    console.log('Nombre de pistes:', tracks ? tracks.length : 'tracks non défini');
    console.log('Index de piste actuel:', currentTrackIndex);
    
    // Sélection explicite des boutons à chaque appel
    const prevTrackBtn = document.getElementById('prevTrack');
    const nextTrackBtn = document.getElementById('nextTrack');
    
    console.log('Boutons:', {
        prevTrack: prevTrackBtn,
        nextTrack: nextTrackBtn
    });

    // Vérifier les classes existantes
    if (prevTrackBtn) {
        console.log('Classes du bouton précédent:', prevTrackBtn.classList.toString());
    }
    if (nextTrackBtn) {
        console.log('Classes du bouton suivant:', nextTrackBtn.classList.toString());
    }

    // Cacher les boutons si aucune piste n'est chargée
    if (!tracks || tracks.length === 0 || currentTrackIndex === -1) {
        console.log('Conditions pour masquer les boutons remplies');
        
        if (prevTrackBtn) {
            console.log('Ajout de track-nav-hidden au bouton précédent');
            prevTrackBtn.classList.add('track-nav-hidden');
        }
        
        if (nextTrackBtn) {
            console.log('Ajout de track-nav-hidden au bouton suivant');
            nextTrackBtn.classList.add('track-nav-hidden');
        }
    } else {
        console.log('Conditions pour afficher les boutons remplies');
        
        // Masquer le bouton Préc si le premier élément est sélectionné
        if (prevTrackBtn) {
            if (currentTrackIndex === 0) {
                console.log('Masquage du bouton précédent (premier élément)');
                prevTrackBtn.classList.add('track-nav-hidden');
            } else {
                console.log('Affichage du bouton précédent');
                prevTrackBtn.classList.remove('track-nav-hidden');
            }
        }
        
        // Masquer le bouton Suiv si le dernier élément est sélectionné
        if (nextTrackBtn) {
            if (currentTrackIndex === tracks.length - 1) {
                console.log('Masquage du bouton suivant (dernier élément)');
                nextTrackBtn.classList.add('track-nav-hidden');
            } else {
                console.log('Affichage du bouton suivant');
                nextTrackBtn.classList.remove('track-nav-hidden');
            }
        }
    }
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

// Ajouter des écouteurs d'événements pour la lecture/fin de piste
audioPlayer.addEventListener('ended', () => {
    // Passer automatiquement à la piste suivante
    goToNextTrack();
});

// Initialiser les écouteurs d'événements pour les boutons de navigation
document.addEventListener('DOMContentLoaded', () => {
    const prevTrackBtn = document.getElementById('prevTrack');
    const nextTrackBtn = document.getElementById('nextTrack');

    if (prevTrackBtn) {
        prevTrackBtn.addEventListener('click', goToPreviousTrack);
    }
    if (nextTrackBtn) {
        nextTrackBtn.addEventListener('click', goToNextTrack);
    }
});

fetchTracks();
updateVersion();
