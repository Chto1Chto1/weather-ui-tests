const { test, expect } = require('@playwright/test');
const { WeatherPage } = require('./pages/WeatherPage');

let wp;
test.beforeEach(async ({ page }) => {
  wp = new WeatherPage(page);
  await wp.open();
});

test('TC-01: успешный поиск города и получение прогноза', async () => {
  await wp.fillCity('Moscow');
  await wp.searchCity();
  await expect(wp.cityResult).toContainText('Moscow');

  await wp.getForecast();
  await expect(wp.resultBlock).toBeVisible();
  await expect(wp.temperature).not.toBeEmpty();
});

test('TC-02: пустое поле названия города', async () => {
  await wp.searchCity();
  await expect(wp.errorMsg).toBeVisible();
  await expect(wp.errorMsg).toContainText('Введите название');
});

test('TC-03: поиск несуществующего города', async () => {
  await wp.fillCity('Xyznonexistent123');
  await wp.searchCity();
  await expect(wp.errorMsg).toContainText('не найден');
});

test('TC-04: широта -90 (нижняя граница)', async () => {
  await wp.fillLatitude(-90);
  await wp.fillLongitude(0);
  await wp.getForecast();
  await expect(wp.errorMsg).toBeHidden();
  await expect(wp.resultBlock).toBeVisible();
});

test('TC-05: широта 90 (верхняя граница)', async () => {
  await wp.fillLatitude(90);
  await wp.fillLongitude(0);
  await wp.getForecast();
  await expect(wp.errorMsg).toBeHidden();
  await expect(wp.resultBlock).toBeVisible();
});

test('TC-06: широта -91 (ниже минимума)', async () => {
  await wp.fillLatitude(-91);
  await wp.fillLongitude(0);
  await wp.getForecast();
  await expect(wp.errorMsg).toContainText('Широта вне диапазона');
});

test('TC-07: широта 91 (выше максимума)', async () => {
  await wp.fillLatitude(91);
  await wp.fillLongitude(0);
  await wp.getForecast();
  await expect(wp.errorMsg).toContainText('Широта вне диапазона');
});

test('TC-08: долгота -180 (нижняя граница)', async () => {
  await wp.fillLatitude(0);
  await wp.fillLongitude(-180);
  await wp.getForecast();
  await expect(wp.errorMsg).toBeHidden();
  await expect(wp.resultBlock).toBeVisible();
});

test('TC-09: долгота 180 (верхняя граница)', async () => {
  await wp.fillLatitude(0);
  await wp.fillLongitude(180);
  await wp.getForecast();
  await expect(wp.errorMsg).toBeHidden();
  await expect(wp.resultBlock).toBeVisible();
});

test('TC-10: долгота 181 (вне диапазона)', async () => {
  await wp.fillLatitude(0);
  await wp.fillLongitude(181);
  await wp.getForecast();
  await expect(wp.errorMsg).toContainText('Долгота вне диапазона');
});

test('TC-11: нечисловая широта (abc)', async () => {
  await wp.fillLatitude('abc');
  await wp.fillLongitude(0);
  await wp.getForecast();
  await expect(wp.errorMsg).toContainText('Широта должна быть числом');
});

test('TC-12: XSS-инъекция в названии города', async () => {
  const payload = '<script>alert(1)</script>';
  await wp.fillCity(payload);
  await wp.searchCity();
  const text = await wp.getCityCoordinates();
  expect(text).not.toContain('<script>');
});