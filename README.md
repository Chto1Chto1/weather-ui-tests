# Weather UI Tests (ЛР3)

Автоматизация UI-тестов погодного сервиса на основе Open-Meteo API.

## Стек
- Playwright + JavaScript
- Page Object Model

## Запуск
```bash
npm install
npx playwright install
npx playwright test
```

## ЛР4. API-тесты и CI/CD
- `tests/api.spec.js` — 16 автоматизированных API-тестов Open-Meteo (Geocoding + Forecast)
- `postman/Weather API.postman_collection.json` — коллекция Postman из 12 запросов
- `.github/workflows/tests.yml` — GitHub Actions: запуск API- и UI-тестов при push и Pull Request

```bash
npx playwright test tests/api.spec.js   # только API-тесты
npm test                                # все тесты (API + UI)
```
