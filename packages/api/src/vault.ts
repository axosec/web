export type ResourceType = 'folder' | 'item';

export interface CreateFolderRequest {
  nonce: string;
  enc_metadata: string;
  key_nonce: string;
  enc_key: string;
}

export interface UpdateFolderRequest {
  nonce: string;
  enc_metadata: string;
}

export interface FolderResponse {
  id: string;
}

export interface FolderSummary {
  id: string;
  enc_metadata: string;
  nonce: string;
  wrapped_key: string;
  key_nonce: string;
}

export interface CreateItemRequest {
  folder_id: string | null;
  type: string;

  // Data Blob
  data_nonce: string;
  enc_data: string;
  enc_overview: string;

  // Encryption Key
  key_nonce: string;
  enc_key: string;
}

export interface ItemResponse {
  id: string;
  created_at: string;
}

export interface ItemSummary {
  id: string;
  type: string;
  enc_overview: string;
  wrapped_key: string;
  key_nonce: string;
  updated_at: string;
}

export interface ItemDetail {
  id: string;
  folder_id?: string;
  type: string;

  // Full Data
  enc_data: string;
  data_nonce: string;

  // Key data
  wrapped_key: string;
  key_nonce: string;

  updated_at: string;
}

export interface UpdateItemRequest {
  nonce: string;
  enc_data: string;
  enc_overview: string;
}

export interface ShareRequest {
  resource_id: string;
  resource_type: ResourceType;
  target_user_id: string;

  // Key for Target User
  enc_key: string;
  key_nonce: string;
  access_level: string;
}

export interface RevokeRequest {
  resource_id: string;
  target_user_id: string;
}

export class VaultApi {
  private static instance: VaultApi;
  private baseUrl: string;

  private constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  static getInstance(baseUrl: string): VaultApi {
    if (!VaultApi.instance) {
      VaultApi.instance = new VaultApi(baseUrl);
    }
    return VaultApi.instance;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}/v1${endpoint}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
      credentials: "include",
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Request to ${endpoint} failed`);
    }

    if (response.status === 204) {
      return {} as T;
    }

    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    try {
      return JSON.parse(text);
    } catch {
      return {} as T;
    }
  }

  // Folder Operations

  async createFolder(data: CreateFolderRequest): Promise<FolderResponse> {
    return this.request<FolderResponse>("/folders", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async listFolders(): Promise<FolderSummary[]> {
    return this.request<FolderSummary[]>("/folders", {
      method: "GET",
    });
  }

  async updateFolder(id: string, data: UpdateFolderRequest): Promise<void> {
    return this.request<void>(`/folders/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Item Operations

  async createItem(data: CreateItemRequest): Promise<ItemResponse> {
    return this.request<ItemResponse>("/items", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async listItems(folderId?: string): Promise<ItemSummary[]> {
    const query = folderId ? `?folder_id=${folderId}` : "";
    return this.request<ItemSummary[]>(`/items${query}`, {
      method: "GET",
    });
  }

  async getItem(id: string): Promise<ItemDetail> {
    return this.request<ItemDetail>(`/items/${id}`, {
      method: "GET",
    });
  }

  async updateItem(id: string, data: UpdateItemRequest): Promise<void> {
    return this.request<void>(`/items/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Management

  async deleteResource(id: string, type: ResourceType): Promise<void> {
    return this.request<void>(`/resources/${type}/${id}`, {
      method: "DELETE",
    });
  }

  async shareResource(data: ShareRequest): Promise<void> {
    return this.request<void>("/share", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async revokeAccess(data: RevokeRequest): Promise<void> {
    return this.request<void>("/share/revoke", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}