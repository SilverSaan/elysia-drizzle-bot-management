import { db } from '../db/connection'; // Your database connection
import { bots } from '../db/schema/bots'; // Your bot schema
import { eq, gt, inArray, sql } from 'drizzle-orm'; // Use 'inArray' for where in

// Define the function to periodically check bot statuses
export async function checkAndUpdateBotStatuses() {
  try {
    // Get the current time
    const now = new Date();
    
    // Query to get all bots with the status 'online' and whose last update is more than 30 seconds ago
    var botsToUpdate = await db
      .select()
      .from(bots)
      .where(eq(bots.botStatus, 'online')); // Filter by online status

    const currentTime = new Date();

    // Check each bot to see if it should be updated
    var botsToUpdate = botsToUpdate.filter(bot => {
      // Check if the last update was more than 30 seconds ago
      const lastUpdateTime = new Date(bot.lastUpdate);
      return (currentTime.getTime() - lastUpdateTime.getTime()) > 30000; // More than 30 seconds
    });
  // Last update was more than 30 seconds ago

    // If any bots need updating, update them to offline
    if (botsToUpdate.length > 0) {
      await db.update(bots)
        .set({ botStatus: 'offline', lastUpdate: new Date() })  // Set status to offline
        .where(inArray(bots.id, botsToUpdate.map((bot: { id: any; }) => bot.id))) // Apply to the selected bots using inArray
        .returning();

      console.log(`Updated ${botsToUpdate.length} bots to offline.`);
    } else {
      console.log("No bots need updating.");
    }
  } catch (err) {
    console.error("Error while updating bot statuses: ", err);
  }
}

// Run this function periodically (every 30 seconds, for example)
export function startBotStatusUpdate() {
  setInterval(checkAndUpdateBotStatuses, 30000); // Run every 30 seconds
}
