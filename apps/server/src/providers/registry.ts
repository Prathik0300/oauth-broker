import type { OAuthProvider, ProviderName } from "./base";
import { googleProvider } from "./google";

export const providers: Record<ProviderName, OAuthProvider> = {
    google: googleProvider,
}

export function getProvider(name: string): OAuthProvider | null {
    return (providers as Record<string, OAuthProvider>)[name] ?? null;
}