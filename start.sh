#!/bin/bash

echo ""
echo "========================================"
echo "    GoatMusic - Spotify Clone"
echo "========================================"
echo ""
echo "Запуск приложения..."
echo ""

# Проверяем наличие Python
if ! command -v python3 &> /dev/null; then
    echo "ОШИБКА: Python 3 не найден!"
    echo "Установите Python 3.7+ и попробуйте снова."
    exit 1
fi

# Проверяем наличие виртуального окружения
if [ ! -d "venv" ]; then
    echo "Создание виртуального окружения..."
    python3 -m venv venv
    echo "Включение виртуального окружения..."
    source venv/bin/activate
    echo "Установка зависимостей..."
    pip install -r requirements.txt
else
    echo "Включение виртуального окружения..."
    source venv/bin/activate
fi

echo ""
echo "Запуск GoatMusic..."
echo "Приложение будет доступно по адресу: http://localhost:5000"
echo "Для остановки нажмите Ctrl+C"
echo ""

python3 app.py
