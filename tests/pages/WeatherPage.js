class WeatherPage {
  constructor(page) {
    this.page = page;
    this.cityInput   = page.locator('[data-testid="city-input"]');
    this.latInput    = page.locator('[data-testid="lat-input"]');
    this.lonInput    = page.locator('[data-testid="lon-input"]');
    this.searchBtn   = page.locator('[data-testid="search-button"]');
    this.forecastBtn = page.locator('[data-testid="forecast-button"]');
    this.cityResult  = page.locator('[data-testid="city-coordinates"]');
    this.resultBlock = page.locator('[data-testid="result-block"]');
    this.temperature = page.locator('[data-testid="temperature"]');
    this.errorMsg    = page.locator('[data-testid="error-message"]');
  }

  async open() { await this.page.goto('/'); }

  async fillCity(name)        { await this.cityInput.fill(name); }
  async fillLatitude(value)   { await this.latInput.fill(String(value)); }
  async fillLongitude(value)  { await this.lonInput.fill(String(value)); }

  async searchCity()          { await this.searchBtn.click(); }
  async getForecast()         { await this.forecastBtn.click(); }

  async getTemperature()      { return (await this.temperature.textContent())?.trim(); }
  async getErrorMessage()     { return (await this.errorMsg.textContent())?.trim(); }
  async getCityCoordinates()  { return (await this.cityResult.textContent())?.trim(); }
  async isResultVisible()     { return this.resultBlock.isVisible(); }
}

module.exports = { WeatherPage };