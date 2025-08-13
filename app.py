import os
import secrets
import hashlib
import base64
import requests
from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Загружаем переменные окружения
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', secrets.token_hex(32))
CORS(app)

# Spotify API конфигурация
SPOTIFY_CLIENT_ID = os.getenv('SPOTIFY_CLIENT_ID')
SPOTIFY_REDIRECT_URI = 'https://goatmusic.online/callback'
SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize'
SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
SPOTIFY_API_BASE = 'https://api.spotify.com/v1'

# Scopes для доступа к Spotify API
SCOPES = [
    'user-read-private',
    'user-read-email',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'user-read-recently-played',
    'user-top-read',
    'playlist-read-private',
    'playlist-read-collaborative',
    'playlist-modify-public',
    'playlist-modify-private'
]

def generate_code_verifier(length=128):
    """Генерирует code verifier для PKCE"""
    token = secrets.token_urlsafe(length)
    return token[:length]

def generate_code_challenge(code_verifier):
    """Генерирует code challenge из code verifier"""
    sha256_hash = hashlib.sha256(code_verifier.encode('utf-8')).digest()
    code_challenge = base64.urlsafe_b64encode(sha256_hash).decode('utf-8').rstrip('=')
    return code_challenge

@app.route('/')
def index():
    """Главная страница"""
    return render_template('index.html')

@app.route('/login')
def login():
    """Начинает процесс авторизации Spotify"""
    code_verifier = generate_code_verifier()
    code_challenge = generate_code_challenge(code_verifier)
    
    # Сохраняем code_verifier в сессии
    session['code_verifier'] = code_verifier
    
    # Параметры для авторизации
    auth_params = {
        'response_type': 'code',
        'client_id': SPOTIFY_CLIENT_ID,
        'scope': ' '.join(SCOPES),
        'code_challenge_method': 'S256',
        'code_challenge': code_challenge,
        'redirect_uri': SPOTIFY_REDIRECT_URI,
        'state': secrets.token_urlsafe(32)
    }
    
    # Создаем URL для авторизации
    auth_url = f"{SPOTIFY_AUTH_URL}?{requests.compat.urlencode(auth_params)}"
    return redirect(auth_url)

@app.route('/callback')
def callback():
    """Обработка callback от Spotify после авторизации"""
    error = request.args.get('error')
    if error:
        return f"Ошибка авторизации: {error}"
    
    code = request.args.get('code')
    if not code:
        return "Код авторизации не получен"
    
    # Получаем code_verifier из сессии
    code_verifier = session.get('code_verifier')
    if not code_verifier:
        return "Code verifier не найден в сессии"
    
    # Обмениваем код на access token
    token_data = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': SPOTIFY_REDIRECT_URI,
        'client_id': SPOTIFY_CLIENT_ID,
        'code_verifier': code_verifier
    }
    
    response = requests.post(SPOTIFY_TOKEN_URL, data=token_data)
    
    if response.status_code == 200:
        token_info = response.json()
        
        # Сохраняем токены в сессии
        session['access_token'] = token_info['access_token']
        session['refresh_token'] = token_info.get('refresh_token')
        session['token_expires_at'] = token_info.get('expires_in', 3600)
        
        return redirect(url_for('dashboard'))
    else:
        return f"Ошибка получения токена: {response.text}"

@app.route('/dashboard')
def dashboard():
    """Главная панель приложения"""
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    return render_template('dashboard.html')

@app.route('/api/profile')
def get_profile():
    """Получает профиль пользователя"""
    if 'access_token' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    headers = {'Authorization': f"Bearer {session['access_token']}"}
    response = requests.get(f"{SPOTIFY_API_BASE}/me", headers=headers)
    
    if response.status_code == 200:
        return jsonify(response.json())
    else:
        return jsonify({'error': 'Failed to fetch profile'}), response.status_code

@app.route('/api/playlists')
def get_playlists():
    """Получает плейлисты пользователя"""
    if 'access_token' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    headers = {'Authorization': f"Bearer {session['access_token']}"}
    response = requests.get(f"{SPOTIFY_API_BASE}/me/playlists", headers=headers)
    
    if response.status_code == 200:
        return jsonify(response.json())
    else:
        return jsonify({'error': 'Failed to fetch playlists'}), response.status_code

@app.route('/api/search')
def search():
    """Поиск по Spotify"""
    if 'access_token' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    query = request.args.get('q', '')
    if not query:
        return jsonify({'error': 'Query parameter required'}), 400
    
    headers = {'Authorization': f"Bearer {session['access_token']}"}
    params = {
        'q': query,
        'type': 'track,artist,album',
        'limit': 20
    }
    
    response = requests.get(f"{SPOTIFY_API_BASE}/search", headers=headers, params=params)
    
    if response.status_code == 200:
        return jsonify(response.json())
    else:
        return jsonify({'error': 'Search failed'}), response.status_code

