import { Elysia } from "elysia";
import { note } from "./controllers/notes";
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'


import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { botController } from "./controllers/bots";

const db = drizzle(process.env.DATABASE_URL!);

import { startBotStatusUpdate } from './services/botStatusService'; // Import the function to start the periodic task


const app = new Elysia()
  .use(cors())
  .use(swagger({
    scalarVersion: '1.25.74'
  }))

  .use(note)
  .use(botController)
.listen(3001);

startBotStatusUpdate(); // Start periodic status updates

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
