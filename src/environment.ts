import type { D1Database, KVNamespace } from "@cloudflare/workers-types";

import type { BaseBindings } from "./types/bindings";

export interface BlogBindings extends BaseBindings {
  BLOG_DB: D1Database;
  BLOG_KV: KVNamespace;
  JWT_SECRET: string;
  SERVICE_TOKEN_SECRET: string;
}
