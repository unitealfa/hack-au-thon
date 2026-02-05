# AgroMonitoring API Documentation

## Current Soil Data API

### Overview
- **Purpose**: Fetch current (live) soil temperature and moisture data for agricultural monitoring
- **Data Collection Frequency**: Updated twice daily (12-hour intervals)
- **Base URL**: `http://api.agromonitoring.com/agro/1.0`
- **Status**: ✅ Working with free tier API key

---

## Authentication
All API calls require an API key (`appid` parameter)
- Obtain API key from: https://agromonitoring.com (requires account registration)
- Free tier available with limitations
- Include in every request as query parameter: `appid=YOUR_API_KEY`

---

## Endpoint: Current Soil Data

### API Call
```
GET http://api.agromonitoring.com/agro/1.0/soil
```

### Required Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `polyid` | string | Polygon ID (field identifier) | `6983e1db1be1fb0008fa39a2` |
| `appid` | string | Your API key | `5006bdc80db896739e7fc77a3cf50860` |

### Example Request
```
http://api.agromonitoring.com/agro/1.0/soil?polyid=6983e1db1be1fb0008fa39a2&appid=5006bdc80db896739e7fc77a3cf50860
```

### Example Response (Live Data - Feb 5, 2026)
```json
{
   "dt": 1770249600,
   "t10": 264.495,
   "moisture": 0.137,
   "t0": 265.154
}
```

### Response Fields

| Field | Type | Description | Unit | Conversion |
|-------|------|-------------|------|------------|
| `dt` | integer | Date/time of measurement | Unix timestamp (UTC) | Convert to Date object |
| `t10` | float | Soil temperature at 10cm depth | Kelvin | °C = K - 273.15 |
| `moisture` | float | Soil moisture content | m³/m³ (volumetric) | % = value × 100 |
| `t0` | float | Soil surface temperature | Kelvin | °C = K - 273.15 |

---

## Data Conversion Examples

### JavaScript Conversion Functions
```javascript
// Convert Unix timestamp to Date
function unixToDate(timestamp) {
  return new Date(timestamp * 1000);
}

// Convert Kelvin to Celsius
function kelvinToCelsius(kelvin) {
  return kelvin - 273.15;
}

// Convert volumetric moisture to percentage
function moistureToPercent(moisture) {
  return moisture * 100;
}

// Transform API response to readable format
function transformSoilData(apiData) {
  return apiData.map(reading => ({
    timestamp: unixToDate(reading.dt),
    surfaceTemp: kelvinToCelsius(reading.t0).toFixed(2) + '°C',
    soilTemp10cm: kelvinToCelsius(reading.t10).toFixed(2) + '°C',
    soilMoisture: moistureToPercent(reading.moisture).toFixed(2) + '%',
    rawData: reading
  }));
}
```

---

## Polygon Management

Before fetching soil data, you need to create or get a polygon (field/area):

### Create Polygon
```
POST http://api.agromonitoring.com/agro/1.0/polygons?appid=YOUR_API_KEY

Body:
{
  "name": "My Field",
  "geo_json": {
    "type": "Feature",
    "properties": {},
    "geometry": {
      "type": "Polygon",
      "coordinates": [
        [
          [longitude1, latitude1],
          [longitude2, latitude2],
          [longitude3, latitude3],
          [longitude4, latitude4],
          [longitude1, latitude1]  // Close the polygon
        ]
      ]
    }
  }
}
```

### Get All Polygons
```
GET http://api.agromonitoring.com/agro/1.0/polygons?appid=YOUR_API_KEY
```

Returns list of polygons with their IDs.

---

## Practical Implementation Strategy

