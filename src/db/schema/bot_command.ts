import { pgTable, varchar, timestamp, text, serial, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { bots } from "./bots";

export const bot_commands = pgTable("commands", {
    id: serial("id").primaryKey(),
    commandText: varchar("command_text", {length: 20}).notNull(), 
    nUses: integer("n_uses").default(0),
    botId: integer("bot_id").references(() => bots.id, {onDelete: 'cascade'}).notNull()
})

export const commandRelation = relations(bot_commands, ({ one }) => ({
	commands: one(bots, {
		fields: [bot_commands.botId],
		references: [bots.id],
	}),
}));