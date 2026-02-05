import { sensorDb, readingDb, apiLogDb } from "../database/db.js";

const AGRO_BASE_URL = "http://api.agromonitoring.com/agro/1.0";

// Get API key at runtime (after dotenv has loaded)
function getApiKey() {
  return process.env.AGRO_API_KEY;
}

/**
 * List all polygons from AgroMonitoring account
 */
export async function listPolygons() {
  const AGRO_API_KEY = getApiKey();
  const endpoint = `${AGRO_BASE_URL}/polygons`;
  const url = `${endpoint}?appid=${AGRO_API_KEY}`;

  try {
    console.log("Fetching all polygons from AgroMonitoring...");
    console.log("Using API key:", AGRO_API_KEY ? `${AGRO_API_KEY.slice(0, 8)}...` : "NOT SET");
    
    const response = await fetch(url);
    const data = await response.json();

    // Log API call
    apiLogDb.create(endpoint, "list", response.status, data);

    if (!response.ok) {
      throw new Error(data.message || `API error: ${response.status}`);
    }

    // Transform to simpler format
    return data.map(polygon => ({
      id: polygon.id,
      name: polygon.name,
      center: polygon.center,
      area: polygon.area, // in hectares
      coordinates: polygon.geo_json?.geometry?.coordinates?.[0] || []
    }));
  } catch (error) {
    console.error("Failed to list polygons:", error);
    apiLogDb.create(endpoint, "list", 0, null, error.message);
    throw error;
  }
}

/**
 * Get info for a single polygon from AgroMonitoring
 */
export async function getPolygonInfo(polygonId) {
  const AGRO_API_KEY = getApiKey();
  const endpoint = `${AGRO_BASE_URL}/polygons/${polygonId}`;
  const url = `${endpoint}?appid=${AGRO_API_KEY}`;

  try {
    console.log(`Fetching polygon info for: ${polygonId}`);
    
    const response = await fetch(url);
    const data = await response.json();

    // Log API call
    apiLogDb.create(endpoint, polygonId, response.status, data);

    if (!response.ok) {
      throw new Error(data.message || `API error: ${response.status}`);
    }

    return {
      id: data.id,
      name: data.name,
      center: data.center,
      area: data.area,
      coordinates: data.geo_json?.geometry?.coordinates?.[0] || []
    };
  } catch (error) {
    console.error("Failed to get polygon info:", error);
    apiLogDb.create(endpoint, polygonId, 0, null, error.message);
    throw error;
  }
}

/**
 * Fetch current soil data from AgroMonitoring API
 */
export async function fetchCurrentSoilData(polygonId) {
  const AGRO_API_KEY = getApiKey();
  const endpoint = `${AGRO_BASE_URL}/soil`;
  const url = `${endpoint}?polyid=${polygonId}&appid=${AGRO_API_KEY}`;

  try {
    console.log(`Fetching soil data for polygon: ${polygonId}`);
    
    const response = await fetch(url);
    const data = await response.json();

    // Log API call
    apiLogDb.create(endpoint, polygonId, response.status, data);

    if (!response.ok) {
      throw new Error(data.message || `API error: ${response.status}`);
    }

    return transformSoilData(data);
  } catch (error) {
    console.error("Failed to fetch soil data:", error);
    apiLogDb.create(endpoint, polygonId, 0, null, error.message);
    throw error;
  }
}

/**
 * Transform AgroMonitoring soil data to our format
 */
function transformSoilData(apiData) {
  return {
    timestamp: new Date(apiData.dt * 1000).toISOString(),
    soilTempSurface: kelvinToCelsius(apiData.t0),
    soilTemp10cm: kelvinToCelsius(apiData.t10),
    soilMoisture: moistureToPercent(apiData.moisture),
    raw: apiData
  };
}

/**
 * Generate simulated sensor data (for sensors not provided by API)
 */
export function generateSimulatedData(soilData) {
  const soilTemp = soilData.soilTemp10cm;
  
  return {
    soilPh: 6.0 + Math.random() * 1.5, // 6.0-7.5
    airTemp: soilTemp + (Math.random() * 5 + 5), // soil temp + 5-10°C
    airHumidity: 40 + Math.random() * 30 // 40-70%
  };
}