### 1. One-Time Data Fetch & Store
```javascript
// Fetch 3-6 months of historical data
const start = Math.floor(new Date('2024-08-01').getTime() / 1000);
const end = Math.floor(new Date('2025-02-01').getTime() / 1000);

const response = await fetch(
  `http://api.agromonitoring.com/agro/1.0/soil/history?` +
  `start=${start}&end=${end}&polyid=${polygonId}&appid=${apiKey}`
);
Periodic Polling (Real-time Approach)
```javascript
// Fetch current soil data every 6 hours (since API updates 2x/day)
async function pollCurrentSoilData() {
  const response = await fetch(
    `http://api.agromonitoring.com/agro/1.0/soil?` +
    `polyid=${polygonId}&appid=${apiKey}`
  );
  
  const currentData = await response.json();
  
  // Store in SQLite database with timestamp
  await saveSensorReading({
    sensor_type: 'soil_temp_surface',
    value: currentData.t0 - 273.15, // Convert to Celsius
    timestamp: new Date(currentData.dt * 1000),
    source: 'agromonitoring_api'
  });
  
  await saveSensorReading({
    sensor_type: 'soil_temp_10cm',
    value: currentData.t10 - 273.15,
    timestamp: new Date(currentData.dt * 1000),
    source: 'agromonitoring_api'
  });
  
  await saveSensorReading({
    sensor_type: 'soil_moisture',
    value: currentData.moisture * 100, // Convert to percentage
    timestamp: new Date(currentData.dt * 1000),
    source: 'agromonitoring_api'
  });
  
  return currentData;
}

// Schedule polling every 6 hours
setInterval(pollCurrentSoilData, 6 * 60 * 60 * 1000);
```

### 2. Hybrid Approach (API + Simulation)
- **Primary**: Fetch current data from API every 6 hours
- **Secondary**: Generate simulated pH, air temp, air humidity (not provided by API)
- **Backup**: If API fails, use last known values with slight variation
- Store all readings with source tracking (`api` vs `simulated`)

### 3. Additional Simulated Sensors
Since the API only provides soil temp & moisture, simulate:
```javascript
function generateAdditionalSensors(soilData) {
  const soilTempC = soilData.t10 - 273.15;
  
  return {
    // Estimate air temp based on soil temp
    air_temp: soilTempC + (Math.random() * 5 + 5), // +5-10°C warmer
    
    // Generate realistic pH (slightly acidic to neutral)
    soil_ph: 6.0 + Math.random() * 1.5, // 6.0-7.5
    
    // Estimate air humidity (inverse of soil moisture)
    air_humidity: 40 + Math.random() * 30, // 40-70%
  };
}
- **Critical**: <5°C or >40°C

### Soil Moisture
- **Dry**: 0-20% (0-0.20 m³/m³)
- **Optimal**: 20-60% (0.20-0.60 m³/m³)
- **Saturated**: >60% (>0.60 m³/m³)
- **Critical**: <10% or >80%

---

## Related APIs (for future expansion)

- **Current Soil**: `/agro/1.0/soil` (real-time data)
- **Current Weather**: `/agro/1.0/weather` (temp, humidity, pressure)
- **Historical Weather**: `/agro/1.0/weather/history`
- **NDVI (vegetation index)**: `/agro/1.0/ndvi/history`

---

## Rate Limits & Pricing
- Free tier: Limited calls per day/month
- Check current limits at: https://agromonitoring.com/price
- Recommended: Cache responses, minimize duplicate requests

---

## Error Handling

### Common Errors
- `401 Unauthorized`: Invalid API key
- `404 Not Found`: Invalid polygon ID
- `400 Bad Request`: Invalid parameters (check timestamp format)

### Best Practices
```javascript
async function fetchSoilDataSafely(polyid, start, end, apiKey) {
  try {
    const url = `http://api.agromonitoring.com/agro/1.0/soil/history?` +
              `start=${start}&end=${end}&polyid=${polyid}&appid=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      console.warn('No soil data available for this period');
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Failed to fetch soil data:', error);
    throw error;
  }
}
```

---

## Next Steps for Implementation

1. ✅ **Get API Key**: Register at agromonitoring.com
2. ✅ **Create Test Polygon**: Define a test field area
3. ✅ **Fetch Historical Data**: Get 3-6 months of soil data
4. ✅ **Store in SQLite**: Save raw data with transformations
5. ✅ **Build Replay System**: Simulate periodic sensor readings
6. ✅ **Display on Dashboard**: Show current values with health status
