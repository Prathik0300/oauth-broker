export type GoogleUserInfo = {
    sub: string;
    email?: string;
    name?: string;
    picture?: string;
};

export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
        headers: { authorization: `Bearer ${accessToken}` }
    });

    if (!res.ok) {
        throw new Error(`Google userinfo failed: ${res.status} ${await res.text()}`);
    }

    const data = (await res.json()) as GoogleUserInfo;
    if (!data?.sub) throw new Error("Google userinfo missing sub");
    return data;
}