@app.route('/api/currently-playing')
def get_currently_playing():
    """Получает текущий трек"""
    if 'access_token' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    headers = {'Authorization': f"Bearer {session['access_token']}"}
    response = requests.get(f"{SPOTIFY_API_BASE}/me/player/currently-playing", headers=headers)
    
    if response.status_code == 200:
        return jsonify(response.json())
    else:
        return jsonify({'error': 'Failed to fetch currently playing'}), response.status_code

@app.route('/api/play')
def play_track():
    """Воспроизводит трек"""
    if 'access_token' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    track_uri = request.json.get('uri')
    if not track_uri:
        return jsonify({'error': 'Track URI required'}), 400
    
    headers = {'Authorization': f"Bearer {session['access_token']}"}
    data = {'uris': [track_uri]}
    
    response = requests.put(f"{SPOTIFY_API_BASE}/me/player/play", headers=headers, json=data)
    
    if response.status_code in [200, 204]:
        return jsonify({'success': True})
    else:
        return jsonify({'error': 'Failed to play track'}), response.status_code

@app.route('/api/pause')
def pause_track():
    """Приостанавливает воспроизведение"""
    if 'access_token' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    headers = {'Authorization': f"Bearer {session['access_token']}"}
    response = requests.put(f"{SPOTIFY_API_BASE}/me/player/pause", headers=headers)
    
    if response.status_code in [200, 204]:
        return jsonify({'success': True})
    else:
        return jsonify({'error': 'Failed to pause'}), response.status_code

@app.route('/api/next')
def next_track():
    """Следующий трек"""
    if 'access_token' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    headers = {'Authorization': f"Bearer {session['access_token']}"}
    response = requests.post(f"{SPOTIFY_API_BASE}/me/player/next", headers=headers)
    
    if response.status_code in [200, 204]:
        return jsonify({'success': True})
    else:
        return jsonify({'error': 'Failed to skip to next'}), response.status_code

@app.route('/api/previous')
def previous_track():
    """Предыдущий трек"""
    if 'access_token' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    headers = {'Authorization': f"Bearer {session['access_token']}"}
    response = requests.post(f"{SPOTIFY_API_BASE}/me/player/previous", headers=headers)
    
    if response.status_code in [200, 204]:
        return jsonify({'success': True})
    else:
        return jsonify({'error': 'Failed to skip to previous'}), response.status_code

@app.route('/api/recently-played')
def get_recently_played():
    """Получает недавно прослушанные треки"""
    if 'access_token' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    headers = {'Authorization': f"Bearer {session['access_token']}"}
    params = {'limit': 20}
    
    response = requests.get(f"{SPOTIFY_API_BASE}/me/player/recently-played", headers=headers, params=params)
    
    if response.status_code == 200:
        return jsonify(response.json())
    else:
        return jsonify({'error': 'Failed to fetch recently played'}), response.status_code

@app.route('/api/liked-tracks')
def get_liked_tracks():
    """Получает любимые треки пользователя"""
    if 'access_token' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    headers = {'Authorization': f"Bearer {session['access_token']}"}
    params = {'limit': 50}
    
    response = requests.get(f"{SPOTIFY_API_BASE}/me/tracks", headers=headers, params=params)
    
    if response.status_code == 200:
        return jsonify(response.json())
    else:
        return jsonify({'error': 'Failed to fetch liked tracks'}), response.status_code

@app.route('/api/recommendations')
def get_recommendations():
    """Получает рекомендации на основе любимых треков"""
    if 'access_token' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    headers = {'Authorization': f"Bearer {session['access_token']}"}
    
    # Сначала получаем любимые треки для seed
    liked_response = requests.get(f"{SPOTIFY_API_BASE}/me/tracks", headers=headers, params={'limit': 5})
    
    if liked_response.status_code != 200:
        return jsonify({'error': 'Failed to fetch liked tracks for recommendations'}), liked_response.status_code
    
    liked_data = liked_response.json()
    if not liked_data.get('items'):
        return jsonify({'error': 'No liked tracks found'}), 400
    
    # Берем ID первых 5 любимых треков
    seed_tracks = ','.join([item['track']['id'] for item in liked_data['items'][:5]])
    
    # Получаем рекомендации
    params = {
        'seed_tracks': seed_tracks,
        'limit': 20,
        'market': 'from_token'
    }
    
    response = requests.get(f"{SPOTIFY_API_BASE}/recommendations", headers=headers, params=params)
    
    if response.status_code == 200:
        return jsonify(response.json())
    else:
        return jsonify({'error': 'Failed to fetch recommendations'}), response.status_code

@app.route('/api/playlist/<playlist_id>')
def get_playlist(playlist_id):
    """Получает конкретный плейлист"""
    if 'access_token' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    headers = {'Authorization': f"Bearer {session['access_token']}"}
    response = requests.get(f"{SPOTIFY_API_BASE}/playlists/{playlist_id}", headers=headers)
    
    if response.status_code == 200:
        return jsonify(response.json())
    else:
        return jsonify({'error': 'Failed to fetch playlist'}), response.status_code

