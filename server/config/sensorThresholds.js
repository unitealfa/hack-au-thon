/**
 * Scientific sensor thresholds for agricultural monitoring
 * 
 * Sources:
 * - FAO (Food and Agriculture Organization) Soil Guidelines
 * - USDA Natural Resources Conservation Service
 * - University agricultural extension services
 * - Peer-reviewed agricultural science journals
 */

export const SENSOR_THRESHOLDS = {
  /**
   * Soil Surface Temperature (0-5cm depth)
   * Source: USDA NRCS, FAO Soil Temperature Guidelines
   * - Critical low: Frost damage risk, root growth stops
   * - Optimal: Most crops thrive between 18-24°C
   * - Critical high: Heat stress, microbial activity decline
   */
  soil_temp_surface: {
    name: "Soil Temperature (Surface)",
    unit: "°C",
    source: "api",
    threshold_min: 5,      // Below: frost risk, root damage
    threshold_max: 35,     // Above: heat stress, soil damage
    optimal_min: 18,       // Ideal range for most crops
    optimal_max: 24,
  },

  /**
   * Soil Temperature at 10cm depth
   * Source: FAO Guidelines for Soil Description
   * - More stable than surface, key for root zone health
   * - Germination requires 10-12°C minimum for most crops
   */
  soil_temp_10cm: {
    name: "Soil Temperature (10cm)",
    unit: "°C",
    source: "api",
    threshold_min: 8,      // Below: poor germination
    threshold_max: 30,     // Above: root stress
    optimal_min: 15,       // Optimal root growth range
    optimal_max: 22,
  },

  /**
   * Soil Moisture (Volumetric Water Content)
   * Source: USDA NRCS, FAO Irrigation Guidelines
   * - Expressed as percentage of soil volume
   * - Field capacity typically 25-40% depending on soil type
   * - Permanent wilting point ~10-15%
   */
  soil_moisture: {
    name: "Soil Moisture",
    unit: "%",
    source: "api",
    threshold_min: 15,     // Below: wilting point, drought stress
    threshold_max: 60,     // Above: waterlogging, root rot risk
    optimal_min: 25,       // Good moisture retention
    optimal_max: 45,       // Field capacity range
  },

  /**
   * Soil pH
   * Source: USDA NRCS, University Extension Services
   * - Most nutrients available between 6.0-7.0
   * - Below 5.5: aluminum toxicity risk
   * - Above 7.5: micronutrient deficiency
   */
  soil_ph: {
    name: "Soil pH",
    unit: "pH",
    source: "simulated",
    threshold_min: 5.5,    // Below: acidic, Al toxicity
    threshold_max: 8.0,    // Above: alkaline, nutrient lockout
    optimal_min: 6.0,      // Optimal nutrient availability
    optimal_max: 7.0,
  },

  /**
   * Air Temperature
   * Source: FAO Crop Evapotranspiration Guidelines
   * - Affects photosynthesis, respiration, transpiration
   * - Most C3 crops optimal 15-25°C
   * - Most C4 crops optimal 25-35°C
   */
  air_temp: {
    name: "Air Temperature",
    unit: "°C",
    source: "simulated",
    threshold_min: 5,      // Below: frost risk for most crops
    threshold_max: 40,     // Above: heat stress, stomatal closure
    optimal_min: 18,       // General optimal for temperate crops
    optimal_max: 28,
  },

  /**
   * Air Humidity (Relative Humidity)
   * Source: FAO, Agricultural Meteorology Guidelines
   * - Low humidity: increased transpiration, water stress
   * - High humidity: fungal disease risk
   */
  air_humidity: {
    name: "Air Humidity",
    unit: "%",
    source: "simulated",
    threshold_min: 30,     // Below: excessive water loss
    threshold_max: 85,     // Above: fungal disease risk
    optimal_min: 50,       // Good for most crops
    optimal_max: 70,
  },
};

/**
 * Crop-specific threshold adjustments
 * These modify the base thresholds based on crop type
 */
export const CROP_ADJUSTMENTS = {
  wheat: {
    soil_temp_surface: { optimal_min: 15, optimal_max: 22 },
    soil_moisture: { optimal_min: 20, optimal_max: 40 },
    soil_ph: { optimal_min: 6.0, optimal_max: 7.5 },
  },
  corn: {
    soil_temp_surface: { optimal_min: 20, optimal_max: 30 },
    soil_temp_10cm: { optimal_min: 16, optimal_max: 25 },
    soil_moisture: { optimal_min: 30, optimal_max: 50 },
  },
  tomato: {
    soil_temp_surface: { optimal_min: 18, optimal_max: 26 },
    soil_ph: { optimal_min: 6.0, optimal_max: 6.8 },
    air_humidity: { optimal_min: 60, optimal_max: 80 },
  },
  potato: {
    soil_temp_10cm: { optimal_min: 15, optimal_max: 20 },
    soil_moisture: { optimal_min: 30, optimal_max: 50 },
    soil_ph: { optimal_min: 5.0, optimal_max: 6.5 },
  },
  rice: {
    soil_moisture: { threshold_min: 40, optimal_min: 60, optimal_max: 80, threshold_max: 95 },
    soil_ph: { optimal_min: 5.5, optimal_max: 6.5 },
  },
  soybean: {
    soil_temp_surface: { optimal_min: 20, optimal_max: 30 },
    soil_ph: { optimal_min: 6.0, optimal_max: 7.0 },
    soil_moisture: { optimal_min: 25, optimal_max: 45 },
  },
  lettuce: {
    air_temp: { optimal_min: 15, optimal_max: 22 },
    soil_moisture: { optimal_min: 35, optimal_max: 55 },
  },
  carrot: {
    soil_temp_10cm: { optimal_min: 15, optimal_max: 20 },
    soil_ph: { optimal_min: 6.0, optimal_max: 6.8 },
  },
  grape: {
    soil_ph: { optimal_min: 5.5, optimal_max: 6.5 },
    air_humidity: { optimal_min: 40, optimal_max: 60 },
  },
  cotton: {
    soil_temp_surface: { optimal_min: 20, optimal_max: 35 },
    air_temp: { optimal_min: 25, optimal_max: 35 },
  },
};

/**
 * Get thresholds for a specific sensor type, optionally adjusted for crop
 */
export function getSensorThresholds(sensorType, cropType = null) {
  const base = SENSOR_THRESHOLDS[sensorType];
  if (!base) return null;

  const thresholds = { ...base };

  // Apply crop-specific adjustments if available
  if (cropType && CROP_ADJUSTMENTS[cropType]?.[sensorType]) {
    Object.assign(thresholds, CROP_ADJUSTMENTS[cropType][sensorType]);
  }

  return thresholds;
}

/**
 * Get all sensor types with their thresholds
 */
export function getAllSensorTypes() {
  return Object.keys(SENSOR_THRESHOLDS);
}

export default {
  SENSOR_THRESHOLDS,
  CROP_ADJUSTMENTS,
  getSensorThresholds,
  getAllSensorTypes,
};
