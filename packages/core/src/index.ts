import './wasm_exec.js';

// Raw Go Functions
declare global {
  var Go: any;
  function AxoHashCreate(pass: string): string | { error: string };
  function AxoHashVerify(pass: string, hash: string): boolean | { error: string };
  function AxoHashDeriveKey(pass: string, salt: Uint8Array): Uint8Array | { error: string };

  function AxoVaultEncrypt(data: Uint8Array, key: Uint8Array): Uint8Array | { error: string };
  function AxoVaultDecrypt(data: Uint8Array, key: Uint8Array): Uint8Array | { error: string };

  function AxoBoxGenerateKey(): { public: Uint8Array, private: Uint8Array } | { error: string };
  function AxoBoxSeal(data: Uint8Array, pubKey: Uint8Array): Uint8Array | { error: string };
  function AxoBoxUnseal(data: Uint8Array, privKey: Uint8Array): Uint8Array | { error: string };
  function AxoBoxWrapKey(key: Uint8Array, pubKey: Uint8Array): Uint8Array | { error: string };
  function AxoBoxUnwrapKey(blob: Uint8Array, privKey: Uint8Array): Uint8Array | { error: string };

  function AxoUtilGenerateSalt(length: number): Uint8Array | { error: string };
}

// Helper to handle Go Errors
// Go returns { error: "msg" } on failure -> js error.
function unwrap<T>(result: T | { error: string }): T {
  if (result && typeof result === 'object' && 'error' in result) {
    throw new Error((result as { error: string }).error);
  }
  return result as T;
}

export class Axosec {
  private static instance: Axosec;
  private loaded: Promise<void>;

  private constructor(wasmUrl: string) {
    this.loaded = this.init(wasmUrl);
  }

  private async init(wasmUrl: string) {
    if (typeof window === 'undefined') return;
    const go = new window.Go();
    const result = await WebAssembly.instantiateStreaming(fetch(wasmUrl), go.importObject);
    go.run(result.instance);
  }

  public static getInstance(wasmUrl: string = '/axosec.wasm'): Axosec {
    if (!Axosec.instance) Axosec.instance = new Axosec(wasmUrl);
    return Axosec.instance;
  }

  // --- HASH ---
  async hashPassword(password: string): Promise<string> {
    await this.loaded;
    return unwrap(window.AxoHashCreate(password));
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    await this.loaded;
    return unwrap(window.AxoHashVerify(password, hash));
  }

  async deriveKey(password: string, salt: Uint8Array): Promise<Uint8Array> {
    await this.loaded;
    return unwrap(window.AxoHashDeriveKey(password, salt));
  }

  // --- VAULT (Symmetric) ---
  async encrypt(data: Uint8Array, key: Uint8Array): Promise<Uint8Array> {
    await this.loaded;
    return unwrap(window.AxoVaultEncrypt(data, key));
  }

  async decrypt(data: Uint8Array, key: Uint8Array): Promise<Uint8Array> {
    await this.loaded;
    return unwrap(window.AxoVaultDecrypt(data, key));
  }

  // --- BOX (Asymmetric) ---
  async generateIdentity() {
    await this.loaded;
    return unwrap(window.AxoBoxGenerateKey());
  }

  async seal(data: Uint8Array, peerPub: Uint8Array): Promise<Uint8Array> {
    await this.loaded;
    return unwrap(window.AxoBoxSeal(data, peerPub));
  }

  async unseal(data: Uint8Array, myPriv: Uint8Array): Promise<Uint8Array> {
    await this.loaded;
    return unwrap(window.AxoBoxUnseal(data, myPriv));
  }

  async wrapKey(keyToShare: Uint8Array, peerPub: Uint8Array): Promise<Uint8Array> {
    await this.loaded;
    return unwrap(window.AxoBoxWrapKey(keyToShare, peerPub));
  }

  async unwrapKey(blob: Uint8Array, myPriv: Uint8Array): Promise<Uint8Array> {
    await this.loaded;
    return unwrap(window.AxoBoxUnwrapKey(blob, myPriv));
  }

  async generateSalt(length: number = 16): Promise<Uint8Array> {
    await this.loaded;
    return unwrap(window.AxoUtilGenerateSalt(length));
  }
}
