#!/bin/bash

# Скрипт развертывания GoatMusic на продакшен сервер
# Использование: ./deploy.sh [production|staging]

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Конфигурация
APP_NAME="goatmusic"
APP_DIR="/var/www/goatmusic"
SERVICE_NAME="goatmusic"
NGINX_SITE="goatmusic.online"

# Функции
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверка прав
check_permissions() {
    if [[ $EUID -ne 0 ]]; then
        log_error "Этот скрипт должен быть запущен с правами root"
        exit 1
    fi
}

# Создание структуры директорий
create_directories() {
    log_info "Создание структуры директорий..."
    
    mkdir -p $APP_DIR
    mkdir -p $APP_DIR/logs
    mkdir -p $APP_DIR/static/images
    mkdir -p /var/log/nginx
    mkdir -p /etc/nginx/sites-available
    mkdir -p /etc/nginx/sites-enabled
    
    log_success "Директории созданы"
}

# Установка зависимостей системы
install_system_dependencies() {
    log_info "Установка системных зависимостей..."
    
    apt-get update
    apt-get install -y python3 python3-pip python3-venv nginx certbot python3-certbot-nginx
    
    log_success "Системные зависимости установлены"
}

# Настройка Python окружения
setup_python_env() {
    log_info "Настройка Python окружения..."
    
    cd $APP_DIR
    
    # Создание виртуального окружения
    python3 -m venv venv
    source venv/bin/activate
    
    # Установка зависимостей
    pip install --upgrade pip
    pip install -r requirements.txt
    
    log_success "Python окружение настроено"
}

# Настройка Nginx
setup_nginx() {
    log_info "Настройка Nginx..."
    
    # Копирование конфигурации
    cp nginx.conf /etc/nginx/sites-available/$NGINX_SITE
    
    # Активация сайта
    ln -sf /etc/nginx/sites-available/$NGINX_SITE /etc/nginx/sites-enabled/
    
    # Удаление дефолтного сайта
    rm -f /etc/nginx/sites-enabled/default
    
    # Проверка конфигурации
    nginx -t
    
    # Перезапуск Nginx
    systemctl restart nginx
    systemctl enable nginx
    
    log_success "Nginx настроен"
}

# Настройка SSL сертификата
setup_ssl() {
    log_info "Настройка SSL сертификата..."
    
    # Получение SSL сертификата от Let's Encrypt
    certbot --nginx -d $NGINX_SITE -d www.$NGINX_SITE --non-interactive --agree-tos --email admin@$NGINX_SITE
    
    log_success "SSL сертификат настроен"
}

# Настройка systemd сервиса
setup_systemd() {
    log_info "Настройка systemd сервиса..."
    
    # Копирование файла сервиса
    cp goatmusic.service /etc/systemd/system/
    
    # Перезагрузка systemd
    systemctl daemon-reload
    
    # Включение и запуск сервиса
    systemctl enable $SERVICE_NAME
    systemctl start $SERVICE_NAME
    
    log_success "Systemd сервис настроен"
}

# Настройка прав доступа
setup_permissions() {
    log_info "Настройка прав доступа..."
    
    # Создание пользователя www-data если не существует
    id -u www-data &>/dev/null || useradd -r -s /bin/false www-data
    
    # Установка прав на директории
    chown -R www-data:www-data $APP_DIR
    chmod -R 755 $APP_DIR
    chmod -R 777 $APP_DIR/logs
    
    log_success "Права доступа настроены"
}

# Настройка firewall
setup_firewall() {
    log_info "Настройка firewall..."
    
    # UFW (если установлен)
    if command -v ufw &> /dev/null; then
        ufw allow 22/tcp
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw --force enable
        log_success "Firewall настроен"
    else
        log_warning "UFW не установлен, настройте firewall вручную"
    fi
}

# Создание .env файла
create_env_file() {
    log_info "Создание .env файла..."
    
    if [ ! -f "$APP_DIR/.env" ]; then
        cp production.env $APP_DIR/.env
        log_warning "Файл .env создан из шаблона. Отредактируйте его вручную!"
        log_warning "Не забудьте установить SPOTIFY_CLIENT_ID и SECRET_KEY!"
    fi
    
    log_success ".env файл настроен"
}

# Проверка развертывания
check_deployment() {
    log_info "Проверка развертывания..."
    
    # Проверка статуса сервиса
    if systemctl is-active --quiet $SERVICE_NAME; then
        log_success "Сервис $SERVICE_NAME запущен"
    else
        log_error "Сервис $SERVICE_NAME не запущен"
        systemctl status $SERVICE_NAME
    fi
    
    # Проверка Nginx
    if systemctl is-active --quiet nginx; then
        log_success "Nginx запущен"
    else
        log_error "Nginx не запущен"
    fi
    
    # Проверка доступности приложения
    sleep 5
    if curl -s -f https://$NGINX_SITE > /dev/null; then
        log_success "Приложение доступно по адресу https://$NGINX_SITE"
    else
        log_error "Приложение недоступно"
    fi
}

# Основная функция
main() {
    log_info "Начинаем развертывание GoatMusic..."
    
    check_permissions
    create_directories
    install_system_dependencies
    setup_python_env
    setup_nginx
    setup_ssl
    setup_systemd
    setup_permissions
    setup_firewall
    create_env_file
    check_deployment
    
    log_success "Развертывание завершено!"
    log_info "Ваше приложение доступно по адресу: https://$NGINX_SITE"
    log_info "Для просмотра логов используйте: journalctl -u $SERVICE_NAME -f"
}

# Запуск
main "$@"
