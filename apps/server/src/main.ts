import "dotenv/config";
import Fastify from "fastify";
import cookie from "@fastify/cookie";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import { oauthRoutes } from "./routes/oauth";
import { connectionRoutes } from "./routes/connections";

async function start() {
    const app = Fastify({logger: true});

    await app.register(helmet)
    await app.register(cookie)
    await app.register(cors, { origin: true, credentials: true });
    await app.register(oauthRoutes);
    await app.register(connectionRoutes);
    
    app.get("/health", async () => ({ok : true}));
    
    app.listen({port: 3001, host: "0.0.0.0"});
    console.log("Server is running on port 3001");
}

start().catch((err) => {
    console.error(err);
    process.exit(1);
});