# 🚀 Быстрый старт GoatMusic

## 📋 Требования

- Python 3.7+
- Spotify аккаунт
- Spotify Developer приложение

## ⚡ Быстрый запуск

### Windows
```bash
start.bat
```

### Linux/Mac
```bash
./start.sh
```

### Ручной запуск
```bash
# 1. Установка зависимостей
pip install -r requirements.txt

# 2. Создание .env файла
# Скопируйте .env.example и заполните своими данными

# 3. Запуск
python app.py
```

## 🔧 Настройка Spotify API

1. Перейдите на [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Создайте новое приложение
3. Получите `Client ID`
4. Добавьте redirect URI: `http://localhost:5000/callback`
5. Создайте файл `.env`:

```env
SPOTIFY_CLIENT_ID=your_client_id_here
SECRET_KEY=your_secret_key_here
```

## 🌐 Доступ

После запуска откройте: http://localhost:5000

## 🧪 Тестирование

```bash
python test_api.py
```

## 📚 Подробная документация

См. [README.md](README.md) для полной документации.
