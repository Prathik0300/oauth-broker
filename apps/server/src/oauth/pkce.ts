import { createHash, randomBytes } from "crypto";

export function base64Url(buf: Buffer) {
    return buf.toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function createVerifier(): string {
    return base64Url(randomBytes(32));
}

export function createChallenge(verifier: string): string {
    return base64Url(createHash("sha256").update(verifier).digest());
}