import { pgTable, varchar, timestamp, text, serial } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { bot_commands } from "./bot_command";

export const bots = pgTable("bots", {
  id:  serial("id").primaryKey(),
  name: varchar("name",{length: 50}).notNull().default(""),
  authKey: varchar("auth_key", { length: 128 }).notNull().unique(), // Authentication Key
  botDiscordId: varchar("bot_discord_id", { length: 200 }).notNull(), // Discord Bot ID
  botStatus: text("bot_status")
    .$type<"online" | "offline">() // Status must be "online" or "offline"
    .notNull(),
  lastUpdate: timestamp("last_update").defaultNow().notNull(), // Last updated timestamp
  createdAt: timestamp("created_at").defaultNow().notNull(), // Creation timestamp
  ownerId: varchar("owner_id", { length: 36 }).notNull(), // Owner ID, foreign key to users table
});

export const botsRelation = relations(bots, ({ many }) => ({
	bot_commands: many(bot_commands),
}));