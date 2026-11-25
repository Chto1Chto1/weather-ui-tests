// @ts-check
// ЛР4. Автоматизированные API-тесты Open-Meteo (Geocoding API + Forecast API)
// Запуск: npx playwright test tests/api.spec.js
const { test, expect } = require('@playwright/test');

const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

// Координаты Москвы (получены через Geocoding API в ЛР2)
const MOSCOW = { latitude: 55.7558, longitude: 37.6173 };

/**
 * Общая проверка ответа-ошибки Forecast API:
 * HTTP 400 и JSON вида { "error": true, "reason": "..." }
 */
async function expectForecastError(response) {
  expect(response.status()).toBe(400);
  const body = await response.json();
  expect(body.error).toBe(true);
  expect(typeof body.reason).toBe('string');
  expect(body.reason.length).toBeGreaterThan(0);
  return body;
}

test.describe('Geocoding API', () => {
  test('API-01 Поиск существующего города возвращает координаты', async ({ request }) => {
    const response = await request.get(GEO_URL, {
      params: { name: 'Moscow', count: 1, language: 'ru', format: 'json' },
    });
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body.results)).toBe(true);
    expect(body.results.length).toBeGreaterThan(0);

    const city = body.results[0];
    expect(city).toHaveProperty('name');
    expect(city.latitude).toBeGreaterThan(55);
    expect(city.latitude).toBeLessThan(56.5);
    expect(city.longitude).toBeGreaterThan(37);
    expect(city.longitude).toBeLessThan(38.5);
  });

  test('API-02 Поиск несуществующего города возвращает пустой результат', async ({ request }) => {
    const response = await request.get(GEO_URL, {
      params: { name: 'Xyznonexistent123', count: 1 },
    });
    expect(response.status()).toBe(200);

    const body = await response.json();
    // При отсутствии совпадений поле results в ответе не передаётся
    expect(body.results).toBeUndefined();
  });

  test('API-03 Запрос без обязательного параметра name отклоняется', async ({ request }) => {
    const response = await request.get(GEO_URL, { params: { count: 1 } });
    expect(response.status()).toBe(400);
  });

  test('API-04 HTML-код в параметре name не вызывает ошибку сервера', async ({ request }) => {
    const response = await request.get(GEO_URL, {
      params: { name: '<script>alert(1)</script>', count: 1 },
    });
    expect(response.status()).toBeLessThan(500);

    const body = await response.json();
    expect(body.results).toBeUndefined();
  });
});

test.describe('Forecast API — позитивные сценарии', () => {
  test('API-05 Текущая температура по корректным координатам', async ({ request }) => {
    const response = await request.get(FORECAST_URL, {
      params: { ...MOSCOW, current: 'temperature_2m' },
    });
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(typeof body.current.temperature_2m).toBe('number');
    expect(body.current_units.temperature_2m).toBe('°C');
  });

  test('API-06 Почасовой прогноз на 1 день содержит 24 значения', async ({ request }) => {
    const response = await request.get(FORECAST_URL, {
      params: { ...MOSCOW, hourly: 'temperature_2m', forecast_days: 1 },
    });
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.hourly.time).toHaveLength(24);
    expect(body.hourly.temperature_2m).toHaveLength(24);
  });

  test('API-07 Суточный прогноз с часовым поясом Europe/Moscow', async ({ request }) => {
    const response = await request.get(FORECAST_URL, {
      params: { ...MOSCOW, daily: 'temperature_2m_max', timezone: 'Europe/Moscow' },
    });
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.timezone).toBe('Europe/Moscow');
    expect(body.utc_offset_seconds).toBe(10800);
    expect(body.daily.time).toHaveLength(7); // по умолчанию forecast_days = 7
    expect(body.daily.temperature_2m_max).toHaveLength(7);
  });
});

test.describe('Forecast API — граничные и негативные сценарии', () => {
  test('API-08 Широта на нижней границе (-90) принимается', async ({ request }) => {
    const response = await request.get(FORECAST_URL, {
      params: { latitude: -90, longitude: 0, current: 'temperature_2m' },
    });
    expect(response.status()).toBe(200);
  });

  test('API-09 Широта выше максимума (91) отклоняется', async ({ request }) => {
    const response = await request.get(FORECAST_URL, {
      params: { latitude: 91, longitude: 0 },
    });
    await expectForecastError(response);
  });

  test('API-10 Долгота на верхней границе (180) принимается', async ({ request }) => {
    const response = await request.get(FORECAST_URL, {
      params: { latitude: 0, longitude: 180, current: 'temperature_2m' },
    });
    expect(response.status()).toBe(200);
  });

  test('API-11 Долгота выше максимума (181) отклоняется', async ({ request }) => {
    const response = await request.get(FORECAST_URL, {
      params: { latitude: 0, longitude: 181 },
    });
    await expectForecastError(response);
  });

  test('API-12 Нечисловое значение широты (abc) отклоняется', async ({ request }) => {
    const response = await request.get(FORECAST_URL, {
      params: { latitude: 'abc', longitude: MOSCOW.longitude },
    });
    await expectForecastError(response);
  });

  test('API-13 Запрос без параметра longitude отклоняется', async ({ request }) => {
    const response = await request.get(FORECAST_URL, {
      params: { latitude: MOSCOW.latitude },
    });
    await expectForecastError(response);
  });

  test('API-14 Некорректный часовой пояс отклоняется', async ({ request }) => {
    const response = await request.get(FORECAST_URL, {
      params: { ...MOSCOW, daily: 'temperature_2m_max', timezone: 'Mars/Olympus' },
    });
    await expectForecastError(response);
  });

  test('API-15 Максимальная глубина прогноза (16 дней) принимается', async ({ request }) => {
    const response = await request.get(FORECAST_URL, {
      params: { ...MOSCOW, daily: 'temperature_2m_max', timezone: 'auto', forecast_days: 16 },
    });
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.daily.time).toHaveLength(16);
  });

  test('API-16 Глубина прогноза больше максимума (17 дней) отклоняется', async ({ request }) => {
    const response = await request.get(FORECAST_URL, {
      params: { ...MOSCOW, daily: 'temperature_2m_max', timezone: 'auto', forecast_days: 17 },
    });
    await expectForecastError(response);
  });
});
