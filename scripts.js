const cityInput   = document.getElementById('city');
const latInput    = document.getElementById('lat');
const lonInput    = document.getElementById('lon');
const searchBtn   = document.getElementById('search');
const forecastBtn = document.getElementById('forecast');
const cityResult  = document.getElementById('city-result');
const resultBlock = document.querySelector('[data-testid="result-block"]');
const tempEl      = document.querySelector('[data-testid="temperature"]');
const errorEl     = document.getElementById('error');

const LAT_MIN = -90, LAT_MAX = 90, LON_MIN = -180, LON_MAX = 180;

function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }
function clearError()   { errorEl.textContent = ''; errorEl.hidden = true; }

function isValidNumber(v) {
  return v !== '' && !isNaN(Number(v));
}
function inRange(v, min, max) {
  const n = Number(v);
  return n >= min && n <= max;
}

searchBtn.addEventListener('click', async () => {
  clearError();
  cityResult.textContent = '';
  const name = cityInput.value.trim();
  if (!name) { showError('Введите название города'); return; }

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=ru&format=json`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.results || data.results.length === 0) {
      showError('Город не найден');
      return;
    }
    const { latitude, longitude, name: foundName } = data.results[0];
    latInput.value = latitude;
    lonInput.value = longitude;
    cityResult.textContent = `${foundName}: ${latitude}, ${longitude}`;
  } catch (e) {
    showError('Ошибка запроса поиска города');
  }
});

forecastBtn.addEventListener('click', async () => {
  clearError();
  resultBlock.hidden = true;

  if (!isValidNumber(latInput.value)) { showError('Широта должна быть числом'); return; }
  if (!isValidNumber(lonInput.value)) { showError('Долгота должна быть числом'); return; }
  if (!inRange(latInput.value, LAT_MIN, LAT_MAX)) { showError('Широта вне диапазона -90..90'); return; }
  if (!inRange(lonInput.value, LON_MIN, LON_MAX)) { showError('Долгота вне диапазона -180..180'); return; }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latInput.value}&longitude=${lonInput.value}&current=temperature_2m`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.error) { showError(data.reason || 'Ошибка API'); return; }
    tempEl.textContent = data.current.temperature_2m;
    resultBlock.hidden = false;
  } catch (e) {
    showError('Ошибка запроса прогноза');
  }
});