import { Elysia, t, NotFoundError } from 'elysia';
import { db } from '../db/connection'; // Import the database connection
import { bots } from '../db/schema/bots'; // Import your bot table schema
import { eq } from 'drizzle-orm'; // Import helper for conditional queries
import { ConflictError } from '../errors/exceptions';

export const botController = new Elysia()
    .error({
      ConflictError
    })
    .onError(({ error, code }) => { 
      console.error(error) 

      switch (code) {

        case 'NOT_FOUND':
          return{message: 'Bot Not Found :('}
        case 'ConflictError':
          return {message: 'Bot Already Exists / Authentication Key has been used'}
      }
      return { message: 'An unexpected error occurred.' }; // Default error message

    })
    .ws('/ws', {
      // Validate incoming message schema
      body: t.Object({
          auth_key: t.String(),   // Validate the 'auth_key' field
          bot_status: t.Enum({ online: 'online', offline: 'offline' }), // Validate the 'bot_status' field (should be a string like "online", "offline", etc.)
          name: t.String()        // Validate the 'name' field (bot name)
      }),
      // Handle incoming messages
      message(ws, { auth_key, bot_status, name }) {
          const { id } = ws.data.query;
  
          // Validate the received message and update bot status
          if (!auth_key || !bot_status || !name) {
              ws.send({ error: 'Missing required fields (auth_key, bot_status, or name)' });
              return;
          }
          // Store bot status in memory or update existing one
          db.update(bots)
            .set({
                botStatus: bot_status,
                lastUpdate: new Date(),
            })
            .where(eq(bots.authKey, auth_key)) // Match the bot by auth_key
            .returning()
            .then(updatedBot => {
                console.log(`Updated status for bot: ${name} (${auth_key}) - Status: ${bot_status}`);
                ws.send({
                    id,
                    message: `Status update for ${name} received`,
                    status: bot_status,
                    time: Date.now()
                });
            })
            .catch(err => {
                ws.send({ error: 'Failed to update bot status' });
                console.error(err);
            });
      }
    })
    .get('/bots', async () => {
      const allBots = await db.select().from(bots);
      return allBots;
    })
    .get('/bots/:id', async ({params}) => {
      const bot = await db
        .select()
        .from(bots)
        .where(eq(bots.id, Number(params.id))) // Find bot by auth_key
        .limit(1); // Ensure we only get one result
  
        // If no bot is found, return a 404 response
        if (bot.length === 0) {
          throw new NotFoundError()
        }
        return bot[0]; // Return the first matching bot
      },
      {
        params: t.Object({
          id: t.String(), // Validate ID from the route
        }),
      }
    )
    .get('/bots_auth/:auth_key', async ({params}) => {
      const bot = await db
        .select()
        .from(bots)
        .where(eq(bots.authKey, params.auth_key)) // Find bot by auth_key
        .limit(1); // Ensure we only get one result

        // If no bot is found, return a 404 response
        if (bot.length === 0) {
          throw new NotFoundError()
        }
        return bot[0]; // Return the first matching bot
      },
      {
        params: t.Object({
          auth_key: t.String(), // Validate ID from the route
        }),
      }
    )
    .post(
      '/bots',
      async ({ body }) => {
        try {
        const newBot = await db
          .insert(bots)
          .values({
            authKey: body.auth_key,
            botDiscordId: body.bot_discord_id,
            botStatus: body.bot_status ?? 'offline', // Ensure explicit type
            ownerId: body.owner_id,
            name: body.name
          })
          .returning(); // Return the created bot
        return newBot;
        }catch(error: any){
          if (error.code === '23505') { // Postgres unique constraint violation
            throw new ConflictError('A bot with the given authentication key already exists.');
          }

          throw error; // Re-throw other errors
        }
      },
      {
        body: t.Object({
          auth_key: t.String(),
          bot_discord_id: t.String(),
          bot_status: t.Optional(t.Enum({ online: 'online', offline: 'offline' })),
          owner_id: t.String(),
          name: t.String(),
        }),
        error({ code, error }) {
          switch (code) {
            case 'VALIDATION':
              console.log(error.all)

              // Find a specific error name (path is OpenAPI Schema compliance)
            const name = error.all.find(
              (x) => x.summary && x.path === '/name'
            )
    
            if(name)
            console.log(name)
          }
        }
      }
    )
    // Endpoint to update a bot by ID
    .put(
      '/bots/:auth_key',
      async ({ body, params }) => {
        const updatedBot = await db
          .update(bots)
          .set({
            botStatus: body.bot_status,
            lastUpdate: new Date(),
          })
          .where(eq(bots.authKey, params.auth_key))
          .returning(); // Return the updated bot
        return updatedBot;
      },
      {
        params: t.Object({
        auth_key: t.String(),  // Auth key is now used as the identifier
      }),
        body: t.Object({
          bot_status: t.Enum({ online: 'online', offline: 'offline' }),
        }),
      }
    )
    // Endpoint to delete a bot by ID
    .delete(
      '/bots/:id',
      async ({ params }) => {
        const deletedBot = await db
          .delete(bots)
          .where(eq(bots.id, Number(params.id)))
          .returning(); // Return the deleted bot
        return deletedBot;
      },
      {
        params: t.Object({
          id: t.String(), // Validate ID from the route
        }),
      }
    )
    .post(
      '/bots/:id/jsons', 
      async ({ body, params }) => {
        
        const bot = await db
          .select()
          .from(bots)
          .where(eq(bots.id, Number(params.id))) // Find bot by ID
          .limit(1); // Ensure we only get one result
        
        // If no bot is found, return a 404 response
        if (bot.length === 0) {
          throw new NotFoundError()
        }

        const file = body.file;

        // Check if the file is a valid JSON file
        
  
        // If it doesn't exist create a folder in storage with the bot id
        const fs = require('fs');
        const path = require('path');


        if (!file.name.endsWith('.json')) {
          throw new Error('Invalid file type. Please upload a JSON file.');
        }
        //Check contents to ensure it is a valid JSON file
        let json = null;
        try {
          const fileContent = await file.text();
          json = JSON.parse(fileContent);
        } catch (error) {
          throw new Error('Invalid JSON file. Please upload a valid JSON file.');
        }

        const botId = params.id;
        const botFolder = path.join(__dirname, '..', 'storage', botId);

        if (!fs.existsSync(botFolder)) {
          fs.mkdirSync(botFolder, { recursive: true });
        }

        const jsonFilePath = path.join(botFolder, body.file.name);
        await Bun.write(jsonFilePath, file);

        return { message: 'JSON file saved successfully', path: jsonFilePath };
        },
        {
          params: t.Object({
            id: t.String(), // Validate ID from the route
          }),
          body: t.Object({
            file: t.File(),
          }), 
        }
      )
    .get('/bots/:id/jsons', ({ params }) => {
      const fs = require('fs');
      const path = require('path');

      const botId = params.id;
      const botFolder = path.join(__dirname, '..', 'storage', botId);

      if (!fs.existsSync(botFolder)) {
        throw new NotFoundError('No JSON files found for the bot');
      }

      //Return Key Value pairs where key is the file name and value is the file content
      return fs.readdirSync(botFolder).map((file: string) => {
        const filePath = path.join(botFolder, file);
        let json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return {
          [file]: json
        };
      });

    },{
      params: t.Object({
        id: t.String(), // Validate ID from the route
      }), 
    });

