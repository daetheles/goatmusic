#!/usr/bin/env python3
"""
Скрипт запуска GoatMusic
Поддерживает различные режимы запуска
"""

import os
import sys
import argparse
from app import app

def main():
    parser = argparse.ArgumentParser(description='GoatMusic - Spotify Clone')
    parser.add_argument('--host', default='0.0.0.0', help='Host to bind to')
    parser.add_argument('--port', type=int, default=5000, help='Port to bind to')
    parser.add_argument('--debug', action='store_true', help='Enable debug mode')
    parser.add_argument('--production', action='store_true', help='Run in production mode')
    
    args = parser.parse_args()
    
    # Устанавливаем переменные окружения
    if args.debug:
        os.environ['FLASK_ENV'] = 'development'
        os.environ['FLASK_DEBUG'] = '1'
    elif args.production:
        os.environ['FLASK_ENV'] = 'production'
        os.environ['FLASK_DEBUG'] = '0'
    
    print(f"🚀 Запуск GoatMusic на {args.host}:{args.port}")
    print(f"🔧 Режим: {'Отладка' if args.debug else 'Продакшен' if args.production else 'По умолчанию'}")
    print(f"🌐 Откройте http://{args.host}:{args.port} в браузере")
    print("⏹️  Для остановки нажмите Ctrl+C")
    print("-" * 50)
    
    try:
        app.run(
            host=args.host,
            port=args.port,
            debug=args.debug,
            use_reloader=args.debug
        )
    except KeyboardInterrupt:
        print("\n👋 GoatMusic остановлен")
    except Exception as e:
        print(f"❌ Ошибка запуска: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
