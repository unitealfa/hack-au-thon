import express from "express";
import { fieldDb, sensorDb, readingDb } from "../database/db.js";
import { SENSOR_THRESHOLDS, getSensorThresholds, getAllSensorTypes } from "../config/sensorThresholds.js";
import { listPolygons, getPolygonInfo } from "../services/agromonitoring.js";

const router = express.Router();

/**
 * Auto-create sensors for a field with scientific thresholds
 */
function createDefaultSensors(fieldId, cropType = null) {
  const sensorTypes = getAllSensorTypes();
  const created = [];

  for (const sensorType of sensorTypes) {
    const thresholds = getSensorThresholds(sensorType, cropType);
    if (!thresholds) continue;

    try {
      const sensorId = sensorDb.create(fieldId, sensorType, thresholds.name, thresholds.unit, {
        min: thresholds.threshold_min,
        max: thresholds.threshold_max,
        optimalMin: thresholds.optimal_min,
        optimalMax: thresholds.optimal_max,
        source: thresholds.source,
      });
      created.push({ sensorId, sensorType });
    } catch (err) {
      console.warn(`Sensor ${sensorType} already exists for field ${fieldId}`);
    }
  }

  return created;
}

/**
 * GET /api/fields/polygons
 * List all polygons from AgroMonitoring account
 */
router.get("/polygons", async (req, res) => {
  try {
    const polygons = await listPolygons();
    res.json({ success: true, polygons });
  } catch (error) {
    console.error("List polygons error:", error);
    res.status(500).json({ error: "Failed to fetch polygons from AgroMonitoring", details: error.message });
  }
});

/**
 * GET /api/fields/polygons/:id
 * Get info for a specific polygon from AgroMonitoring
 */
router.get("/polygons/:id", async (req, res) => {
  try {
    const polygon = await getPolygonInfo(req.params.id);
    res.json({ success: true, polygon });
  } catch (error) {
    console.error("Get polygon error:", error);
    res.status(500).json({ error: "Failed to fetch polygon info", details: error.message });
  }
});

/**
 * GET /api/fields
 * Get all fields for the authenticated user
 */
router.get("/", (req, res) => {
  try {
    const fields = fieldDb.findByUserId(req.user.userId);
    res.json({ success: true, fields });
  } catch (error) {
    console.error("Get fields error:", error);
    res.status(500).json({ error: "Failed to fetch fields" });
  }
});

/**
 * GET /api/fields/:id
 * Get a specific field with sensors
 */
router.get("/:id", (req, res) => {
  try {
    const field = fieldDb.findById(req.params.id);
    
    if (!field) {
      return res.status(404).json({ error: "Field not found" });
    }

    // Check ownership
    if (field.user_id !== req.user.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const sensors = sensorDb.findByFieldId(field.id);

    res.json({
      success: true,
      field: {
        ...field,
        sensors
      }
    });
  } catch (error) {
    console.error("Get field error:", error);
    res.status(500).json({ error: "Failed to fetch field" });
  }
});

/**
 * POST /api/fields
 * Create a new field
 */
router.post("/", (req, res) => {
  try {
    const { name, polygonId, cropType, locationLat, locationLon, areaSize } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Field name is required" });
    }

    const fieldId = fieldDb.create(req.user.userId, name, polygonId, cropType);
    
    // Update additional fields if provided
    if (locationLat || locationLon || areaSize) {
      fieldDb.update(fieldId, {
        location_lat: locationLat,
        location_lon: locationLon,
        area_size: areaSize
      });
    }

    // Auto-create sensors with scientific thresholds
    const sensors = createDefaultSensors(fieldId, cropType);
    console.log(`✅ Created ${sensors.length} sensors for field ${name}`);

    const field = fieldDb.findById(fieldId);

    res.status(201).json({
      success: true,
      message: "Field created successfully",
      field,
      sensorsCreated: sensors.length
    });
  } catch (error) {
    console.error("Create field error:", error);
    res.status(500).json({ error: "Failed to create field" });
  }
});

/**
 * PUT /api/fields/:id
 * Update a field
 */
router.put("/:id", (req, res) => {
  try {
    const field = fieldDb.findById(req.params.id);
    
    if (!field) {
      return res.status(404).json({ error: "Field not found" });
    }

    if (field.user_id !== req.user.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { name, cropType, locationLat, locationLon, areaSize } = req.body;
    
    const updated = fieldDb.update(req.params.id, {
      name,
      crop_type: cropType,
      location_lat: locationLat,
      location_lon: locationLon,
      area_size: areaSize
    });

    if (!updated) {
      return res.status(400).json({ error: "No changes made" });
    }

    const updatedField = fieldDb.findById(req.params.id);
    res.json({
      success: true,
      message: "Field updated successfully",
      field: updatedField
    });
  } catch (error) {
    console.error("Update field error:", error);
    res.status(500).json({ error: "Failed to update field" });
  }
});

export default router;
