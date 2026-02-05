-- Agricoole Database Schema
-- SQLite Database for Agricultural Monitoring Platform

-- Users table (authentication)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    farm_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- Fields/Polygons (farm areas)
CREATE TABLE IF NOT EXISTS fields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    polygon_id TEXT, -- AgroMonitoring polygon ID
    location_lat REAL,
    location_lon REAL,
    crop_type TEXT,
    area_size REAL, -- in hectares
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_fields_user_id ON fields(user_id);
CREATE INDEX idx_fields_polygon_id ON fields(polygon_id);

-- Sensor configurations (thresholds and settings)
CREATE TABLE IF NOT EXISTS sensors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    field_id INTEGER NOT NULL,
    sensor_type TEXT NOT NULL, -- 'soil_temp_surface', 'soil_temp_10cm', 'soil_moisture', 'soil_ph', 'air_temp', 'air_humidity'
    sensor_name TEXT NOT NULL,
    unit TEXT NOT NULL, -- '°C', '%', 'pH'
    threshold_min REAL,
    threshold_max REAL,
    optimal_min REAL,
    optimal_max REAL,
    is_active BOOLEAN DEFAULT 1,
    source TEXT DEFAULT 'simulated', -- 'api' or 'simulated'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE CASCADE,
    UNIQUE(field_id, sensor_type)
);

CREATE INDEX idx_sensors_field_id ON sensors(field_id);
CREATE INDEX idx_sensors_type ON sensors(sensor_type);

-- Sensor readings (time-series data)
CREATE TABLE IF NOT EXISTS sensor_readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sensor_id INTEGER NOT NULL,
    value REAL NOT NULL,
    timestamp DATETIME NOT NULL,
    source TEXT DEFAULT 'simulated', -- 'api' or 'simulated'
    is_healthy BOOLEAN, -- computed based on thresholds
    metadata TEXT, -- JSON string for additional info
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sensor_id) REFERENCES sensors(id) ON DELETE CASCADE
);

CREATE INDEX idx_readings_sensor_id ON sensor_readings(sensor_id);
CREATE INDEX idx_readings_timestamp ON sensor_readings(timestamp);
CREATE INDEX idx_readings_sensor_timestamp ON sensor_readings(sensor_id, timestamp DESC);

-- Plant analysis sessions (links to AI widget)
CREATE TABLE IF NOT EXISTS plant_analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    field_id INTEGER,
    session_id TEXT UNIQUE NOT NULL, -- matches widget session ID
    session_title TEXT,
    state TEXT, -- 'PHOTO_GATE', 'ANALYSE', 'CHAT'
    active_plant_context TEXT,
    history TEXT, -- JSON array of messages
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE SET NULL
);

CREATE INDEX idx_analyses_user_id ON plant_analyses(user_id);
CREATE INDEX idx_analyses_field_id ON plant_analyses(field_id);
CREATE INDEX idx_analyses_session_id ON plant_analyses(session_id);

-- Alerts and notifications
CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    field_id INTEGER,
    sensor_id INTEGER,
    alert_type TEXT NOT NULL, -- 'threshold_exceeded', 'sensor_offline', 'critical'
    severity TEXT DEFAULT 'warning', -- 'info', 'warning', 'critical'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT 0,
    is_resolved BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE CASCADE,
    FOREIGN KEY (sensor_id) REFERENCES sensors(id) ON DELETE SET NULL
);

CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_is_read ON alerts(is_read);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);

-- API polling log (track AgroMonitoring API calls)
CREATE TABLE IF NOT EXISTS api_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint TEXT NOT NULL,
    polygon_id TEXT,
    status_code INTEGER,
    response_data TEXT, -- JSON
    error_message TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_api_logs_timestamp ON api_logs(timestamp DESC);
CREATE INDEX idx_api_logs_polygon_id ON api_logs(polygon_id);
