# GoatMusic - Клон Spotify

GoatMusic - это веб-приложение-клон Spotify, созданное на Python Flask с интеграцией Spotify Web API.

## Возможности

- 🔐 Авторизация через Spotify OAuth 2.0
- 🎵 Воспроизведение музыки через Spotify
- 🔍 Поиск треков, исполнителей и альбомов
- 📱 Адаптивный дизайн для всех устройств
- 🎧 Управление воспроизведением (play/pause, next/previous)
- 📊 Просмотр профиля и плейлистов
- ❤️ Любимые треки
- 📈 Рекомендации на основе предпочтений
- 🎛️ Управление громкостью, перемешиванием и повтором

## Технологии

- **Backend**: Python Flask
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **API**: Spotify Web API
- **Аутентификация**: OAuth 2.0 с PKCE
- **Стили**: CSS Grid, Flexbox, CSS Variables
- **Иконки**: Font Awesome

## Установка и настройка

### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd GoatMusic
```

### 2. Установка зависимостей

```bash
pip install -r requirements.txt
```

### 3. Настройка Spotify API

1. Перейдите на [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Создайте новое приложение
3. Получите `Client ID` и `Client Secret`
4. Добавьте redirect URI: `https://goatmusic.online/callback` (для продакшена) или `http://localhost:5000/callback` (для разработки)

### 4. Создание файла конфигурации

Создайте файл `.env` в корневой папке проекта:

```env
# Spotify API Configuration
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here

# Flask Configuration
SECRET_KEY=your_secret_key_here
FLASK_ENV=development
FLASK_DEBUG=True

# Server Configuration
HOST=0.0.0.0
PORT=5000
```

### 5. Запуск приложения

```bash
python app.py
```

Приложение будет доступно по адресу: `http://localhost:5000`

## Структура проекта

```
GoatMusic/
├── app.py                 # Основной Flask приложение
├── requirements.txt       # Зависимости Python
├── .env                  # Конфигурация (создать самостоятельно)
├── README.md             # Документация
├── static/               # Статические файлы
│   ├── css/
│   │   └── style.css     # Основные стили
│   ├── js/
│   │   ├── landing.js    # JavaScript для лендинга
│   │   └── dashboard.js  # JavaScript для dashboard
│   └── images/           # Изображения
└── templates/            # HTML шаблоны
    ├── index.html        # Лендинговая страница
    └── dashboard.html    # Основная панель приложения
```

## API Endpoints

### Аутентификация
- `GET /login` - Начало авторизации Spotify
- `GET /callback` - Обработка callback от Spotify
- `GET /logout` - Выход из системы

### Основные API
- `GET /api/profile` - Профиль пользователя
- `GET /api/playlists` - Плейлисты пользователя
- `GET /api/search` - Поиск по Spotify
- `GET /api/currently-playing` - Текущий трек

### Управление воспроизведением
- `PUT /api/play` - Воспроизведение трека
- `PUT /api/pause` - Пауза
- `POST /api/next` - Следующий трек
- `POST /api/previous` - Предыдущий трек

### Дополнительные возможности
- `GET /api/recently-played` - Недавно прослушанные
- `GET /api/liked-tracks` - Любимые треки
- `GET /api/recommendations` - Рекомендации
- `PUT /api/volume` - Управление громкостью
- `PUT /api/shuffle` - Перемешивание
- `PUT /api/repeat` - Режим повтора

## Разработка

### Добавление новых функций

1. Создайте новый API endpoint в `app.py`
2. Добавьте соответствующую логику в `dashboard.js`
3. Обновите HTML шаблоны при необходимости
4. Добавьте стили в `style.css`

### Тестирование

```bash
# Запуск в режиме отладки
export FLASK_ENV=development
export FLASK_DEBUG=1
python app.py
```

## Развертывание

### Локальное развертывание

```bash
python app.py
```

### Продакшен развертывание

```bash
# Используйте Gunicorn для продакшена
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Docker развертывание

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 5000
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

## Безопасность

- Используется OAuth 2.0 с PKCE для безопасной авторизации
- Токены хранятся в сессии сервера
- Поддержка refresh token для автоматического обновления
- Валидация всех входящих данных

## Лицензия

Этот проект создан в образовательных целях. Spotify является зарегистрированной торговой маркой Spotify AB.

## Поддержка

Если у вас возникли вопросы или проблемы:

1. Проверьте правильность настройки Spotify API
2. Убедитесь, что все зависимости установлены
3. Проверьте логи приложения
4. Создайте issue в репозитории

## Вклад в проект

Мы приветствуем вклад в развитие проекта! Пожалуйста:

1. Fork репозиторий
2. Создайте feature branch
3. Внесите изменения
4. Создайте Pull Request

## Планы развития

- [ ] Поддержка мобильных приложений
- [ ] Офлайн режим
- [ ] Социальные функции
- [ ] Аналитика прослушивания
- [ ] Интеграция с другими сервисами
