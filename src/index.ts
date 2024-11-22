import { Elysia } from "elysia";
import { note } from "./controllers/notes";
import { cors } from '@elysiajs/cors'


const app = new Elysia()
  .use(cors())
  .use(note)
  .get("/", () => "Hello Elysia")
  .get('/bot-stats', () => {
    console.log("Test, start");
    return { onlineUsers: Math.floor(Math.random() * 110000), activeBots: Math.floor(Math.random() * 11) };
  })
.listen(3001);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
