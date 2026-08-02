export interface JwtPayload {
  sub: string;
  exp?: number;
  [key: string]: unknown;
}

function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );
  return atob(padded);
}

/**
 * Verifica um JWT HS256 com a chave secreta e retorna o payload
 * caso a assinatura seja válida e o token não tenha expirado.
 */
export async function verifyJwt(
  token: string,
  secret: string,
): Promise<JwtPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  let header: { alg?: string };
  try {
    header = JSON.parse(base64UrlDecode(headerB64)) as { alg?: string };
  } catch {
    return null;
  }

  if (header.alg !== "HS256") {
    return null;
  }

  let payload: JwtPayload;
  try {
    payload = JSON.parse(base64UrlDecode(payloadB64)) as JwtPayload;
  } catch {
    return null;
  }

  if (typeof payload.exp === "number" && payload.exp * 1000 < Date.now()) {
    return null;
  }

  if (typeof payload.sub !== "string" || payload.sub.length === 0) {
    return null;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);

  let signature: Uint8Array;
  try {
    const sigB64 = base64UrlDecode(signatureB64);
    signature = new Uint8Array(sigB64.length);
    for (let i = 0; i < sigB64.length; i++) {
      signature[i] = sigB64.charCodeAt(i);
    }
  } catch {
    return null;
  }

  const valid = await crypto.subtle.verify("HMAC", key, signature, data);
  return valid ? payload : null;
}
