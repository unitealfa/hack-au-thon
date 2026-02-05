import cron from "node-cron";
import { fieldDb } from "../database/db.js";
import { pollFieldData } from "./agromonitoring.js";

let cronJob = null;

/**
 * Start the data polling scheduler
 */
export function startPollingScheduler() {
  const pollInterval = process.env.POLL_INTERVAL || 6; // hours

  // Schedule: every 6 hours by default
  // Cron format: minute hour day month dayOfWeek
  const cronExpression = `0 */${pollInterval} * * *`;

  console.log(`\n📡 Starting data polling scheduler (every ${pollInterval} hours)...`);

  cronJob = cron.schedule(cronExpression, async () => {
    console.log(`\n⏰ [${new Date().toISOString()}] Running scheduled data poll...`);
    await pollAllFields();
  });

  // Run initial poll on startup
  setTimeout(() => {
    console.log("\n🚀 Running initial data poll...");
    pollAllFields();
  }, 5000); // Wait 5 seconds after server start

  console.log(`✅ Scheduler started: ${cronExpression}`);
}

/**
 * Stop the polling scheduler
 */
export function stopPollingScheduler() {
  if (cronJob) {
    cronJob.stop();
    console.log("Polling scheduler stopped");
  }
}

/**
 * Poll data for all active fields
 */
async function pollAllFields() {
  try {
    // Get all active fields (in a real app, you'd get all users' fields)
    // For now, we'll just get all fields from the database
    const db = await import("../database/db.js");
    const allFields = db.getDatabase()
      .prepare("SELECT * FROM fields WHERE is_active = 1 AND polygon_id IS NOT NULL")
      .all();

    if (allFields.length === 0) {
      console.log("No fields to poll");
      return;
    }

    console.log(`Polling ${allFields.length} field(s)...`);

    const results = await Promise.allSettled(
      allFields.map(field => pollFieldData(field))
    );

    const successful = results.filter(r => r.status === "fulfilled" && !r.value?.error).length;
    const failed = results.length - successful;

    console.log(`\n📊 Poll complete: ${successful} successful, ${failed} failed\n`);
  } catch (error) {
    console.error("Error in pollAllFields:", error);
  }
}

/**
 * Manual trigger for polling (API endpoint)
 */
export async function triggerManualPoll(fieldId) {
  try {
    const field = fieldDb.findById(fieldId);
    if (!field) {
      throw new Error("Field not found");
    }

    return await pollFieldData(field);
  } catch (error) {
    console.error("Manual poll error:", error);
    throw error;
  }
}

export default {
  startPollingScheduler,
  stopPollingScheduler,
  triggerManualPoll
};
