import type { FastifyInstance } from "fastify";
import { db } from "../db";

export async function connectionRoutes(app: FastifyInstance) {
    app.get("/connections", async (req, reply) => {
        const { owner_type, owner_id } = req.query as { owner_type?: string; owner_id?: string };

        if (!owner_type || !owner_id) {
            return reply.code(400).send({ error: "owner_type and owner_id are required" });
        }

        const { rows } = await db.query(
        `
        select owner_type, owner_id, provider, subject,
            email, name, picture,
            scopes, expires_at, created_at, updated_at
        from connections
        where owner_type = $1 and owner_id = $2
        order by updated_at desc
        limit 50
        `,
        [owner_type, owner_id]
        );
        
        return rows;
    });
}