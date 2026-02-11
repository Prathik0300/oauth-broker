import { ulid } from "ulid";
import { db } from "../db";
import { encryptToken } from "../vault/encrypt";

export async function upsertConnection(params: {
    owner_type: string;
    owner_id: string;

    provider: string;
    subject: string;
    scopes: string[];

    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
    
    email?: string;
    name?: string;
    picture?: string;
}) {
    const id = ulid();
    const now = new Date();
    const expiresAt = params.expiresIn ? new Date(Date.now() + params.expiresIn * 1000) : null;
    const accessEnc = await encryptToken(params.accessToken);
    const refreshEnc = params?.refreshToken ? await encryptToken(params.refreshToken) : null;

    await db.query(
      `
      insert into connections (
        id, owner_type, owner_id,
        provider, subject, scopes,
        access_token_enc, refresh_token_enc, expires_at,
        email, name, picture,
        created_at, updated_at
      )
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$13)
      on conflict (owner_type, owner_id, provider, subject)
      do update set
        scopes = excluded.scopes,
        access_token_enc = excluded.access_token_enc,
        refresh_token_enc = coalesce(excluded.refresh_token_enc, connections.refresh_token_enc),
        expires_at = excluded.expires_at,
        email = coalesce(excluded.email, connections.email),
        name = coalesce(excluded.name, connections.name),
        picture = coalesce(excluded.picture, connections.picture),
        updated_at = excluded.updated_at
      `,
      [
        id,
        params.owner_type,
        params.owner_id,
        params.provider,
        params.subject,
        params.scopes.join(" "),
        accessEnc,
        refreshEnc,
        expiresAt,
        params.email ?? null,
        params.name ?? null,
        params.picture ?? null,
        now,
      ]
    );
}