import express from "express";
import { fieldDb, sensorDb, readingDb } from "../database/db.js";

const router = express.Router();

/**
 * GET /api/sensors/:sensorId/readings
 * Get readings for a specific sensor
 */
router.get("/:sensorId/readings", (req, res) => {
  try {
    const { sensorId } = req.params;
    const { limit = 50, startDate, endDate } = req.query;

    const sensor = sensorDb.findById(sensorId);
    if (!sensor) {
      return res.status(404).json({ error: "Sensor not found" });
    }

    // Verify user owns the field
    const field = fieldDb.findById(sensor.field_id);
    if (field.user_id !== req.user.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    let readings;
    if (startDate && endDate) {
      readings = readingDb.findByTimeRange(sensorId, startDate, endDate);
    } else {
      readings = readingDb.findLatestBySensor(sensorId, parseInt(limit));
    }

    res.json({
      success: true,
      sensor: {
        id: sensor.id,
        name: sensor.sensor_name,
        type: sensor.sensor_type,
        unit: sensor.unit
      },
      readings
    });
  } catch (error) {
    console.error("Get sensor readings error:", error);
    res.status(500).json({ error: "Failed to fetch readings" });
  }
});

/**
 * PUT /api/sensors/:sensorId/thresholds
 * Update sensor thresholds
 */
router.put("/:sensorId/thresholds", (req, res) => {
  try {
    const { sensorId } = req.params;
    const { min, max, optimalMin, optimalMax } = req.body;

    const sensor = sensorDb.findById(sensorId);
    if (!sensor) {
      return res.status(404).json({ error: "Sensor not found" });
    }

    // Verify user owns the field
    const field = fieldDb.findById(sensor.field_id);
    if (field.user_id !== req.user.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const updated = sensorDb.updateThresholds(sensorId, {
      min,
      max,
      optimalMin,
      optimalMax
    });

    if (!updated) {
      return res.status(400).json({ error: "Failed to update thresholds" });
    }

    const updatedSensor = sensorDb.findById(sensorId);
    res.json({
      success: true,
      message: "Thresholds updated successfully",
      sensor: updatedSensor
    });
  } catch (error) {
    console.error("Update thresholds error:", error);
    res.status(500).json({ error: "Failed to update thresholds" });
  }
});

export default router;
