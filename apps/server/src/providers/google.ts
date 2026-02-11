import type { OAuthProvider } from "./base";

export const googleProvider: OAuthProvider = {
    name: "google",
    getDefaultScopes() {
        return ["openid", "email", "profile"];
    },
    authorizeUrl({ redirectUri, state, codeChallenge, scopes }) {
        const url = new URL("https://accounts.google.com/o/oauth2/v2/auth")
        url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!);
        url.searchParams.set("redirect_uri", redirectUri);
        url.searchParams.set("response_type", "code");
        url.searchParams.set("state", state);
        url.searchParams.set("code_challenge", codeChallenge);
        url.searchParams.set("scope", scopes.join(" "));
        url.searchParams.set("code_challenge_method", "S256");
        url.searchParams.set("access_type", "offline");
        url.searchParams.set("prompt", "consent");
        return url.toString();
    },
    async exchangeCode({code, redirectUri, codeVerifier}) {
        const res = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                code,
                grant_type: "authorization_code",
                redirect_uri: redirectUri,
                code_verifier: codeVerifier
            }),
        });

        if (!res.ok) throw new Error(`Google token exchange failed: ${res.status} ${await res.text()}`);
        return await res.json();
    },

    async getUserInfo({ accessToken }) {
        const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
            headers: { authorization: `Bearer ${accessToken}` },
        });

        if (!res.ok) throw new Error(`Google userinfo failed: ${res.status} ${await res.text()}`);
        const data = (await res.json()) as { sub: string; email?: string; name?: string; picture?: string };
        if (!data.sub) throw new Error("Google userinfo missing sub!");

        return {
            subject: data.sub,
            email: data.email as string,
            name: data.name as string,
            picture: data.picture as string,
        };
    },

    async refreshToken({ refreshToken }) {
        const res = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                grant_type: "refresh_token",
                refresh_token: refreshToken,
            }),
        });

        if (!res.ok) throw new Error(`Google refresh failed: ${res.status} ${await res.text()}`);
        return await res.json();
    },

    async revoke({ token }) {
        const res = await fetch("https://oauth2.googleapis.com/revoke", {
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ token }),
        });

        if (!res.ok) throw new Error(`Google revoke failed: ${res.status} ${await res.text()}`);
    },
};