/**
 * Store sensor readings in database
 */
export async function storeSensorReadings(fieldId, soilData, simulatedData) {
  const sensors = sensorDb.findByFieldId(fieldId);
  const timestamp = soilData.timestamp;
  const readings = [];

  for (const sensor of sensors) {
    let value;
    let source;

    switch (sensor.sensor_type) {
      case "soil_temp_surface":
        value = soilData.soilTempSurface;
        source = "api";
        break;
      case "soil_temp_10cm":
        value = soilData.soilTemp10cm;
        source = "api";
        break;
      case "soil_moisture":
        value = soilData.soilMoisture;
        source = "api";
        break;
      case "soil_ph":
        value = simulatedData.soilPh;
        source = "simulated";
        break;
      case "air_temp":
        value = simulatedData.airTemp;
        source = "simulated";
        break;
      case "air_humidity":
        value = simulatedData.airHumidity;
        source = "simulated";
        break;
      default:
        continue;
    }

    const readingId = readingDb.create(
      sensor.id,
      parseFloat(value.toFixed(2)),
      timestamp,
      source
    );

    readings.push({ sensorId: sensor.id, readingId, value });
  }

  return readings;
}

/**
 * Poll data for a specific field
 */
export async function pollFieldData(field) {
  try {
    if (!field.polygon_id) {
      console.warn(`Field ${field.id} has no polygon ID, skipping...`);
      return null;
    }

    console.log(`Polling data for field: ${field.name} (${field.polygon_id})`);

    // Fetch soil data from API
    const soilData = await fetchCurrentSoilData(field.polygon_id);

    // Generate simulated data
    const simulatedData = generateSimulatedData(soilData);

    // Store readings
    const readings = await storeSensorReadings(field.id, soilData, simulatedData);

    console.log(`✅ Stored ${readings.length} readings for field: ${field.name}`);

    return {
      fieldId: field.id,
      fieldName: field.name,
      timestamp: soilData.timestamp,
      readingsStored: readings.length
    };
  } catch (error) {
    console.error(`❌ Failed to poll field ${field.name}:`, error.message);
    return {
      fieldId: field.id,
      fieldName: field.name,
      error: error.message
    };
  }
}

/**
 * Utility functions
 */
function kelvinToCelsius(kelvin) {
  return kelvin - 273.15;
}

function moistureToPercent(moisture) {
  return moisture * 100;
}

/**
 * Fetch NDVI history for a polygon
 * NDVI ranges: 0-0.2 (bare soil), 0.2-0.4 (sparse), 0.4-0.6 (moderate), 0.6-1.0 (healthy)
 */
export async function fetchNDVIHistory(polygonId, startDate = null, endDate = null) {
  const AGRO_API_KEY = getApiKey();
  
  // Default: last 30 days
  const end = endDate || Math.floor(Date.now() / 1000);
  const start = startDate || end - (30 * 24 * 60 * 60);
  
  const endpoint = `${AGRO_BASE_URL}/ndvi/history`;
  const url = `${endpoint}?polyid=${polygonId}&start=${start}&end=${end}&appid=${AGRO_API_KEY}`;

  try {
    console.log(`Fetching NDVI history for polygon: ${polygonId}`);
    
    const response = await fetch(url);
    const data = await response.json();

    apiLogDb.create(endpoint, polygonId, response.status, data);

    if (!response.ok) {
      throw new Error(data.message || `API error: ${response.status}`);
    }

    // Transform to simpler format with health status
    return data.map(item => ({
      timestamp: new Date(item.dt * 1000).toISOString(),
      source: item.source, // satellite source (l8, s2, etc.)
      cloudCoverage: item.cl,
      ndvi: {
        mean: item.data?.mean || 0,
        min: item.data?.min || 0,
        max: item.data?.max || 0,
        median: item.data?.median || 0
      },
      health: getNDVIHealth(item.data?.mean || 0)
    }));
  } catch (error) {
    console.error("Failed to fetch NDVI history:", error);
    apiLogDb.create(endpoint, polygonId, 0, null, error.message);
    throw error;
  }
}

/**
 * Get NDVI health status
 */
