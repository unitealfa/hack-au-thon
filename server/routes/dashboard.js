import express from "express";
import { fieldDb, sensorDb, readingDb, alertDb } from "../database/db.js";
import { 
  getFieldAnalytics, 
  fetchNDVIHistory, 
  fetchCurrentWeather, 
  fetchWeatherForecast,
  fetchAccumulatedTemperature,
  fetchAccumulatedPrecipitation 
} from "../services/agromonitoring.js";

const router = express.Router();

/**
 * GET /api/dashboard/:fieldId
 * Get dashboard data for a specific field
 */
router.get("/:fieldId", (req, res) => {
  try {
    const { fieldId } = req.params;
    
    const field = fieldDb.findById(fieldId);
    if (!field) {
      return res.status(404).json({ error: "Field not found" });
    }

    // Verify user owns the field
    if (field.user_id !== req.user.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Get all sensors for this field
    const sensors = sensorDb.findByFieldId(fieldId);

    // Get latest reading for each sensor
    const latestReadings = readingDb.findLatestByField(fieldId);

    // Get recent alerts
    const alerts = alertDb.findByUserId(req.user.userId, true); // unread only

    // Calculate health summary
    const healthySensors = latestReadings.filter(r => r.is_healthy === 1).length;
    const totalSensors = latestReadings.length;
    const healthPercentage = totalSensors > 0 ? Math.round((healthySensors / totalSensors) * 100) : 0;

    res.json({
      success: true,
      field: {
        id: field.id,
        name: field.name,
        cropType: field.crop_type,
        polygonId: field.polygon_id
      },
      sensors: sensors.map(sensor => {
        const reading = latestReadings.find(r => r.sensor_id === sensor.id);
        return {
          id: sensor.id,
          name: sensor.sensor_name,
          type: sensor.sensor_type,
          unit: sensor.unit,
          thresholds: {
            min: sensor.threshold_min,
            max: sensor.threshold_max,
            optimalMin: sensor.optimal_min,
            optimalMax: sensor.optimal_max
          },
          currentValue: reading?.value || null,
          isHealthy: reading?.is_healthy === 1,
          timestamp: reading?.timestamp || null,
          source: sensor.source
        };
      }),
      summary: {
        totalSensors,
        healthySensors,
        unhealthySensors: totalSensors - healthySensors,
        healthPercentage,
        lastUpdate: latestReadings[0]?.timestamp || null
      },
      alerts: alerts.slice(0, 5) // Latest 5 unread alerts
    });
  } catch (error) {
    console.error("Get dashboard error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

/**
 * GET /api/dashboard/:fieldId/history
 * Get historical data for charts (last 7 days)
 */
router.get("/:fieldId/history", (req, res) => {
  try {
    const { fieldId } = req.params;
    const { days = 7 } = req.query;

    const field = fieldDb.findById(fieldId);
    if (!field) {
      return res.status(404).json({ error: "Field not found" });
    }

    if (field.user_id !== req.user.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const sensors = sensorDb.findByFieldId(fieldId);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const history = sensors.map(sensor => {
      const readings = readingDb.findByTimeRange(
        sensor.id,
        startDate.toISOString(),
        endDate.toISOString()
      );

      return {
        sensorId: sensor.id,
        sensorName: sensor.sensor_name,
        sensorType: sensor.sensor_type,
        unit: sensor.unit,
        readings: readings.map(r => ({
          value: r.value,
          timestamp: r.timestamp,
          isHealthy: r.is_healthy === 1
        }))
      };
    });

    res.json({
      success: true,
      field: {
        id: field.id,
        name: field.name
      },
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days: parseInt(days)
      },
      history
    });
  } catch (error) {
    console.error("Get history error:", error);
    res.status(500).json({ error: "Failed to fetch historical data" });
  }
});

/**
 * GET /api/dashboard/:fieldId/analytics
 * Get comprehensive analytics (NDVI, weather, GDD) for a field
 */
router.get("/:fieldId/analytics", async (req, res) => {
  try {
    const { fieldId } = req.params;

    const field = fieldDb.findById(fieldId);
    if (!field) {
      return res.status(404).json({ error: "Field not found" });
    }

    if (field.user_id !== req.user.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (!field.polygon_id) {
      return res.status(400).json({ 
        error: "Field has no AgroMonitoring polygon linked",
        message: "Please add a polygon ID to this field to access analytics"
      });
    }

    const analytics = await getFieldAnalytics(field.polygon_id);

    res.json({
      success: true,
      field: {
        id: field.id,
        name: field.name,
        polygonId: field.polygon_id
      },
      analytics
    });
  } catch (error) {
    console.error("Get analytics error:", error);
    res.status(500).json({ error: "Failed to fetch analytics", details: error.message });
  }
});

/**
 * GET /api/dashboard/:fieldId/ndvi
 * Get NDVI history for a field
 */
router.get("/:fieldId/ndvi", async (req, res) => {
  try {
    const { fieldId } = req.params;
    const { days = 30 } = req.query;

    const field = fieldDb.findById(fieldId);
    if (!field) {
      return res.status(404).json({ error: "Field not found" });
    }

    if (field.user_id !== req.user.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (!field.polygon_id) {
      return res.status(400).json({ error: "Field has no polygon linked" });
    }

    const endDate = Math.floor(Date.now() / 1000);
    const startDate = endDate - (parseInt(days) * 24 * 60 * 60);

    const ndviHistory = await fetchNDVIHistory(field.polygon_id, startDate, endDate);

    // Calculate current health based on latest NDVI
    const latestNDVI = ndviHistory.length > 0 ? ndviHistory[ndviHistory.length - 1] : null;

    res.json({
      success: true,
      field: { id: field.id, name: field.name },
      ndvi: {
        history: ndviHistory,
        current: latestNDVI,
        summary: {
          dataPoints: ndviHistory.length,
          averageNDVI: ndviHistory.length > 0 
            ? (ndviHistory.reduce((sum, item) => sum + item.ndvi.mean, 0) / ndviHistory.length).toFixed(3)
            : null,
          trend: calculateTrend(ndviHistory.map(h => h.ndvi.mean))
        }
      }
    });
  } catch (error) {
    console.error("Get NDVI error:", error);
    res.status(500).json({ error: "Failed to fetch NDVI data", details: error.message });
  }
});

/**
 * GET /api/dashboard/:fieldId/weather
 * Get current weather and forecast for a field
 */
router.get("/:fieldId/weather", async (req, res) => {
  try {
    const { fieldId } = req.params;

    const field = fieldDb.findById(fieldId);
    if (!field) {
      return res.status(404).json({ error: "Field not found" });
    }

    if (field.user_id !== req.user.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (!field.polygon_id) {
      return res.status(400).json({ error: "Field has no polygon linked" });
    }

    const [currentWeather, forecast] = await Promise.all([
      fetchCurrentWeather(field.polygon_id),
      fetchWeatherForecast(field.polygon_id)
    ]);

    // Group forecast by day
    const dailyForecast = groupForecastByDay(forecast);

    res.json({
      success: true,
      field: { id: field.id, name: field.name },
      weather: {
        current: currentWeather,
        forecast: forecast,
        dailySummary: dailyForecast
      }
    });
  } catch (error) {
    console.error("Get weather error:", error);
    res.status(500).json({ error: "Failed to fetch weather data", details: error.message });
  }
});

/**
 * GET /api/dashboard/:fieldId/gdd
 * Get Growing Degree Days (accumulated temperature) for a field
 */
router.get("/:fieldId/gdd", async (req, res) => {
  try {
    const { fieldId } = req.params;
    const { days = 90, baseTemp = 10 } = req.query;

    const field = fieldDb.findById(fieldId);
    if (!field) {
      return res.status(404).json({ error: "Field not found" });
    }

    if (field.user_id !== req.user.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (!field.polygon_id) {
      return res.status(400).json({ error: "Field has no polygon linked" });
    }

    const endDate = Math.floor(Date.now() / 1000);
    const startDate = endDate - (parseInt(days) * 24 * 60 * 60);

    const [gdd, precipitation] = await Promise.all([
      fetchAccumulatedTemperature(field.polygon_id, startDate, endDate, parseFloat(baseTemp)),
      fetchAccumulatedPrecipitation(field.polygon_id, startDate, endDate)
    ]);

    // Crop maturity estimates based on GDD (general guidelines)
    const maturityEstimates = getCropMaturityEstimate(field.crop_type, gdd.accumulatedTemperature);

    res.json({
      success: true,
      field: { id: field.id, name: field.name, cropType: field.crop_type },
      accumulated: {
        gdd,
        precipitation,
        maturityEstimate: maturityEstimates
      }
    });
  } catch (error) {
    console.error("Get GDD error:", error);
    res.status(500).json({ error: "Failed to fetch GDD data", details: error.message });
  }
});

/**
 * Helper: Calculate trend from array of values
 */
function calculateTrend(values) {
  if (values.length < 2) return "stable";
  
  const recentAvg = values.slice(-5).reduce((a, b) => a + b, 0) / Math.min(5, values.length);
  const olderAvg = values.slice(0, 5).reduce((a, b) => a + b, 0) / Math.min(5, values.length);
  
  const diff = recentAvg - olderAvg;
  if (diff > 0.05) return "improving";
  if (diff < -0.05) return "declining";
  return "stable";
}

/**
 * Helper: Group forecast by day
 */
function groupForecastByDay(forecast) {
  const days = {};
  
  forecast.forEach(item => {
    const date = item.timestamp.split('T')[0];
    if (!days[date]) {
      days[date] = {
        date,
        temps: [],
        humidity: [],
        rain: 0,
        conditions: []
      };
    }
    days[date].temps.push(item.temperature.current);
    days[date].humidity.push(item.humidity);
    days[date].rain += item.rain;
    if (!days[date].conditions.includes(item.weather.main)) {
      days[date].conditions.push(item.weather.main);
    }
  });

  return Object.values(days).map(day => ({
    date: day.date,
    tempMin: Math.min(...day.temps).toFixed(1),
    tempMax: Math.max(...day.temps).toFixed(1),
    avgHumidity: Math.round(day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length),
    totalRain: day.rain.toFixed(1),
    conditions: day.conditions.join(', ')
  }));
}

/**
 * Helper: Get crop maturity estimate based on GDD
 * GDD requirements vary by crop
 */
function getCropMaturityEstimate(cropType, currentGDD) {
  const cropGDD = {
    wheat: { maturity: 2000, stages: { germination: 150, flowering: 1100, harvest: 2000 } },
    corn: { maturity: 2700, stages: { germination: 150, silking: 1400, harvest: 2700 } },
    tomato: { maturity: 1500, stages: { flowering: 600, fruiting: 1000, harvest: 1500 } },
    potato: { maturity: 1800, stages: { emergence: 300, flowering: 900, harvest: 1800 } },
    rice: { maturity: 2200, stages: { tillering: 400, flowering: 1400, harvest: 2200 } },
    soybean: { maturity: 2500, stages: { flowering: 800, podding: 1500, harvest: 2500 } },
    lettuce: { maturity: 800, stages: { germination: 100, heading: 500, harvest: 800 } },
    carrot: { maturity: 1500, stages: { germination: 150, root_growth: 800, harvest: 1500 } },
    grape: { maturity: 2800, stages: { budbreak: 200, flowering: 800, veraison: 1800, harvest: 2800 } },
    cotton: { maturity: 2400, stages: { flowering: 1000, boll_opening: 1800, harvest: 2400 } }
  };

  const crop = cropGDD[cropType] || cropGDD.wheat; // Default to wheat
  const progress = Math.min(100, Math.round((currentGDD / crop.maturity) * 100));
  
  // Determine current stage
  let currentStage = "growing";
  for (const [stage, gdd] of Object.entries(crop.stages)) {
    if (currentGDD >= gdd) {
      currentStage = stage;
    }
  }

  return {
    cropType: cropType || "unknown",
    requiredGDD: crop.maturity,
    currentGDD: Math.round(currentGDD),
    progress,
    currentStage,
    stages: crop.stages,
    estimatedDaysToHarvest: progress >= 100 ? 0 : null // Would need more data to estimate
  };
}

export default router;
