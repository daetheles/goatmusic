# 🔧 Настройка и запуск GoatMusic

## 🚀 Быстрый старт

### 1. Установка зависимостей
```bash
py -m pip install -r requirements.txt
```

### 2. Настройка Spotify API

1. Перейдите на [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Создайте новое приложение
3. Получите `Client ID`
4. Добавьте redirect URI: `http://localhost:5000/callback`
5. Скопируйте `Client ID` в переменную окружения

### 3. Запуск приложения

#### Вариант 1: Прямой запуск
```bash
py app.py
```

#### Вариант 2: Через скрипт запуска
```bash
# Windows
start.bat

# Linux/Mac
./start.sh
```

#### Вариант 3: С параметрами
```bash
py run.py --debug
py run.py --production
```

### 4. Доступ к приложению
Откройте браузер и перейдите по адресу: **http://localhost:5000**

## 🔍 Тестирование

### Тест API без авторизации
```bash
py test_api.py
```

### Ожидаемые результаты:
- ✅ Главная страница (`/`) - 200 OK
- ✅ Защищенные API endpoints - 401 Unauthorized
- ❌ Логин/логаут - должны перенаправлять (302), но пока возвращают 200

## 🐛 Устранение проблем

### Проблема: "Python не найден"
**Решение:** Используйте команду `py` вместо `python` в Windows

### Проблема: "ModuleNotFoundError: No module named 'requests'"
**Решение:** Установите зависимости: `py -m pip install -r requirements.txt`

### Проблема: "Не удается подключиться к серверу"
**Решение:** Убедитесь, что приложение запущено: `py app.py`

### Проблема: Spotify API ошибки
**Решение:** 
1. Проверьте правильность `SPOTIFY_CLIENT_ID`
2. Убедитесь, что redirect URI настроен правильно
3. Проверьте, что приложение зарегистрировано в Spotify Developer Dashboard

## 📁 Структура проекта

```
GoatMusic/
├── app.py                 # Основное Flask приложение
├── requirements.txt       # Python зависимости
├── static/               # Статические файлы (CSS, JS, изображения)
├── templates/            # HTML шаблоны
├── start.bat            # Скрипт запуска для Windows
├── start.sh             # Скрипт запуска для Linux/Mac
├── run.py               # Расширенный скрипт запуска
├── test_api.py          # Тестирование API
├── Dockerfile           # Docker конфигурация
├── docker-compose.yml   # Docker Compose
├── gunicorn.conf.py     # Конфигурация Gunicorn
├── wsgi.py              # WSGI entry point
├── README.md            # Основная документация
├── QUICKSTART.md        # Быстрый старт
└── .gitignore           # Исключения Git
```

## 🌐 Развертывание

### Локальная разработка
```bash
py app.py
```

### Продакшен с Gunicorn
```bash
gunicorn --config gunicorn.conf.py wsgi:app
```

### Docker развертывание
```bash
docker build -t goatmusic .
docker run -p 5000:5000 goatmusic
```

### Docker Compose
```bash
docker-compose up -d
```

## 🔐 Переменные окружения

Создайте файл `.env` в корне проекта:

```env
# Spotify API
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here

# Flask
SECRET_KEY=your_secret_key_here
FLASK_ENV=development
FLASK_DEBUG=True

# Server
HOST=0.0.0.0
PORT=5000
```

## 📱 Функциональность

### ✅ Реализовано:
- 🔐 OAuth 2.0 авторизация через Spotify
- 🎵 Воспроизведение музыки
- 🔍 Поиск треков, исполнителей, альбомов
- 📊 Профиль пользователя и плейлисты
- ❤️ Любимые треки
- 📈 Рекомендации
- 🎛️ Управление воспроизведением
- 📱 Адаптивный дизайн

### 🚧 В разработке:
- 🔄 Автоматическое обновление токенов
- 📊 Статистика прослушивания
- 🌐 Социальные функции

## 🎯 Следующие шаги

1. **Настройте Spotify API** - получите Client ID
2. **Запустите приложение** - `py app.py`
3. **Протестируйте API** - `py test_api.py`
4. **Откройте в браузере** - http://localhost:5000
5. **Авторизуйтесь через Spotify** и протестируйте функциональность

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте логи приложения
2. Убедитесь, что все зависимости установлены
3. Проверьте настройки Spotify API
4. Создайте issue в репозитории

---

**🎵 Готово! Ваш клон Spotify работает!**
