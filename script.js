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
// Ajout des sélecteurs pour les onglets et le contenu
const tabsContainer = document.querySelector('.tabs'); 
const tabContentContainer = document.querySelector('.tabcontent-container');

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
        const imagePath = track.image ? `/images/${track.image}` : '/images/default.jpg';
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

// Fonction déplacée depuis index.html pour gérer les onglets
function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        // Attention à ne pas ajouter d'espace en trop si " active" n'existe pas
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    const currentTabContent = document.getElementById(tabName);
    if (currentTabContent) { // Vérifier si l'élément existe
        currentTabContent.style.display = "block";
    }
    // Gérer l'événement ou l'appel programmatique
    if (evt && evt.currentTarget) { 
       evt.currentTarget.className += " active";
    } else {
        // Trouver le bouton correspondant au tabName et ajouter la classe 'active'
        const buttons = document.querySelectorAll('.tablinks');
        buttons.forEach(button => {
            if (button.innerText === tabName) {
                // S'assurer de ne pas ajouter la classe si elle existe déjà
                if (!button.className.includes(' active')) {
                     button.className += " active";
                }
            }
        });
    }
}

// Charger les pistes, créer les onglets et la playlist
async function fetchTracks() {
    try {
        const response = await fetch('/playlist.json');
        const data = await response.json();

        // Trier les pistes par ordre
        tracks = data.tracks.sort((a, b) => a.order - b.order);
        console.log('Pistes chargées et triées:', tracks);

        // Vider les conteneurs précédents
        if (tabsContainer) tabsContainer.innerHTML = '';
        if (tabContentContainer) tabContentContainer.innerHTML = '';

        const createdTabs = {};
        const tabPlaylists = {}; // Pour stocker les éléments UL de chaque onglet

        // Générer les onglets et les éléments de la liste à partir des pistes triées
        tracks.forEach((track, index) => { // Utiliser l'index du tableau trié
            const { onglet, title } = track;

            // Créer l'onglet s'il n'existe pas déjà
            if (!createdTabs[onglet] && tabsContainer && tabContentContainer) {
                createdTabs[onglet] = true;

                // Bouton d'onglet
                const tabButton = document.createElement('button');
                tabButton.className = 'tablinks';
                tabButton.innerText = onglet;
                tabButton.onclick = function(event) {
                    openTab(event, onglet);
                };
                tabsContainer.appendChild(tabButton);

                // Contenu de l'onglet (div)
                const contentDiv = document.createElement('div');
                contentDiv.className = 'tabcontent';
                contentDiv.id = onglet;
                contentDiv.style.display = 'none'; // Cacher initialement

                // Liste de lecture (ul) dans le contenu de l'onglet
                const playlistUl = document.createElement('ul');
                playlistUl.className = 'playlist';
                contentDiv.appendChild(playlistUl);
                tabContentContainer.appendChild(contentDiv);
                tabPlaylists[onglet] = playlistUl; // Stocker la référence UL
            }

            // Créer l'élément de la liste (li)
            const listItem = document.createElement('li');
            listItem.textContent = title;
            // Attacher le bon gestionnaire de clic avec l'index correct
            listItem.onclick = function() {
                loadTrack(index); // Appeler loadTrack avec l'index du tableau trié
            };

            // Ajouter le LI au bon UL d'onglet
            if (tabPlaylists[onglet]) {
                tabPlaylists[onglet].appendChild(listItem);
            } else {
                 console.error(`Conteneur UL pour l'onglet ${onglet} non défini.`); 
            }
        });

        // Réinitialiser l'état du lecteur APRES la boucle
        currentTrackIndex = -1;
        updateNavigationButtons();
        if (albumArt) {
            albumArt.src = '/images/default.jpg'; // Réinitialiser l'image
        }
        if(audioPlayer){
             audioPlayer.src = ''; // Vider la source audio
             if (currentTimeDisplay) currentTimeDisplay.textContent = formatTime(0);
             if (durationDisplay) durationDisplay.textContent = formatTime(0);
             if (progress) progress.style.width = '0%';
             updatePlayPauseIcons(false); // Afficher l'icône pause
        }

        // Ouvrir le premier onglet par défaut APRES la boucle
        const firstTabName = Object.keys(createdTabs)[0];
        if (firstTabName && tabsContainer) {
             const firstButton = tabsContainer.querySelector('.tablinks');
             if(firstButton){
                 // Appeler openTab directement pour l'ouverture programmatique
                 // Passer null comme événement
                 openTab(null, firstTabName); 
             }
        }

    } catch (error) {
        console.error('Erreur lors du chargement et de la génération de la playlist:', error);
    }
}

