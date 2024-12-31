CREATE TABLE IF NOT EXISTS "commands" (
	"id" serial PRIMARY KEY NOT NULL,
	"command_text" varchar(20) NOT NULL,
	"n_uses" integer DEFAULT 0
);
