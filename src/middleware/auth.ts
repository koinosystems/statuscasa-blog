import type { Context, MiddlewareHandler } from "hono";

import type { BlogBindings } from "../environment";
import { verifyJwt } from "../lib/jwt";

type BlogContext = Context<{
  Bindings: BlogBindings;
  Variables: { userId: string };
}>;

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-service-token, x-request-id",
  "Access-Control-Max-Age": "86400",
};

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-XSS-Protection": "0",
};

export const corsAndSecurity: MiddlewareHandler = async (c, next) => {
  if (c.req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  await next();
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    c.header(key, value);
  }
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    c.header(key, value);
  }
};

export const createRequestId: MiddlewareHandler = async (c, next) => {
  const requestId = c.req.header("x-request-id") ?? generateRequestId();
  c.set("requestId", requestId);
  c.header("x-request-id", requestId);
  await next();
};

function generateRequestId(): string {
  return crypto.randomUUID();
}

/**
 * Autenticação para rotas de escrita: aceita Bearer JWT (HS256,
 * assinado com JWT_SECRET) ou x-service-token igual a SERVICE_TOKEN_SECRET.
 * Define c.get("userId") para o autor.
 */
export const authenticate: MiddlewareHandler = async (c: BlogContext, next) => {
  const authHeader = c.req.header("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const payload = await verifyJwt(authHeader.slice(7), c.env.JWT_SECRET);
    if (payload) {
      c.set("userId", payload.sub);
      return next();
    }
    return c.json({ error: "Invalid token" }, 401);
  }

  const serviceToken = c.req.header("x-service-token");
  if (serviceToken && serviceToken === c.env.SERVICE_TOKEN_SECRET) {
    c.set("userId", "service");
    return next();
  }

  return c.json({ error: "Unauthorized" }, 401);
};
