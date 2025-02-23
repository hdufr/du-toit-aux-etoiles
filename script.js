// script.js

// Liste des fichiers MP3 chargés dynamiquement depuis playlist.json
let tracks = [];
let currentTrackIndex = -1;
let isPlaying = false;

// Sélection des éléments du DOM
const audioPlayer = document.getElementById('audioPlayer');
const playPauseBtn = document.querySelector('.play-pause');
const prevTrackBtn = document.querySelector('.prev-track');
const nextTrackBtn = document.querySelector('.next-track');
const progressBar = document.querySelector('.progress-bar');
const progress = document.querySelector('.progress');
const currentTimeDisplay = document.querySelector('.current-time');
const durationDisplay = document.querySelector('.duration');
const albumArt = document.querySelector('.album-art');

// Fonction pour formater le temps en minutes:secondes
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Mettre à jour la barre de progression
function updateProgress() {
    if (audioPlayer.duration) {
        const progressPercent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progress.style.width = progressPercent + '%';
        currentTimeDisplay.textContent = formatTime(audioPlayer.currentTime);
        durationDisplay.textContent = formatTime(audioPlayer.duration);
    }
}

// Gérer le clic sur la barre de progression
if (progressBar) {
    progressBar.addEventListener('click', (e) => {
        const rect = progressBar.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        audioPlayer.currentTime = pos * audioPlayer.duration;
    });
}

// Fonction pour mettre à jour la source de l'image
function updateAlbumArt(track) {
    if (albumArt) {
        const imagePath = track.image ? `./images/${track.image}` : './images/default.jpg';
        if (albumArt.src !== imagePath) {
            albumArt.src = imagePath;
        }
    }
}

// Fonction pour mettre à jour les icônes de lecture/pause
function updatePlayPauseIcons(playing) {
    if (playPauseBtn) {
        playPauseBtn.textContent = playing ? '||' : '▶';
    }
}

// Fonction pour vérifier si une piste est chargée
function isTrackLoaded() {
    return audioPlayer && audioPlayer.src && audioPlayer.src !== '';
}

// Fonction pour basculer la lecture/pause
function togglePlayPause() {
    if (!isTrackLoaded() && tracks.length > 0) {
        loadTrack(0);
    } else if (audioPlayer) {
        if (audioPlayer.paused) {
            audioPlayer.play()
                .then(() => {
                    isPlaying = true;
                    updatePlayPauseIcons(true);
                })
                .catch(error => {
                    console.error('Erreur lors de la lecture:', error);
                });
        } else {
            audioPlayer.pause();
            isPlaying = false;
            updatePlayPauseIcons(false);
        }
    }
}

// Écouteurs d'événements pour les contrôles audio
if (playPauseBtn) {
    playPauseBtn.addEventListener('click', togglePlayPause);
}

if (audioPlayer) {
    audioPlayer.addEventListener('play', () => updatePlayPauseIcons(true));
    audioPlayer.addEventListener('pause', () => updatePlayPauseIcons(false));
    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('ended', () => {
        goToNextTrack();
    });
}

// Charger les pistes au démarrage
async function fetchTracks() {
    try {
        const response = await fetch('playlist.json');
        const data = await response.json();
        
        tracks = data.tracks.sort((a, b) => a.order - b.order);
        console.log('Pistes chargées:', tracks);
        
        // Forcer la mise à jour des boutons de navigation
        currentTrackIndex = -1;
        updateNavigationButtons();
        
        // Afficher l'image par défaut
        if (albumArt) {
            albumArt.src = './images/default.jpg';
        }
    } catch (error) {
        console.error('Erreur lors du chargement des pistes:', error);
        currentTrackIndex = -1;
        updateNavigationButtons();
    }
}

// Fonction pour charger et jouer une piste
function loadTrack(index) {
    if (index >= 0 && index < tracks.length) {
        currentTrackIndex = index;
        const track = tracks[index];
        
        if (audioPlayer) {
            audioPlayer.src = `./audio/${track.filename}`;
            audioPlayer.load();
            audioPlayer.play()
                .then(() => {
                    isPlaying = true;
                    updatePlayPauseIcons(true);
                })
                .catch(error => {
                    console.error('Erreur lors de la lecture:', error);
                });
        }

        // Mettre à jour l'image
        updateAlbumArt(track);
        
        // Mettre à jour les boutons de navigation
        updateNavigationButtons();
        
        // Mettre à jour la sélection dans la playlist
        updatePlaylistSelection(track);
    }
}

// Fonction pour mettre à jour la sélection dans la playlist
function updatePlaylistSelection(currentTrack) {
    // Retirer la classe active de tous les éléments
    document.querySelectorAll('.playlist li').forEach(item => {
        item.classList.remove('active');
    });
    
    // Trouver et activer l'élément correspondant à la piste actuelle
    const playlistItems = document.querySelectorAll('.playlist li');
    playlistItems.forEach(item => {
        if (item.textContent === currentTrack.title) {
            item.classList.add('active');
            
            // S'assurer que l'onglet parent est visible
            const tabContent = item.closest('.tabcontent');
            if (tabContent) {
                // Cacher tous les onglets
                document.querySelectorAll('.tabcontent').forEach(tab => {
                    tab.style.display = 'none';
                });
                
                // Afficher l'onglet actuel
                tabContent.style.display = 'block';
                
                // Activer le bouton d'onglet correspondant
                const tabId = tabContent.id;
                document.querySelectorAll('.tablinks').forEach(tab => {
                    tab.classList.remove('active');
                    if (tab.textContent === tabId) {
                        tab.classList.add('active');
                    }
                });
            }
        }
    });
}

// Gérer l'erreur de chargement d'image
if (albumArt) {
    albumArt.addEventListener('error', function() {
        this.src = './images/default.jpg';
    });
}

// Fonction pour aller à la piste précédente
function goToPreviousTrack() {
    if (tracks.length === 0) return;
    
    let newIndex = currentTrackIndex - 1;
    if (newIndex < 0) {
        newIndex = tracks.length - 1;
    }
    loadTrack(newIndex);
}

// Fonction pour aller à la piste suivante
function goToNextTrack() {
    if (tracks.length === 0) return;
    
    let newIndex = currentTrackIndex + 1;
    if (newIndex >= tracks.length) {
        newIndex = 0;
    }
    loadTrack(newIndex);
}

// Écouteurs d'événements pour la navigation
if (prevTrackBtn) {
    prevTrackBtn.addEventListener('click', goToPreviousTrack);
}

if (nextTrackBtn) {
    nextTrackBtn.addEventListener('click', goToNextTrack);
}

// Fonction pour mettre à jour la visibilité des boutons de navigation
function updateNavigationButtons() {
    if (prevTrackBtn) {
        prevTrackBtn.style.display = tracks.length > 1 ? 'block' : 'none';
    }
    if (nextTrackBtn) {
        nextTrackBtn.style.display = tracks.length > 1 ? 'block' : 'none';
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

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    fetchTracks();
    updateVersion();
});
