import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync, existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, "agricoole.db");
const SCHEMA_PATH = join(__dirname, "schema.sql");

let db = null;

/**
 * Initialize database connection and create tables
 */
export function initDatabase() {
  if (db) return db;

  console.log("Initializing database at:", DB_PATH);

  db = new Database(DB_PATH);

  // Enable foreign keys
  db.pragma("foreign_keys = ON");

  // Check if database needs initialization
  const tableCount = db.prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'").get();
  
  if (tableCount.count === 0 && existsSync(SCHEMA_PATH)) {
    // Only run schema if database is empty
    const schema = readFileSync(SCHEMA_PATH, "utf-8");
    db.exec(schema);
    console.log("Database schema initialized");
  }

  return db;
}

/**
 * Get database instance
 */
export function getDatabase() {
  if (!db) {
    return initDatabase();
  }
  return db;
}

/**
 * Close database connection
 */
export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    console.log("Database connection closed");
  }
}

/**
 * User operations
 */
export const userDb = {
  create(email, passwordHash, name, farmName = null) {
    const db = getDatabase();
    const stmt = db.prepare(
      "INSERT INTO users (email, password_hash, name, farm_name) VALUES (?, ?, ?, ?)"
    );
    const result = stmt.run(email, passwordHash, name, farmName);
    return result.lastInsertRowid;
  },

  findByEmail(email) {
    const db = getDatabase();
    const stmt = db.prepare("SELECT * FROM users WHERE email = ?");
    return stmt.get(email);
  },

  findById(id) {
    const db = getDatabase();
    const stmt = db.prepare("SELECT id, email, name, farm_name, created_at FROM users WHERE id = ?");
    return stmt.get(id);
  },

  update(id, data) {
    const db = getDatabase();
    const fields = [];
    const values = [];

    if (data.name !== undefined) {
      fields.push("name = ?");
      values.push(data.name);
    }
    if (data.farm_name !== undefined) {
      fields.push("farm_name = ?");
      values.push(data.farm_name);
    }

    if (fields.length === 0) return false;

    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    const stmt = db.prepare(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`);
    const result = stmt.run(...values);
    return result.changes > 0;
  }
};

/**
 * Field operations
 */
export const fieldDb = {
  create(userId, name, polygonId, cropType = null) {
    const db = getDatabase();
    const stmt = db.prepare(
      "INSERT INTO fields (user_id, name, polygon_id, crop_type) VALUES (?, ?, ?, ?)"
    );
    const result = stmt.run(userId, name, polygonId, cropType);
    return result.lastInsertRowid;
  },

  findById(id) {
    const db = getDatabase();
    const stmt = db.prepare("SELECT * FROM fields WHERE id = ?");
    return stmt.get(id);
  },

  findByUserId(userId) {
    const db = getDatabase();
    const stmt = db.prepare("SELECT * FROM fields WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC");
    return stmt.all(userId);
  },

  update(id, data) {
    const db = getDatabase();
    const fields = [];
    const values = [];

    Object.keys(data).forEach(key => {
      if (key !== "id" && data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    });

    if (fields.length === 0) return false;

    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    const stmt = db.prepare(`UPDATE fields SET ${fields.join(", ")} WHERE id = ?`);
    const result = stmt.run(...values);
    return result.changes > 0;
  }
};

/**
 * Sensor operations
 */
export const sensorDb = {
  create(fieldId, sensorType, sensorName, unit, thresholds = {}) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO sensors 
      (field_id, sensor_type, sensor_name, unit, threshold_min, threshold_max, optimal_min, optimal_max, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      fieldId,
      sensorType,
      sensorName,
      unit,
      thresholds.min || null,
      thresholds.max || null,
      thresholds.optimalMin || null,
      thresholds.optimalMax || null,
      thresholds.source || "simulated"
    );
    return result.lastInsertRowid;
  },

  findByFieldId(fieldId) {
    const db = getDatabase();
    const stmt = db.prepare("SELECT * FROM sensors WHERE field_id = ? AND is_active = 1");
    return stmt.all(fieldId);
  },

  findById(id) {
    const db = getDatabase();
    const stmt = db.prepare("SELECT * FROM sensors WHERE id = ?");
    return stmt.get(id);
  },

  updateThresholds(id, thresholds) {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE sensors 
      SET threshold_min = ?, threshold_max = ?, optimal_min = ?, optimal_max = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    const result = stmt.run(
      thresholds.min,
      thresholds.max,
      thresholds.optimalMin || null,
      thresholds.optimalMax || null,
      id
    );
    return result.changes > 0;
  }
};

/**
 * Sensor reading operations
 */
export const readingDb = {
  create(sensorId, value, timestamp, source = "simulated", metadata = null) {
    const db = getDatabase();
    
    // Get sensor thresholds
    const sensor = sensorDb.findById(sensorId);
    let isHealthy = null;
    
    if (sensor && sensor.threshold_min !== null && sensor.threshold_max !== null) {
      isHealthy = value >= sensor.threshold_min && value <= sensor.threshold_max ? 1 : 0;
    }

    const stmt = db.prepare(`
      INSERT INTO sensor_readings (sensor_id, value, timestamp, source, is_healthy, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      sensorId,
      value,
      timestamp,
      source,
      isHealthy,
      metadata ? JSON.stringify(metadata) : null
    );
    return result.lastInsertRowid;
  },

  findLatestBySensor(sensorId, limit = 1) {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM sensor_readings 
      WHERE sensor_id = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `);
    return limit === 1 ? stmt.get(sensorId, limit) : stmt.all(sensorId, limit);
  },

  findByTimeRange(sensorId, startTime, endTime) {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM sensor_readings 
      WHERE sensor_id = ? AND timestamp BETWEEN ? AND ?
      ORDER BY timestamp ASC
    `);
    return stmt.all(sensorId, startTime, endTime);
  },

  findLatestByField(fieldId) {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT sr.*, s.sensor_type, s.sensor_name, s.unit, s.threshold_min, s.threshold_max
      FROM sensor_readings sr
      JOIN sensors s ON sr.sensor_id = s.id
      WHERE s.field_id = ? AND s.is_active = 1
      AND sr.id IN (
        SELECT MAX(id) FROM sensor_readings 
        WHERE sensor_id = s.id 
        GROUP BY sensor_id
      )
      ORDER BY s.sensor_type
    `);
    return stmt.all(fieldId);
  }
};

/**
 * Alert operations
 */
export const alertDb = {
  create(userId, fieldId, sensorId, alertType, severity, title, message) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO alerts (user_id, field_id, sensor_id, alert_type, severity, title, message)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(userId, fieldId, sensorId, alertType, severity, title, message);
    return result.lastInsertRowid;
  },

  findByUserId(userId, unreadOnly = false) {
    const db = getDatabase();
    const query = unreadOnly
      ? "SELECT * FROM alerts WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC"
      : "SELECT * FROM alerts WHERE user_id = ? ORDER BY created_at DESC LIMIT 50";
    const stmt = db.prepare(query);
    return stmt.all(userId);
  },

  markAsRead(id) {
    const db = getDatabase();
    const stmt = db.prepare("UPDATE alerts SET is_read = 1 WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  },

  markAsResolved(id) {
    const db = getDatabase();
    const stmt = db.prepare("UPDATE alerts SET is_resolved = 1, resolved_at = CURRENT_TIMESTAMP WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }
};

/**
 * API log operations
 */
export const apiLogDb = {
  create(endpoint, polygonId, statusCode, responseData = null, errorMessage = null) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO api_logs (endpoint, polygon_id, status_code, response_data, error_message)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      endpoint,
      polygonId,
      statusCode,
      responseData ? JSON.stringify(responseData) : null,
      errorMessage
    );
    return result.lastInsertRowid;
  },

  findRecent(limit = 20) {
    const db = getDatabase();
    const stmt = db.prepare("SELECT * FROM api_logs ORDER BY timestamp DESC LIMIT ?");
    return stmt.all(limit);
  }
};

export default {
  initDatabase,
  getDatabase,
  closeDatabase,
  userDb,
  fieldDb,
  sensorDb,
  readingDb,
  alertDb,
  apiLogDb
};