function getNDVIHealth(ndvi) {
  if (ndvi >= 0.6) return { status: "healthy", label: "Healthy Vegetation", color: "green" };
  if (ndvi >= 0.4) return { status: "moderate", label: "Moderate Vegetation", color: "yellow" };
  if (ndvi >= 0.2) return { status: "sparse", label: "Sparse Vegetation", color: "orange" };
  return { status: "bare", label: "Bare Soil / No Vegetation", color: "red" };
}

/**
 * Fetch weather forecast for a polygon (5-day forecast)
 */
export async function fetchWeatherForecast(polygonId) {
  const AGRO_API_KEY = getApiKey();
  const endpoint = `${AGRO_BASE_URL}/weather/forecast`;
  const url = `${endpoint}?polyid=${polygonId}&appid=${AGRO_API_KEY}`;

  try {
    console.log(`Fetching weather forecast for polygon: ${polygonId}`);
    
    const response = await fetch(url);
    const data = await response.json();

    apiLogDb.create(endpoint, polygonId, response.status, data);

    if (!response.ok) {
      throw new Error(data.message || `API error: ${response.status}`);
    }

    // Transform forecast data
    return data.map(item => ({
      timestamp: new Date(item.dt * 1000).toISOString(),
      temperature: {
        current: kelvinToCelsius(item.main?.temp || 0),
        feelsLike: kelvinToCelsius(item.main?.feels_like || 0),
        min: kelvinToCelsius(item.main?.temp_min || 0),
        max: kelvinToCelsius(item.main?.temp_max || 0)
      },
      humidity: item.main?.humidity || 0,
      pressure: item.main?.pressure || 0,
      clouds: item.clouds?.all || 0,
      wind: {
        speed: item.wind?.speed || 0,
        direction: item.wind?.deg || 0
      },
      weather: {
        main: item.weather?.[0]?.main || "Unknown",
        description: item.weather?.[0]?.description || "",
        icon: item.weather?.[0]?.icon || "01d"
      },
      rain: item.rain?.["3h"] || 0,
      uvi: item.uvi || 0
    }));
  } catch (error) {
    console.error("Failed to fetch weather forecast:", error);
    apiLogDb.create(endpoint, polygonId, 0, null, error.message);
    throw error;
  }
}

/**
 * Fetch current weather for a polygon
 */
export async function fetchCurrentWeather(polygonId) {
  const AGRO_API_KEY = getApiKey();
  const endpoint = `${AGRO_BASE_URL}/weather`;
  const url = `${endpoint}?polyid=${polygonId}&appid=${AGRO_API_KEY}`;

  try {
    console.log(`Fetching current weather for polygon: ${polygonId}`);
    
    const response = await fetch(url);
    const data = await response.json();

    apiLogDb.create(endpoint, polygonId, response.status, data);

    if (!response.ok) {
      throw new Error(data.message || `API error: ${response.status}`);
    }

    return {
      timestamp: new Date(data.dt * 1000).toISOString(),
      temperature: kelvinToCelsius(data.main?.temp || 0),
      feelsLike: kelvinToCelsius(data.main?.feels_like || 0),
      humidity: data.main?.humidity || 0,
      pressure: data.main?.pressure || 0,
      clouds: data.clouds?.all || 0,
      wind: {
        speed: data.wind?.speed || 0,
        direction: data.wind?.deg || 0
      },
      weather: {
        main: data.weather?.[0]?.main || "Unknown",
        description: data.weather?.[0]?.description || "",
        icon: data.weather?.[0]?.icon || "01d"
      },
      visibility: data.visibility || 0,
      uvi: data.uvi || 0
    };
  } catch (error) {
    console.error("Failed to fetch current weather:", error);
    apiLogDb.create(endpoint, polygonId, 0, null, error.message);
    throw error;
  }
}

/**
 * Fetch accumulated temperature (Growing Degree Days - GDD)
 * GDD helps predict crop maturity timing
 */
