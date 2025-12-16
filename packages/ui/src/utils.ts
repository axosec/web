export function toBase64(bytes: Uint8Array): string {
  const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binString);
}

export function fromBase64(base64: string): Uint8Array {
  const binString = atob(base64);

  const bytes = new Uint8Array(binString.length);

  for (let i = 0; i < binString.length; i++) {
    bytes[i] = binString.charCodeAt(i);
  }

  return bytes;
}

export async function sha512(data: Uint8Array): Promise<Uint8Array> {
  const hashBuffer = await window.crypto.subtle.digest("SHA-512", data as unknown as BufferSource);
  return new Uint8Array(hashBuffer);
}
