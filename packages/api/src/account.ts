import { Api } from "./api";

export interface RegisterRequest {
  email: string;
  username: string;

  salt: string;
  auth_verifier: string;

  identity_public_key: string;
  enc_identity_private_key: string;
  identity_private_key_nonce: string;

  vault_public_key: string;
  enc_vault_private_key: string;
  vault_private_key_nonce: string;
}

export interface InitLoginRequest {
  email: string;
}

export interface InitLoginResponse {
  salt: string;
}

export interface LoginRequest {
  email: string;
  auth_verifier: string;
}

export interface User {
  id: string;
  email: string;
  email_hash: string;
  username: string;

  salt: string;
  auth_verifier: string;

  identity_public_key: string;
  enc_identity_private_key: string;
  identity_private_key_nonce: string;

  vault_public_key: string;
  enc_vault_private_key: string;
  vault_private_key_nonce: string;
}

export interface LookupUserRequest {
  email_hash: string;
}

export interface LookupUsersRequest {
  ids: string[];
}

export interface LookupUserResponse {
  id: string;
  username: string;
  identity_public_key: string;
  vault_public_key: string;
}

export class AccountApi extends Api {
  private static instance: AccountApi;

  private constructor(baseUrl: string) {
    super(baseUrl);
  }

  static getInstance(baseUrl: string): AccountApi {
    if (!AccountApi.instance) {
      AccountApi.instance = new AccountApi(baseUrl);
    }
    return AccountApi.instance;
  }

  async register(data: RegisterRequest) {
    return this.request<User>(`/auth/register`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async loginInit(data: InitLoginRequest): Promise<InitLoginResponse> {
    return this.request<InitLoginResponse>(`/auth/login/init`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginRequest): Promise<User> {
    return this.request<User>(`/auth/login`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getSelf(): Promise<User> {
    return this.request<User>(`/user/self`, {
      method: "GET",
    });
  }

  async logout() {
    return this.request<User>(`/user/logout`, {
      method: "POST",
    });
  }

  async lookupUser(data: LookupUserRequest): Promise<LookupUserResponse> {
    return this.request<LookupUserResponse>(`/user/lookup`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async lookupUsers(data: LookupUsersRequest): Promise<LookupUserResponse[]> {
    return this.request<LookupUserResponse[]>(`/users/lookup`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}
