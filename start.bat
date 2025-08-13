@echo off
echo.
echo ========================================
echo    GoatMusic - Spotify Clone
echo ========================================
echo.
echo Запуск приложения...
echo.

REM Проверяем наличие Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ОШИБКА: Python не найден!
    echo Установите Python 3.7+ и попробуйте снова.
    pause
    exit /b 1
)

REM Проверяем наличие виртуального окружения
if not exist "venv" (
    echo Создание виртуального окружения...
    python -m venv venv
    echo Включение виртуального окружения...
    call venv\Scripts\activate.bat
    echo Установка зависимостей...
    pip install -r requirements.txt
) else (
    echo Включение виртуального окружения...
    call venv\Scripts\activate.bat
)

echo.
echo Запуск GoatMusic...
echo Приложение будет доступно по адресу: http://localhost:5000
echo Для остановки нажмите Ctrl+C
echo.

python app.py

pause
