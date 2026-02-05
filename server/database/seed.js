import bcrypt from "bcrypt";
import { initDatabase, userDb, fieldDb, sensorDb, readingDb } from "./db.js";

const SALT_ROUNDS = 10;

/**
 * Default sensor configurations for a field
 */
const DEFAULT_SENSORS = [
  {
    type: "soil_temp_surface",
    name: "Soil Temperature (Surface)",
    unit: "°C",
    thresholds: { min: 5, max: 40, optimalMin: 15, optimalMax: 30 },
    source: "api"
  },
  {
    type: "soil_temp_10cm",
    name: "Soil Temperature (10cm depth)",
    unit: "°C",
    thresholds: { min: 5, max: 40, optimalMin: 15, optimalMax: 30 },
    source: "api"
  },
  {
    type: "soil_moisture",
    name: "Soil Moisture",
    unit: "%",
    thresholds: { min: 10, max: 80, optimalMin: 20, optimalMax: 60 },
    source: "api"
  },
  {
    type: "soil_ph",
    name: "Soil pH",
    unit: "pH",
    thresholds: { min: 5.5, max: 7.5, optimalMin: 6.0, optimalMax: 7.0 },
    source: "simulated"
  },
  {
    type: "air_temp",
    name: "Air Temperature",
    unit: "°C",
    thresholds: { min: 5, max: 40, optimalMin: 18, optimalMax: 28 },
    source: "simulated"
  },
  {
    type: "air_humidity",
    name: "Air Humidity",
    unit: "%",
    thresholds: { min: 30, max: 90, optimalMin: 50, optimalMax: 70 },
    source: "simulated"
  }
];

/**
 * Create sample sensor readings
 */
function createSampleReadings(sensorId, sensorType) {
  const now = new Date();
  const readings = [];

  // Generate last 7 days of readings (2 per day)
  for (let day = 6; day >= 0; day--) {
    for (let reading = 0; reading < 2; reading++) {
      const timestamp = new Date(now);
      timestamp.setDate(timestamp.getDate() - day);
      timestamp.setHours(reading === 0 ? 6 : 18, 0, 0, 0);

      let value;
      const source = sensorType.includes("api") ? "api" : "simulated";

      switch (sensorType) {
        case "soil_temp_surface":
          value = 8 + Math.random() * 10; // -8°C to 2°C (winter)
          break;
        case "soil_temp_10cm":
          value = 5 + Math.random() * 8; // -10°C to -2°C (winter)
          break;
        case "soil_moisture":
          value = 20 + Math.random() * 30; // 20-50%
          break;
        case "soil_ph":
          value = 6.0 + Math.random() * 1.2; // 6.0-7.2
          break;
        case "air_temp":
          value = 10 + Math.random() * 15; // 10-25°C
          break;
        case "air_humidity":
          value = 45 + Math.random() * 25; // 45-70%
          break;
        default:
          value = Math.random() * 100;
      }

      readings.push({
        sensorId,
        value: parseFloat(value.toFixed(2)),
        timestamp: timestamp.toISOString()
      });
    }
  }

  return readings;
}

/**
 * Seed database with sample data
 */
export async function seedDatabase() {
  console.log("🌱 Seeding database...");

  const db = initDatabase();

  // Check if already seeded
  const existingUser = userDb.findByEmail("demo@agricoole.com");
  if (existingUser) {
    console.log("⚠️  Database already seeded. Skipping...");
    return;
  }

  try {
    console.log("Creating demo user...");
    // Create demo user
    const passwordHash = await bcrypt.hash("demo123", SALT_ROUNDS);
    const userId = userDb.create(
      "demo@agricoole.com",
      passwordHash,
      "Demo Farmer",
      "Iowa Demo Farm"
    );
    console.log("✅ Created demo user (email: demo@agricoole.com, password: demo123)");

    console.log("Creating demo field...");
    // Create demo field (using the actual polygon from AgroMonitoring)
    const fieldId = fieldDb.create(
      userId,
      "Iowa Demo Field",
      "6983e1db1be1fb0008fa39a2", // Real polygon ID
      "Wheat"
    );
    console.log("✅ Created demo field");

    console.log("Creating sensors...");
    // Create sensors for the field
    const sensorIds = {};
    for (const sensorConfig of DEFAULT_SENSORS) {
      const sensorId = sensorDb.create(
        fieldId,
        sensorConfig.type,
        sensorConfig.name,
        sensorConfig.unit,
        sensorConfig.thresholds
      );
      sensorIds[sensorConfig.type] = sensorId;
      console.log(`  ✓ ${sensorConfig.name}`);
    }

    console.log("Creating sample readings...");
    // Create sample readings for each sensor
    for (const [type, sensorId] of Object.entries(sensorIds)) {
      const readings = createSampleReadings(sensorId, type);
      for (const reading of readings) {
        readingDb.create(
          reading.sensorId,
          reading.value,
          reading.timestamp,
          type.includes("soil_") ? "api" : "simulated"
        );
      }
      console.log(`  ✓ ${readings.length} readings for ${type}`);
    }

    console.log("\n🎉 Database seeded successfully!");
    console.log("\n📝 Demo credentials:");
    console.log("   Email: demo@agricoole.com");
    console.log("   Password: demo123\n");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run seed if called directly
const isMainModule = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));
if (isMainModule) {
  seedDatabase()
    .then(() => {
      console.log("\n✅ Seed completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Seed failed:", error);
      process.exit(1);
    });
}
