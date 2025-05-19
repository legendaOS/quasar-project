# Quasar App (quasar-project)

Проект на Quasar Framework

## Установка зависимостей
```bash
yarn
# или
npm install
```

### Запуск приложения в режиме разработки (hot-code reloading, error reporting, etc.)
```bash
quasar dev
```

### Запуск тестов
```bash
# Запуск всех тестов
yarn test
# или
npm run test
```

### Проверка кода линтером
```bash
yarn lint
# или
npm run lint
```

### Сборка приложения для продакшена
```bash
quasar build
```

### Настройка конфигурации
См. [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js).

## Структура проекта
```
quasar-project/
├── src/                    # Исходный код приложения
│   ├── assets/            # Статические ресурсы (изображения, шрифты)
│   ├── boot/              # Файлы инициализации
│   ├── components/        # Vue компоненты
│   ├── css/              # Глобальные стили
│   ├── layouts/          # Шаблоны страниц
│   ├── pages/            # Страницы приложения
│   ├── router/           # Конфигурация маршрутизации
│   ├── stores/           # Хранилища состояния (Pinia)
│   └── App.vue           # Корневой компонент
├── public/                # Публичные статические файлы
├── .quasar/              # Сгенерированные файлы Quasar
├── node_modules/         # Зависимости проекта
├── quasar.config.ts      # Конфигурация Quasar
├── package.json          # Зависимости и скрипты
└── jest.config.cjs       # Конфигурация Jest для тестирования
```
