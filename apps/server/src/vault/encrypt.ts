import { createSecretKey } from "crypto";
import { CompactEncrypt, compactDecrypt } from "jose";

function getKey() {
    const raw = process.env.TOKEN_ENC_KEY;
    if (!raw) {
        throw new Error("TOKEN_ENC_KEY is not set");
    }

    const buf = Buffer.from(raw, "base64");
    if (buf.length !== 32) {
        throw new Error("TOKEN_ENC_KEY must be 32 bytes");
    }

    return createSecretKey(buf);
}

export async function encryptToken(plain: string): Promise<string> {
    const key = getKey();
    return await new CompactEncrypt(Buffer.from(plain))
        .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
        .encrypt(key);
}

export async function decryptToken(cipher: string): Promise<string> {
    const key = getKey();
    const { plaintext } = await compactDecrypt(cipher, key);
    return Buffer.from(plaintext).toString("utf-8");
}
