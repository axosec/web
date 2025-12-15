export interface RegisterRequest {
  email: string;
  username: string;
  salt: string;
  auth_verifier: string;
  public_key: string;
  enc_private_key: string;
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
  id: string
  email: string;
  username: string;
  salt: string;
  auth_verifier: string;
  public_key: string;
  enc_private_key: string;
}

export class Api {
  private static instance: Api;
  private baseUrl: string;

  private constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  static getInstance(baseUrl: string): Api {
    if (!Api.instance) {
      Api.instance = new Api(baseUrl);
    }
    return Api.instance;
  }

  async register(data: RegisterRequest) {
    const response = await fetch(`${this.baseUrl}/v1/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Registration failed");
    }

    return await response.json();
  }

  async loginInit(data: InitLoginRequest): Promise<InitLoginResponse> {
    const response = await fetch(`${this.baseUrl}/v1/auth/login/init`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Login initialization failed");
    }

    return await response.json();
  }

  async login(data: LoginRequest): Promise<User> {
    const response = await fetch(`${this.baseUrl}/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Login failed");
    }

    return await response.json();
  }

  async getSelf(): Promise<User> {
    const response = await fetch(`${this.baseUrl}/v1/user/self`, {
      method: "GET",
      credentials: "include"
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Could not get self");
    }

    return await response.json();
  }

  async logout() {
    const response = await fetch(`${this.baseUrl}/v1/user/logout`, {
      method: "POST",
      credentials: "include"
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Could not logout");
    }

    return await response.json();
  }
}
