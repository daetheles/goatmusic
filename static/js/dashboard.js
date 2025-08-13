// Основной JavaScript для GoatMusic Dashboard
class GoatMusicApp {
    constructor() {
        this.currentTrack = null;
        this.isPlaying = false;
        this.searchTimeout = null;
        this.currentSection = 'home';
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadUserProfile();
        this.loadCurrentTrack();
        this.loadPlaylists();
        this.setupNavigation();
        this.setupSearch();
        this.setupModal();
    }
    
    setupEventListeners() {
        // Управление воспроизведением
        document.getElementById('play-btn')?.addEventListener('click', () => this.playTrack());
        document.getElementById('pause-btn')?.addEventListener('click', () => this.pauseTrack());
        document.getElementById('next-btn')?.addEventListener('click', () => this.nextTrack());
        document.getElementById('prev-btn')?.addEventListener('click', () => this.previousTrack());
        
        // Обновление текущего трека каждые 5 секунд
        setInterval(() => this.loadCurrentTrack(), 5000);
    }
    
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        const sections = document.querySelectorAll('.content-section');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                this.showSection(targetId);
                
                // Обновляем активное состояние навигации
                navLinks.forEach(l => l.parentElement.classList.remove('active'));
                link.parentElement.classList.add('active');
            });
        });
    }
    
    showSection(sectionId) {
        // Скрываем все секции
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Показываем нужную секцию
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionId;
            
            // Загружаем контент для секции
            this.loadSectionContent(sectionId);
        }
    }
    
    loadSectionContent(sectionId) {
        switch(sectionId) {
            case 'home':
                this.loadRecentTracks();
                this.loadRecommendations();
                break;
            case 'search':
                // Поиск уже настроен
                break;
            case 'library':
                this.loadLibraryStats();
                break;
            case 'playlists':
                this.loadPlaylists();
                break;
            case 'favorites':
                this.loadFavorites();
                break;
        }
    }
    
    setupSearch() {
        const searchInput = document.getElementById('search-input');
        if (!searchInput) return;
        
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            
            // Очищаем предыдущий таймаут
            if (this.searchTimeout) {
                clearTimeout(this.searchTimeout);
            }
            
            // Устанавливаем новый таймаут для поиска
            this.searchTimeout = setTimeout(() => {
                if (query.length >= 2) {
                    this.performSearch(query);
                } else if (query.length === 0) {
                    this.clearSearchResults();
                }
            }, 500);
        });
    }
    
    async performSearch(query) {
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            if (response.ok) {
                this.displaySearchResults(data);
            } else {
                console.error('Search error:', data.error);
            }
        } catch (error) {
            console.error('Search failed:', error);
        }
    }
    
    displaySearchResults(data) {
        const searchResults = document.getElementById('search-results');
        if (!searchResults) return;
        
        let html = '<div class="search-results-header">';
        html += `<h3>Результаты поиска для "${data.query || 'запроса'}"</h3>`;
        html += '</div>';
        
        if (data.tracks && data.tracks.items.length > 0) {
            html += '<div class="search-category">';
            html += '<h4>Треки</h4>';
            html += '<div class="tracks-grid">';
            data.tracks.items.forEach(track => {
                html += this.createTrackCard(track);
            });
            html += '</div></div>';
        }
        
        if (data.artists && data.artists.items.length > 0) {
            html += '<div class="search-category">';
            html += '<h4>Исполнители</h4>';
            html += '<div class="artists-grid">';
            data.artists.items.forEach(artist => {
                html += this.createArtistCard(artist);
            });
            html += '</div></div>';
        }
        
        if (data.albums && data.albums.items.length > 0) {
            html += '<div class="search-category">';
            html += '<h4>Альбомы</h4>';
            html += '<div class="albums-grid">';
            data.albums.items.forEach(album => {
                html += this.createAlbumCard(album);
            });
            html += '</div></div>';
        }
        
        if (!data.tracks?.items.length && !data.artists?.items.length && !data.albums?.items.length) {
            html += '<div class="no-results">';
            html += '<i class="fas fa-search"></i>';
            html += '<p>Ничего не найдено</p>';
            html += '</div>';
        }
        
        searchResults.innerHTML = html;
    }
    
    clearSearchResults() {
        const searchResults = document.getElementById('search-results');
        if (searchResults) {
            searchResults.innerHTML = `
                <div class="search-placeholder">
                    <i class="fas fa-search"></i>
                    <p>Введите запрос для поиска</p>
                </div>
            `;
        }
    }
    
    createTrackCard(track) {
        const artists = track.artists.map(artist => artist.name).join(', ');
        const duration = this.formatDuration(track.duration_ms);
        
        return `
            <div class="track-card" data-uri="${track.uri}">
                <div class="track-cover">
                    <img src="${track.album.images[0]?.url || '/static/images/default-album.png'}" alt="${track.name}">
                    <div class="track-overlay">
                        <button class="play-btn" onclick="app.playTrack('${track.uri}')">
                            <i class="fas fa-play"></i>
                        </button>
                    </div>
                </div>
                <div class="track-info">
                    <h4 class="track-name">${track.name}</h4>
                    <p class="track-artist">${artists}</p>
                    <p class="track-album">${track.album.name}</p>
                    <span class="track-duration">${duration}</span>
                </div>
            </div>
        `;
    }
    
    createArtistCard(artist) {
        return `
            <div class="artist-card" data-id="${artist.id}">
                <div class="artist-avatar">
                    <img src="${artist.images[0]?.url || '/static/images/default-artist.png'}" alt="${artist.name}">
                </div>
                <div class="artist-info">
                    <h4 class="artist-name">${artist.name}</h4>
                    <p class="artist-genres">${artist.genres?.slice(0, 2).join(', ') || 'Популярная музыка'}</p>
                </div>
            </div>
        `;
    }
    
    createAlbumCard(album) {
        const artists = album.artists.map(artist => artist.name).join(', ');
        
        return `
            <div class="album-card" data-id="${album.id}">
                <div class="album-cover">
                    <img src="${album.images[0]?.url || '/static/images/default-album.png'}" alt="${album.name}">
                </div>
                <div class="album-info">
                    <h4 class="album-name">${album.name}</h4>
                    <p class="album-artist">${artists}</p>
                    <p class="album-year">${new Date(album.release_date).getFullYear()}</p>
                </div>
            </div>
        `;
    }
    
    async loadUserProfile() {
        try {
            const response = await fetch('/api/profile');
            const profile = await response.json();
            
            if (response.ok) {
                this.displayUserProfile(profile);
            } else {
                console.error('Failed to load profile:', profile.error);
            }
        } catch (error) {
            console.error('Profile loading failed:', error);
        }
    }
    
    displayUserProfile(profile) {
        const userName = document.getElementById('user-name');
        const userEmail = document.getElementById('user-email');
        const userAvatar = document.getElementById('user-avatar');
        
        if (userName) userName.textContent = profile.display_name || 'Пользователь';
        if (userEmail) userEmail.textContent = profile.email || '';
        
        if (userAvatar && profile.images && profile.images.length > 0) {
            userAvatar.innerHTML = `<img src="${profile.images[0].url}" alt="${profile.display_name}">`;
        }
    }
    
    async loadCurrentTrack() {
        try {
            const response = await fetch('/api/currently-playing');
            const data = await response.json();
            
            if (response.ok && data.item) {
                this.currentTrack = data.item;
                this.isPlaying = data.is_playing;
                this.displayCurrentTrack(data);
                this.updatePlaybackControls();
            } else {
                this.clearCurrentTrack();
            }
        } catch (error) {
            console.error('Failed to load current track:', error);
        }
    }
    
    displayCurrentTrack(data) {
        const currentTrackElement = document.getElementById('current-track');
        if (!currentTrackElement) return;
        
        const track = data.item;
        const artists = track.artists.map(artist => artist.name).join(', ');
        
        currentTrackElement.innerHTML = `
            <div class="track-info">
                <div class="track-cover">
                    <img src="${track.album.images[0]?.url || '/static/images/default-album.png'}" alt="${track.name}">
                </div>
                <div class="track-details">
                    <h3>${track.name}</h3>
                    <p>${artists}</p>
                    <p class="album-name">${track.album.name}</p>
                </div>
            </div>
            <div class="track-controls">
                <button class="control-btn" id="prev-btn" onclick="app.previousTrack()">
                    <i class="fas fa-backward"></i>
                </button>
                <button class="control-btn" id="play-btn" onclick="app.playTrack()">
                    <i class="fas fa-${data.is_playing ? 'pause' : 'play'}"></i>
                </button>
                <button class="control-btn" id="next-btn" onclick="app.nextTrack()">
                    <i class="fas fa-forward"></i>
                </button>
            </div>
        `;
    }
    
    clearCurrentTrack() {
        const currentTrackElement = document.getElementById('current-track');
        if (currentTrackElement) {
            currentTrackElement.innerHTML = `
                <div class="track-info">
                    <div class="track-cover">
                        <i class="fas fa-music"></i>
                    </div>
                    <div class="track-details">
                        <h3>Нет активного трека</h3>
                        <p>Начните воспроизведение в Spotify</p>
                    </div>
                </div>
                <div class="track-controls">
                    <button class="control-btn" disabled>
                        <i class="fas fa-play"></i>
                    </button>
                </div>
            `;
        }
    }
    
    updatePlaybackControls() {
        const playBtn = document.getElementById('play-btn');
        if (playBtn) {
            const icon = playBtn.querySelector('i');
            if (this.isPlaying) {
                icon.className = 'fas fa-pause';
            } else {
                icon.className = 'fas fa-play';
            }
        }
    }
    
    async playTrack(uri = null) {
        try {
            let endpoint = '/api/play';
            let method = 'PUT';
            let body = null;
            
            if (uri) {
                body = JSON.stringify({ uri: uri });
            } else {
                // Переключаем воспроизведение текущего трека
                endpoint = this.isPlaying ? '/api/pause' : '/api/play';
                method = 'PUT';
            }
            
            const response = await fetch(endpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: body
            });
            
            if (response.ok) {
                if (uri) {
                    // Обновляем текущий трек после небольшой задержки
                    setTimeout(() => this.loadCurrentTrack(), 1000);
                } else {
                    this.isPlaying = !this.isPlaying;
                    this.updatePlaybackControls();
                }
            }
        } catch (error) {
            console.error('Playback control failed:', error);
        }
    }
    
    async pauseTrack() {
        try {
            const response = await fetch('/api/pause', { method: 'PUT' });
            if (response.ok) {
                this.isPlaying = false;
                this.updatePlaybackControls();
            }
        } catch (error) {
            console.error('Pause failed:', error);
        }
    }
    
    async nextTrack() {
        try {
            const response = await fetch('/api/next', { method: 'POST' });
            if (response.ok) {
                setTimeout(() => this.loadCurrentTrack(), 1000);
            }
        } catch (error) {
            console.error('Next track failed:', error);
        }
    }
    
    async previousTrack() {
        try {
            const response = await fetch('/api/previous', { method: 'POST' });
            if (response.ok) {
                setTimeout(() => this.loadCurrentTrack(), 1000);
            }
        } catch (error) {
            console.error('Previous track failed:', error);
        }
    }
    
    async loadPlaylists() {
        try {
            const response = await fetch('/api/playlists');
            const data = await response.json();
            
            if (response.ok) {
                this.displayPlaylists(data.items || []);
            } else {
                console.error('Failed to load playlists:', data.error);
            }
        } catch (error) {
            console.error('Playlists loading failed:', error);
        }
    }
    
    displayPlaylists(playlists) {
        const playlistsGrid = document.getElementById('playlists-grid');
        if (!playlistsGrid) return;
        
        if (playlists.length === 0) {
            playlistsGrid.innerHTML = `
                <div class="no-content">
                    <i class="fas fa-list"></i>
                    <p>У вас пока нет плейлистов</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        playlists.forEach(playlist => {
            html += `
                <div class="playlist-card" data-id="${playlist.id}">
                    <div class="playlist-cover">
                        <img src="${playlist.images[0]?.url || '/static/images/default-playlist.png'}" alt="${playlist.name}">
                        <div class="playlist-overlay">
                            <button class="play-btn" onclick="app.playPlaylist('${playlist.uri}')">
                                <i class="fas fa-play"></i>
                            </button>
                        </div>
                    </div>
                    <div class="playlist-info">
                        <h4 class="playlist-name">${playlist.name}</h4>
                        <p class="playlist-tracks">${playlist.tracks.total} треков</p>
                        <p class="playlist-owner">${playlist.owner.display_name}</p>
                    </div>
                </div>
            `;
        });
        
        playlistsGrid.innerHTML = html;
    }
    
    async loadRecentTracks() {
        try {
            const response = await fetch('/api/recently-played');
            const data = await response.json();
            
            const recentTracks = document.getElementById('recent-tracks');
            if (!recentTracks) return;
            
            if (response.ok && data.items && data.items.length > 0) {
                let html = '';
                data.items.forEach(item => {
                    const track = item.track;
                    const artists = track.artists.map(artist => artist.name).join(', ');
                    
                    html += `
                        <div class="track-card" data-uri="${track.uri}">
                            <div class="track-cover">
                                <img src="${track.album.images[0]?.url || '/static/images/default-album.png'}" alt="${track.name}">
                                <div class="track-overlay">
                                    <button class="play-btn" onclick="app.playTrack('${track.uri}')">
                                        <i class="fas fa-play"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="track-info">
                                <h4 class="track-name">${track.name}</h4>
                                <p class="track-artist">${artists}</p>
                                <p class="track-album">${track.album.name}</p>
                            </div>
                        </div>
                    `;
                });
                recentTracks.innerHTML = html;
            } else {
                recentTracks.innerHTML = `
                    <div class="no-content">
                        <i class="fas fa-history"></i>
                        <p>Нет недавно прослушанных треков</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Failed to load recent tracks:', error);
            const recentTracks = document.getElementById('recent-tracks');
            if (recentTracks) {
                recentTracks.innerHTML = `
                    <div class="no-content">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Ошибка загрузки</p>
                    </div>
                `;
            }
        }
    }
    
    async loadRecommendations() {
        try {
            const response = await fetch('/api/recommendations');
            const data = await response.json();
            
            const recommendations = document.getElementById('recommendations');
            if (!recommendations) return;
            
            if (response.ok && data.tracks && data.tracks.length > 0) {
                let html = '';
                data.tracks.forEach(track => {
                    const artists = track.artists.map(artist => artist.name).join(', ');
                    
                    html += `
                        <div class="track-card" data-uri="${track.uri}">
                            <div class="track-cover">
                                <img src="${track.album.images[0]?.url || '/static/images/default-album.png'}" alt="${track.name}">
                                <div class="track-overlay">
                                    <button class="play-btn" onclick="app.playTrack('${track.uri}')">
                                        <i class="fas fa-play"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="track-info">
                                <h4 class="track-name">${track.name}</h4>
                                <p class="track-artist">${artists}</p>
                                <p class="track-album">${track.album.name}</p>
                            </div>
                        </div>
                    `;
                });
                recommendations.innerHTML = html;
            } else {
                recommendations.innerHTML = `
                    <div class="no-content">
                        <i class="fas fa-lightbulb"></i>
                        <p>Рекомендации появятся после прослушивания музыки</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Failed to load recommendations:', error);
            const recommendations = document.getElementById('recommendations');
            if (recommendations) {
                recommendations.innerHTML = `
                    <div class="no-content">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Ошибка загрузки рекомендаций</p>
                    </div>
                `;
            }
        }
    }
    
    async loadLibraryStats() {
        try {
            // Загружаем количество любимых треков
            const likedResponse = await fetch('/api/liked-tracks');
            if (likedResponse.ok) {
                const likedData = await likedResponse.json();
                const likedCount = likedData.total || 0;
                document.getElementById('liked-tracks-count').textContent = likedCount;
            }
            
            // Загружаем количество плейлистов
            const playlistsResponse = await fetch('/api/playlists');
            if (playlistsResponse.ok) {
                const playlistsData = await playlistsResponse.json();
                const playlistsCount = playlistsData.total || 0;
                document.getElementById('playlists-count').textContent = playlistsCount;
            }
            
            // Заглушка для времени прослушивания (Spotify API не предоставляет эту информацию)
            document.getElementById('listening-time').textContent = '∞ мин';
            
        } catch (error) {
            console.error('Failed to load library stats:', error);
            document.getElementById('liked-tracks-count').textContent = '0';
            document.getElementById('playlists-count').textContent = '0';
            document.getElementById('listening-time').textContent = '0 мин';
        }
    }
    
    async loadFavorites() {
        try {
            const response = await fetch('/api/liked-tracks');
            const data = await response.json();
            
            const favoritesGrid = document.getElementById('favorites-grid');
            if (!favoritesGrid) return;
            
            if (response.ok && data.items && data.items.length > 0) {
                let html = '';
                data.items.forEach(item => {
                    const track = item.track;
                    const artists = track.artists.map(artist => artist.name).join(', ');
                    const duration = this.formatDuration(track.duration_ms);
                    
                    html += `
                        <div class="track-card" data-uri="${track.uri}">
                            <div class="track-cover">
                                <img src="${track.album.images[0]?.url || '/static/images/default-album.png'}" alt="${track.name}">
                                <div class="track-overlay">
                                    <button class="play-btn" onclick="app.playTrack('${track.uri}')">
                                        <i class="fas fa-play"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="track-info">
                                <h4 class="track-name">${track.name}</h4>
                                <p class="track-artist">${artists}</p>
                                <p class="track-album">${track.album.name}</p>
                                <span class="track-duration">${duration}</span>
                            </div>
                        </div>
                    `;
                });
                favoritesGrid.innerHTML = html;
            } else {
                favoritesGrid.innerHTML = `
                    <div class="no-content">
                        <i class="fas fa-heart"></i>
                        <p>У вас пока нет любимых треков</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Failed to load favorites:', error);
            const favoritesGrid = document.getElementById('favorites-grid');
            if (favoritesGrid) {
                favoritesGrid.innerHTML = `
                    <div class="no-content">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Ошибка загрузки любимых треков</p>
                    </div>
                `;
            }
        }
    }
    
    async playPlaylist(playlistUri) {
        try {
            const response = await fetch('/api/play', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ uri: playlistUri })
            });
            
            if (response.ok) {
                setTimeout(() => this.loadCurrentTrack(), 1000);
            }
        } catch (error) {
            console.error('Play playlist failed:', error);
        }
    }
    
    setupModal() {
        const modal = document.getElementById('track-modal');
        const closeBtn = modal?.querySelector('.close');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }
        
        if (modal) {
            window.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
    }
    
    formatDuration(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Новые функции для управления плеером
    async setVolume(volume) {
        try {
            const response = await fetch('/api/volume', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ volume: volume })
            });
            
            if (response.ok) {
                console.log(`Volume set to ${volume}%`);
            }
        } catch (error) {
            console.error('Failed to set volume:', error);
        }
    }
    
    async toggleShuffle(state) {
        try {
            const response = await fetch('/api/shuffle', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ state: state })
            });
            
            if (response.ok) {
                console.log(`Shuffle ${state ? 'enabled' : 'disabled'}`);
            }
        } catch (error) {
            console.error('Failed to toggle shuffle:', error);
        }
    }
    
    async setRepeatMode(mode) {
        try {
            const response = await fetch('/api/repeat', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ state: mode })
            });
            
            if (response.ok) {
                console.log(`Repeat mode set to ${mode}`);
            }
        } catch (error) {
            console.error('Failed to set repeat mode:', error);
        }
    }
    
    async getPlayerState() {
        try {
            const response = await fetch('/api/player-state');
            if (response.ok) {
                const data = await response.json();
                return data;
            }
        } catch (error) {
            console.error('Failed to get player state:', error);
        }
        return null;
    }
    
    async refreshToken() {
        try {
            const response = await fetch('/api/refresh-token');
            if (response.ok) {
                const data = await response.json();
                console.log('Token refreshed successfully');
                return true;
            }
        } catch (error) {
            console.error('Failed to refresh token:', error);
        }
        return false;
    }
}

// Инициализация приложения
let app;
document.addEventListener('DOMContentLoaded', function() {
    app = new GoatMusicApp();
});
