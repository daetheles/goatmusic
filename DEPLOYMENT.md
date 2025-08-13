# 🚀 Развертывание GoatMusic на хостинге

## 📋 Требования к хостингу

### Минимальные требования:
- **ОС**: Ubuntu 20.04+ или Debian 11+
- **RAM**: 1GB+
- **CPU**: 1 ядро+
- **Диск**: 10GB+
- **Домен**: goatmusic.online (уже настроен)

### Рекомендуемые требования:
- **ОС**: Ubuntu 22.04 LTS
- **RAM**: 2GB+
- **CPU**: 2 ядра+
- **Диск**: 20GB+ SSD

## 🔧 Подготовка к развертыванию

### 1. Настройка Spotify API

1. Перейдите на [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Откройте ваше приложение
3. Добавьте redirect URI: `https://goatmusic.online/callback`
4. Запишите `Client ID` и `Client Secret`

### 2. Подготовка файлов

Убедитесь, что у вас есть все необходимые файлы:
- `app.py` - основное приложение
- `requirements.txt` - зависимости Python
- `nginx.conf` - конфигурация Nginx
- `goatmusic.service` - systemd сервис
- `deploy.sh` - скрипт развертывания
- `production.env` - переменные окружения

## 🖥️ Развертывание на сервере

### Шаг 1: Подключение к серверу

```bash
ssh root@your-server-ip
```

### Шаг 2: Клонирование проекта

```bash
# Создание рабочей директории
mkdir -p /var/www
cd /var/www

# Клонирование вашего репозитория
git clone https://github.com/your-username/goatmusic.git
cd goatmusic

# Или загрузка файлов через SCP/SFTP
```

### Шаг 3: Запуск автоматического развертывания

```bash
# Сделать скрипт исполняемым
chmod +x deploy.sh

# Запуск развертывания
sudo ./deploy.sh
```

### Шаг 4: Настройка переменных окружения

```bash
# Отредактировать .env файл
nano /var/www/goatmusic/.env
```

Установите правильные значения:
```env
SPOTIFY_CLIENT_ID=your_actual_client_id
SPOTIFY_CLIENT_SECRET=your_actual_client_secret
SECRET_KEY=your_very_secure_random_key
```

### Шаг 5: Перезапуск сервисов

```bash
# Перезапуск приложения
sudo systemctl restart goatmusic

# Перезапуск Nginx
sudo systemctl restart nginx

# Проверка статуса
sudo systemctl status goatmusic
sudo systemctl status nginx
```

## 🔍 Проверка развертывания

### 1. Проверка доступности

```bash
# Проверка HTTP (должен перенаправлять на HTTPS)
curl -I http://goatmusic.online

# Проверка HTTPS
curl -I https://goatmusic.online

# Проверка API (должен вернуть 401 без авторизации)
curl -I https://goatmusic.online/api/profile
```

### 2. Проверка логов

```bash
# Логи приложения
sudo journalctl -u goatmusic -f

# Логи Nginx
sudo tail -f /var/log/nginx/goatmusic.access.log
sudo tail -f /var/log/nginx/goatmusic.error.log

# Логи приложения
sudo tail -f /var/www/goatmusic/logs/app.log
```

### 3. Проверка процессов

```bash
# Проверка запущенных процессов
ps aux | grep gunicorn
ps aux | grep nginx

# Проверка открытых портов
sudo netstat -tlnp | grep :5000
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
```

## 🛠️ Ручная настройка (альтернатива)

Если автоматическое развертывание не работает, выполните шаги вручную:

### 1. Установка зависимостей

```bash
# Обновление системы
apt update && apt upgrade -y

# Установка Python и зависимостей
apt install -y python3 python3-pip python3-venv nginx certbot python3-certbot-nginx

# Создание виртуального окружения
cd /var/www/goatmusic
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Настройка Nginx

```bash
# Копирование конфигурации
cp nginx.conf /etc/nginx/sites-available/goatmusic.online

# Активация сайта
ln -s /etc/nginx/sites-available/goatmusic.online /etc/nginx/sites-enabled/

# Проверка и перезапуск
nginx -t
systemctl restart nginx
```

### 3. Настройка SSL

```bash
# Получение SSL сертификата
certbot --nginx -d goatmusic.online -d www.goatmusic.online

# Автоматическое обновление
crontab -e
# Добавить: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 4. Настройка systemd

```bash
# Копирование файла сервиса
cp goatmusic.service /etc/systemd/system/

# Включение и запуск
systemctl daemon-reload
systemctl enable goatmusic
systemctl start goatmusic
```

## 🔒 Безопасность

### 1. Firewall

```bash
# Установка UFW
apt install -y ufw

# Настройка правил
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable
```

### 2. Обновление системы

```bash
# Автоматические обновления безопасности
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

### 3. Мониторинг

```bash
# Установка fail2ban
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

## 📊 Мониторинг и обслуживание

### 1. Автоматический перезапуск

```bash
# Проверка автозапуска
systemctl is-enabled goatmusic
systemctl is-enabled nginx

# Включение автозапуска
systemctl enable goatmusic
systemctl enable nginx
```

### 2. Логирование

```bash
# Ротация логов
nano /etc/logrotate.d/goatmusic
```

Содержимое:
```
/var/www/goatmusic/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
}
```

### 3. Резервное копирование

```bash
# Создание скрипта бэкапа
nano /usr/local/bin/backup-goatmusic.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/backup/goatmusic"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/goatmusic_$DATE.tar.gz /var/www/goatmusic
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

## 🚨 Устранение проблем

### Проблема: Приложение не запускается

```bash
# Проверка статуса
systemctl status goatmusic

# Просмотр логов
journalctl -u goatmusic -f

# Проверка конфигурации
gunicorn --config gunicorn.conf.py wsgi:app --check-config
```

### Проблема: Nginx не работает

```bash
# Проверка конфигурации
nginx -t

# Проверка статуса
systemctl status nginx

# Просмотр логов
tail -f /var/log/nginx/error.log
```

### Проблема: SSL сертификат не работает

```bash
# Проверка сертификата
certbot certificates

# Обновление сертификата
certbot renew --dry-run

# Проверка Nginx конфигурации
nginx -t
```

## 🔄 Обновление приложения

### 1. Остановка сервиса

```bash
systemctl stop goatmusic
```

### 2. Обновление кода

```bash
cd /var/www/goatmusic
git pull origin main
# Или загрузка новых файлов
```

### 3. Обновление зависимостей

```bash
source venv/bin/activate
pip install -r requirements.txt
```

### 4. Перезапуск

```bash
systemctl start goatmusic
systemctl reload nginx
```

## 📞 Поддержка

### Полезные команды:

```bash
# Статус всех сервисов
systemctl status goatmusic nginx

# Просмотр логов в реальном времени
journalctl -u goatmusic -f &
tail -f /var/log/nginx/goatmusic.access.log &

# Проверка доступности
curl -I https://goatmusic.online
curl -I https://goatmusic.online/api/profile

# Перезапуск всех сервисов
systemctl restart goatmusic nginx
```

### Контакты для поддержки:
- **Документация**: README.md, SETUP.md
- **Логи**: /var/log/nginx/, journalctl -u goatmusic
- **Конфигурация**: /etc/nginx/sites-available/goatmusic.online

---

**🎉 Поздравляем! Ваше приложение GoatMusic теперь доступно по адресу https://goatmusic.online**
