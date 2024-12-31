CREATE TABLE IF NOT EXISTS "bots" (
	"id" serial PRIMARY KEY NOT NULL,
	"auth_key" varchar(128) NOT NULL,
	"bot_discord_id" varchar(20) NOT NULL,
	"bot_status" text NOT NULL,
	"last_update" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"owner_id" varchar(36) NOT NULL
);
