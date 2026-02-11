import type { FastifyInstance } from "fastify";
import {ulid} from "ulid";
import { createVerifier, createChallenge } from "../oauth/pkce";
import { getProvider } from "../providers/registry";
import { googleProvider } from "../providers/google";
import { fetchGoogleUserInfo } from "../providers/google_userinfo";
import { upsertConnection } from "../connections/store";

function requireQuery(q: any, key: string) {
    const v = q?.[key];
    if (!v || typeof v !== "string") throw new Error(`Missing query param: ${key}`);
    return v;
}

export async function oauthRoutes(app: FastifyInstance){

    app.get("/oauth/:provider/connect", async (req, reply) => {
        const providerName = (req.params as any).provider as string
        const provider = getProvider(providerName)

        if (!provider) return reply.code(404).send({ error: `Unknown provider: ${providerName}` });
        
        let owner_type: string;
        let owner_id: string;


        try {
            owner_type = requireQuery(req.query, "owner_type");
            owner_id = requireQuery(req.query, "owner_id");
        } catch (e: any) {
            return reply.code(400).send({ error: e.message });
        }


        const state = ulid();
        const verifier = createVerifier();
        const challenge = createChallenge(verifier);

        reply.setCookie("pkce_verifier", verifier, {httpOnly: true, path: "/", sameSite: "lax"});
        reply.setCookie("oauth_state", state, {httpOnly: true, path: "/", sameSite: "lax"});
        reply.setCookie("oauth_owner_type", owner_type, { httpOnly: true, path: "/", sameSite: "lax" });
        reply.setCookie("oauth_owner_id", owner_id, { httpOnly: true, path: "/", sameSite: "lax" });
        reply.setCookie("oauth_provider", providerName, { httpOnly: true, path: "/", sameSite: "lax" });


        const redirectUri = `${process.env.BASE_URL}/oauth/${providerName}/callback`;
        const scopes = provider.getDefaultScopes();

        const url = googleProvider.authorizeUrl({
            redirectUri,
            state,
            codeChallenge: challenge,
            scopes
        })

        return reply.redirect(url);
    });

    app.get("/oauth/:provider/callback", async(req,reply) => {
        const providerName = (req.params as any).provider as string
        const provider = getProvider(providerName)

        if (!provider) return reply.code(404).send({ error: `Unknown provider: ${providerName}` });

        const {code, state} = req.query as {code?: string, state?: string};
        const storedState = req.cookies["oauth_state"];
        const verifier = req.cookies["pkce_verifier"];

        const owner_type = (req.cookies as any)["oauth_owner_type"];
        const owner_id = (req.cookies as any)["oauth_owner_id"];

        if (!code || !state) return reply.code(400).send({ error: "Missing code/state"});
        if (!storedState || state !== storedState) return reply.code(400).send({ error: "Invalid state" });
        if (!verifier) return reply.code(400).send({error: "Missing verifier"});
        if (!owner_type || !owner_id) return reply.code(400).send({ error: "Missing owner context" });

        const redirectUri = `${process.env.BASE_URL}/oauth/${providerName}/callback`;
        
        const token = await provider.exchangeCode({code, redirectUri, codeVerifier: verifier });

        const user = await provider.getUserInfo({ accessToken: token.access_token });

        await upsertConnection({
            owner_type,
            owner_id,
            provider: providerName,
            subject: user.subject,
            scopes: provider.getDefaultScopes(),
            accessToken: token.access_token,
            refreshToken: token.refresh_token as string,
            expiresIn: token.expires_in as number,
            email: user.email as string,
            name: user.name as string,
            picture: user.picture as string,
          });

          reply.clearCookie("oauth_state", { path: "/" });
          reply.clearCookie("pkce_verifier", { path: "/" });
          reply.clearCookie("oauth_owner_type", { path: "/" });
          reply.clearCookie("oauth_owner_id", { path: "/" });
          reply.clearCookie("oauth_provider", { path: "/" });
      
          return reply.send({
            ok: true,
            provider: providerName,
            owner_type,
            owner_id,
            subject: user.subject,
            email: user.email,
            name: user.name,
            picture: user.picture,
          });
        });
}