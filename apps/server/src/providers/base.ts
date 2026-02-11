export type ProviderName = "google";

export type OAuthUserInfo = {
    subject: string;
    email?: string;
    name?: string;
    picture?: string;
}

export type TokenSet = {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    token_type?: string;
}

export type OAuthProvider = {
    name: ProviderName;
    getDefaultScopes(): string[];
    authorizeUrl(params: {
      redirectUri: string;
      state: string;
      codeChallenge: string;
      scopes: string[];
    }): string;
    exchangeCode(params: {
      code: string;
      redirectUri: string;
      codeVerifier: string;
    }): Promise<TokenSet>;
    refreshToken?(params: { refreshToken: string }): Promise<TokenSet>;
    getUserInfo(params: { accessToken: string }): Promise<OAuthUserInfo>;  
    revoke?(params: { token: string }): Promise<void>;
  };