// Fonction pour charger et jouer une piste
function loadTrack(index) {
    if (index >= 0 && index < tracks.length) {
        currentTrackIndex = index;
        const track = tracks[index];
        
        // Activer l'onglet de la piste en cours
        if (track && track.onglet) {
            openTab(null, track.onglet);
        }

        if (audioPlayer) {
            audioPlayer.src = `/audio/${encodeURIComponent(track.filename)}`; // MODIFIÉ ICI
            audioPlayer.load();
            audioPlayer.play()
                .then(() => {
                    isPlaying = true;
                    updatePlayPauseIcons(true);
                })
                .catch(error => {
                    console.error('Erreur lors de la lecture:', error);
                    // Potentiellement, ajouter ici un message à l'utilisateur
                    // ou une logique pour essayer de charger la piste suivante.
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

// Fonction simplifiée pour mettre à jour la sélection (classe active)
function updatePlaylistSelection(currentTrack) {
    // Vérifier si currentTrack est valide
    if (!currentTrack || !currentTrack.title) {
        // Retirer la classe active de tous si aucune piste valide n'est jouée
        document.querySelectorAll('.playlist li').forEach(item => {
            item.classList.remove('active');
        });
        return;
    }

    // Trouver tous les éléments li dans toutes les playlists
    const playlistItems = document.querySelectorAll('.playlist li');

    playlistItems.forEach(item => {
        // Retirer la classe active de tous
        item.classList.remove('active');
        // Ajouter la classe active si le texte correspond au titre de la piste actuelle
        if (item.textContent === currentTrack.title) {
            item.classList.add('active');
        }
    });
}

// Gérer l'erreur de chargement d'image
if (albumArt) {
    albumArt.addEventListener('error', function() {
        this.src = '/images/default.jpg';
    });
}

// Fonction pour aller à la piste suivante
function goToNextTrack() {
    if (tracks.length === 0 || currentTrackIndex < 0) {
        // Aucune piste chargée ou index invalide, ne rien faire
        return;
    }

    const currentPlayingTrack = tracks[currentTrackIndex];
    const currentOnglet = currentPlayingTrack.onglet;

    // Filtrer les pistes pour ne garder que celles de l'onglet actuel
    // L'ordre est préservé car 'tracks' est déjà trié par 'order'
    const tracksInCurrentOnglet = tracks.filter(track => track.onglet === currentOnglet);

    if (tracksInCurrentOnglet.length === 0) {
        // Ne devrait pas arriver si currentPlayingTrack existe, mais par sécurité
        return;
    }

    // Trouver l'index de la piste actuelle dans la liste filtrée de l'onglet
    const currentIndexInOnglet = tracksInCurrentOnglet.findIndex(track => track.filename === currentPlayingTrack.filename);

    let nextIndexInOnglet = currentIndexInOnglet + 1;

    // Si c'est la dernière piste de l'onglet, revenir à la première de cet onglet
    if (nextIndexInOnglet >= tracksInCurrentOnglet.length) {
        nextIndexInOnglet = 0;
    }

    const nextTrackToPlayInOnglet = tracksInCurrentOnglet[nextIndexInOnglet];

    // Trouver l'index original de la prochaine piste dans la liste globale 'tracks'
    const originalNewIndex = tracks.findIndex(track => track.filename === nextTrackToPlayInOnglet.filename);

    if (originalNewIndex !== -1) {
        loadTrack(originalNewIndex);
    } else {
        // Fallback: si quelque chose d'inattendu se produit, revenir au comportement par défaut (première piste de toute la playlist)
        // Ou gérer l'erreur autrement
        console.error("Erreur: Impossible de trouver la prochaine piste de l'onglet dans la playlist globale.");
        loadTrack(0); // Option de secours
    }
}

// Fonction pour aller à la piste précédente
function goToPreviousTrack() {
    if (tracks.length === 0 || currentTrackIndex < 0) {
        // Aucune piste chargée ou index invalide, ne rien faire
        return;
    }

    const currentPlayingTrack = tracks[currentTrackIndex];
    const currentOnglet = currentPlayingTrack.onglet;

    // Filtrer les pistes pour ne garder que celles de l'onglet actuel
    const tracksInCurrentOnglet = tracks.filter(track => track.onglet === currentOnglet);

    if (tracksInCurrentOnglet.length === 0) {
        return;
    }

    // Trouver l'index de la piste actuelle dans la liste filtrée de l'onglet
    const currentIndexInOnglet = tracksInCurrentOnglet.findIndex(track => track.filename === currentPlayingTrack.filename);

    let prevIndexInOnglet = currentIndexInOnglet - 1;

    // Si c'est la première piste de l'onglet, aller à la dernière de cet onglet
    if (prevIndexInOnglet < 0) {
        prevIndexInOnglet = tracksInCurrentOnglet.length - 1;
    }

    const prevTrackToPlayInOnglet = tracksInCurrentOnglet[prevIndexInOnglet];

    // Trouver l'index original de la piste précédente dans la liste globale 'tracks'
    const originalNewIndex = tracks.findIndex(track => track.filename === prevTrackToPlayInOnglet.filename);

    if (originalNewIndex !== -1) {
        loadTrack(originalNewIndex);
    } else {
        console.error("Erreur: Impossible de trouver la piste précédente de l'onglet dans la playlist globale.");
        loadTrack(tracks.length - 1); // Option de secours: dernière piste de toute la playlist
    }
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
        const response = await fetch('/version.txt');
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

// Ajout des raccourcis clavier
document.addEventListener('keydown', (event) => {
    // Empêcher les raccourcis si l'utilisateur est en train de taper dans un champ
    const targetTagName = event.target.tagName.toLowerCase();
    if (targetTagName === 'input' || targetTagName === 'textarea' || targetTagName === 'select') {
        return;
    }

    switch (event.key) {
        case ' ': // Espace
            event.preventDefault(); // Empêche le défilement de la page si la barre d'espace est pressée
            togglePlayPause();
            break;
        case 'ArrowLeft': // Flèche gauche
            goToPreviousTrack();
            break;
        case 'ArrowRight': // Flèche droite
            goToNextTrack();
            break;
    }
});

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    await fetchTracks();
    updateVersion();
    // Lecture directe si URL /audio/:nomDeLaPiste
    const parts = location.pathname.split('/');
    if (parts[1] === 'audio' && parts[2]) { // MODIFIÉ ICI: 'track' devient 'audio'
        const id = decodeURIComponent(parts[2]);
        // Assurer que le nom de fichier se termine par .mp3, sensible à la casse pour la correspondance initiale
        const filename = id.endsWith('.mp3') ? id : `${id}.mp3`;
        // Trouver l'index en comparant les noms de fichiers (insensible à la casse est plus robuste ici)
        const idx = tracks.findIndex(t => t.filename.toLowerCase() === filename.toLowerCase());
        if (idx >= 0) loadTrack(idx);
    }
});