export async function fetchAccumulatedTemperature(polygonId, startDate = null, endDate = null, baseTemp = 10) {
  const AGRO_API_KEY = getApiKey();
  
  // Default: season start to now (or last 90 days)
  const end = endDate || Math.floor(Date.now() / 1000);
  const start = startDate || end - (90 * 24 * 60 * 60);
  
  const endpoint = `${AGRO_BASE_URL}/weather/history/accumulated_temperature`;
  const url = `${endpoint}?polyid=${polygonId}&start=${start}&end=${end}&threshold=${baseTemp}&appid=${AGRO_API_KEY}`;

  try {
    console.log(`Fetching accumulated temperature (GDD) for polygon: ${polygonId}`);
    
    const response = await fetch(url);
    const data = await response.json();

    apiLogDb.create(endpoint, polygonId, response.status, data);

    if (!response.ok) {
      throw new Error(data.message || `API error: ${response.status}`);
    }

    return {
      startDate: new Date(start * 1000).toISOString(),
      endDate: new Date(end * 1000).toISOString(),
      baseTemperature: baseTemp,
      accumulatedTemperature: data.temp || 0,
      count: data.count || 0,
      unit: "°C-days"
    };
  } catch (error) {
    console.error("Failed to fetch accumulated temperature:", error);
    apiLogDb.create(endpoint, polygonId, 0, null, error.message);
    throw error;
  }
}

/**
 * Fetch accumulated precipitation
 */
export async function fetchAccumulatedPrecipitation(polygonId, startDate = null, endDate = null) {
  const AGRO_API_KEY = getApiKey();
  
  // Default: last 30 days
  const end = endDate || Math.floor(Date.now() / 1000);
  const start = startDate || end - (30 * 24 * 60 * 60);
  
  const endpoint = `${AGRO_BASE_URL}/weather/history/accumulated_precipitation`;
  const url = `${endpoint}?polyid=${polygonId}&start=${start}&end=${end}&appid=${AGRO_API_KEY}`;

  try {
    console.log(`Fetching accumulated precipitation for polygon: ${polygonId}`);
    
    const response = await fetch(url);
    const data = await response.json();

    apiLogDb.create(endpoint, polygonId, response.status, data);

    if (!response.ok) {
      throw new Error(data.message || `API error: ${response.status}`);
    }

    return {
      startDate: new Date(start * 1000).toISOString(),
      endDate: new Date(end * 1000).toISOString(),
      totalPrecipitation: data.rain || 0,
      count: data.count || 0,
      unit: "mm"
    };
  } catch (error) {
    console.error("Failed to fetch accumulated precipitation:", error);
    apiLogDb.create(endpoint, polygonId, 0, null, error.message);
    throw error;
  }
}

/**
 * Get comprehensive field analytics combining all data sources
 */
export async function getFieldAnalytics(polygonId) {
  try {
    const [ndviHistory, weather, forecast, gdd, precipitation] = await Promise.allSettled([
      fetchNDVIHistory(polygonId),
      fetchCurrentWeather(polygonId),
      fetchWeatherForecast(polygonId),
      fetchAccumulatedTemperature(polygonId),
      fetchAccumulatedPrecipitation(polygonId)
    ]);

    return {
      ndvi: ndviHistory.status === "fulfilled" ? ndviHistory.value : null,
      currentWeather: weather.status === "fulfilled" ? weather.value : null,
      forecast: forecast.status === "fulfilled" ? forecast.value : null,
      gdd: gdd.status === "fulfilled" ? gdd.value : null,
      precipitation: precipitation.status === "fulfilled" ? precipitation.value : null,
      errors: {
        ndvi: ndviHistory.status === "rejected" ? ndviHistory.reason?.message : null,
        weather: weather.status === "rejected" ? weather.reason?.message : null,
        forecast: forecast.status === "rejected" ? forecast.reason?.message : null,
        gdd: gdd.status === "rejected" ? gdd.reason?.message : null,
        precipitation: precipitation.status === "rejected" ? precipitation.reason?.message : null
      }
    };
  } catch (error) {
    console.error("Failed to get field analytics:", error);
    throw error;
  }
}

export default {
  fetchCurrentSoilData,
  generateSimulatedData,
  storeSensorReadings,
  pollFieldData,
  fetchNDVIHistory,
  fetchWeatherForecast,
  fetchCurrentWeather,
  fetchAccumulatedTemperature,
  fetchAccumulatedPrecipitation,
  getFieldAnalytics
};