@app.route('/api/artist/<artist_id>')
def get_artist(artist_id):
    """Получает информацию об исполнителе"""
    if 'access_token' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    headers = {'Authorization': f"Bearer {session['access_token']}"}
    response = requests.get(f"{SPOTIFY_API_BASE}/artists/{artist_id}", headers=headers)
    
    if response.status_code == 200:
        return jsonify(response.json())
    else:
        return jsonify({'error': 'Failed to fetch artist'}), response.status_code

@app.route('/api/artist/<artist_id>/top-tracks')
def get_artist_top_tracks(artist_id):
    """Получает топ треки исполнителя"""
    if 'access_token' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    headers = {'Authorization': f"Bearer {session['access_token']}"}
    params = {'market': 'from_token'}
    
    response = requests.get(f"{SPOTIFY_API_BASE}/artists/{artist_id}/top-tracks", headers=headers, params=params)
    
    if response.status_code == 200:
        return jsonify(response.json())
    else:
        return jsonify({'error': 'Failed to fetch artist top tracks'}), response.status_code

@app.route('/api/album/<album_id>')
def get_album(album_id):
    """Получает информацию об альбоме"""
    if 'access_token' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    headers = {'Authorization': f"Bearer {session['access_token']}"}
    params = {'market': 'from_token'}
    
    response = requests.get(f"{SPOTIFY_API_BASE}/albums/{album_id}", headers=headers, params=params)
    
    if response.status_code == 200:
        return jsonify(response.json())
    else:
        return jsonify({'error': 'Failed to fetch album'}), response.status_code

@app.route('/api/volume')
def set_volume():
    """Устанавливает громкость воспроизведения"""
    if 'access_token' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    volume = request.json.get('volume', 50)
    if not isinstance(volume, int) or volume < 0 or volume > 100:
        return jsonify({'error': 'Volume must be between 0 and 100'}), 400
    
    headers = {'Authorization': f"Bearer {session['access_token']}"}
    params = {'volume_percent': volume}
    
    response = requests.put(f"{SPOTIFY_API_BASE}/me/player/volume", headers=headers, params=params)
    
    if response.status_code in [200, 204]:
        return jsonify({'success': True, 'volume': volume})
    else:
        return jsonify({'error': 'Failed to set volume'}), response.status_code

@app.route('/api/shuffle')
def toggle_shuffle():
    """Переключает режим перемешивания"""
    if 'access_token' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    state = request.json.get('state', True)
    headers = {'Authorization': f"Bearer {session['access_token']}"}
    params = {'state': state}
    
    response = requests.put(f"{SPOTIFY_API_BASE}/me/player/shuffle", headers=headers, params=params)
    
    if response.status_code in [200, 204]:
        return jsonify({'success': True, 'shuffle': state})
    else:
        return jsonify({'error': 'Failed to toggle shuffle'}), response.status_code

@app.route('/api/repeat')
def set_repeat_mode():
    """Устанавливает режим повтора"""
    if 'access_token' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    state = request.json.get('state', 'off')  # off, track, context
    if state not in ['off', 'track', 'context']:
        return jsonify({'error': 'Invalid repeat state'}), 400
    
    headers = {'Authorization': f"Bearer {session['access_token']}"}
    params = {'state': state}
    
    response = requests.put(f"{SPOTIFY_API_BASE}/me/player/repeat", headers=headers, params=params)
    
    if response.status_code in [200, 204]:
        return jsonify({'success': True, 'repeat': state})
    else:
        return jsonify({'error': 'Failed to set repeat mode'}), response.status_code

@app.route('/api/player-state')
def get_player_state():
    """Получает состояние плеера"""
    if 'access_token' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    headers = {'Authorization': f"Bearer {session['access_token']}"}
    response = requests.get(f"{SPOTIFY_API_BASE}/me/player", headers=headers)
    
    if response.status_code == 200:
        return jsonify(response.json())
    else:
        return jsonify({'error': 'Failed to fetch player state'}), response.status_code

@app.route('/api/refresh-token')
def refresh_access_token():
    """Обновляет access token используя refresh token"""
    if 'refresh_token' not in session:
        return jsonify({'error': 'No refresh token available'}), 400
    
    token_data = {
        'grant_type': 'refresh_token',
        'refresh_token': session['refresh_token'],
        'client_id': SPOTIFY_CLIENT_ID
    }
    
    response = requests.post(SPOTIFY_TOKEN_URL, data=token_data)
    
    if response.status_code == 200:
        token_info = response.json()
        
        # Обновляем токены в сессии
        session['access_token'] = token_info['access_token']
        if 'refresh_token' in token_info:
            session['refresh_token'] = token_info['refresh_token']
        session['token_expires_at'] = token_info.get('expires_in', 3600)
        
        return jsonify({'success': True, 'access_token': token_info['access_token']})
    else:
        return jsonify({'error': 'Failed to refresh token'}), response.status_code

@app.route('/logout')
def logout():
    """Выход из системы"""
    session.clear()
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
