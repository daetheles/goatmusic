#!/usr/bin/env python3
"""
Скрипт для тестирования API GoatMusic
Запускает базовые тесты без авторизации
"""

import requests
import json
from urllib.parse import urljoin

BASE_URL = "http://localhost:5000"

def test_endpoint(endpoint, method="GET", data=None, expected_status=200):
    """Тестирует API endpoint"""
    url = urljoin(BASE_URL, endpoint)
    
    try:
        if method == "GET":
            response = requests.get(url)
        elif method == "POST":
            response = requests.post(url, json=data)
        elif method == "PUT":
            response = requests.put(url, json=data)
        else:
            print(f"❌ Неподдерживаемый метод: {method}")
            return False
        
        if response.status_code == expected_status:
            print(f"✅ {method} {endpoint} - {response.status_code}")
            return True
        else:
            print(f"❌ {method} {endpoint} - Ожидался {expected_status}, получен {response.status_code}")
            if response.text:
                try:
                    error_data = response.json()
                    print(f"   Ошибка: {error_data.get('error', 'Неизвестная ошибка')}")
                except:
                    print(f"   Ответ: {response.text[:100]}...")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"❌ {method} {endpoint} - Не удается подключиться к серверу")
        return False
    except Exception as e:
        print(f"❌ {method} {endpoint} - Ошибка: {e}")
        return False

def main():
    print("🧪 Тестирование API GoatMusic")
    print("=" * 50)
    
    # Тестируем публичные endpoints
    print("\n📋 Тестирование публичных endpoints:")
    
    # Главная страница
    test_endpoint("/", "GET", expected_status=200)
    
    # Логин (должен перенаправить на Spotify)
    test_endpoint("/login", "GET", expected_status=302)
    
    # Логаут (должен перенаправить на главную)
    test_endpoint("/logout", "GET", expected_status=302)
    
    print("\n🔒 Тестирование защищенных endpoints (должны вернуть 401):")
    
    # API endpoints (должны требовать авторизацию)
    protected_endpoints = [
        "/api/profile",
        "/api/playlists", 
        "/api/search",
        "/api/currently-playing",
        "/api/recently-played",
        "/api/liked-tracks",
        "/api/recommendations"
    ]
    
    for endpoint in protected_endpoints:
        test_endpoint(endpoint, "GET", expected_status=401)
    
    print("\n🎵 Тестирование управления воспроизведением:")
    
    # Управление воспроизведением (должны требовать авторизацию)
    playback_endpoints = [
        ("/api/play", "PUT", {"uri": "spotify:track:test"}),
        ("/api/pause", "PUT", None),
        ("/api/next", "POST", None),
        ("/api/previous", "POST", None),
        ("/api/volume", "PUT", {"volume": 50}),
        ("/api/shuffle", "PUT", {"state": True}),
        ("/api/repeat", "PUT", {"state": "off"})
    ]
    
    for endpoint, method, data in playback_endpoints:
        if data:
            test_endpoint(endpoint, method, data, expected_status=401)
        else:
            test_endpoint(endpoint, method, None, expected_status=401)
    
    print("\n" + "=" * 50)
    print("🎯 Тестирование завершено!")
    print("\n💡 Для полного тестирования:")
    print("   1. Запустите приложение: python app.py")
    print("   2. Авторизуйтесь через Spotify")
    print("   3. Запустите тесты снова")
    
    print("\n📚 Документация API доступна в README.md")

if __name__ == "__main__":
    main()
