import { Hono } from "hono";
import { z } from "zod";

import type { BlogBindings } from "../../environment";
import { generateUUID } from "../../lib/utils";

const registerShareSchema = z.object({
  contentId: z.string().uuid(),
  platform: z.enum([
    "whatsapp",
    "facebook",
    "twitter",
    "linkedin",
    "email",
    "copy",
  ]),
});

export const shareCommands = new Hono<{ Bindings: BlogBindings }>();

shareCommands.post("/register", async (c) => {
  const body = await c.req.json();
  const parsed = registerShareSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      400,
    );
  }

  const existing = await c.env.BLOG_DB.prepare(
    "SELECT id, count FROM sc_content_share_counts WHERE content_id = ? AND platform = ?",
  )
    .bind(parsed.data.contentId, parsed.data.platform)
    .first<{ id: string; count: number }>();

  if (existing) {
    await c.env.BLOG_DB.prepare(
      "UPDATE sc_content_share_counts SET count = count + 1, updated_at = datetime('now') WHERE id = ?",
    )
      .bind(existing.id)
      .run();
  } else {
    await c.env.BLOG_DB.prepare(
      "INSERT INTO sc_content_share_counts (id, content_id, platform, count, created_at, updated_at) VALUES (?, ?, ?, 1, datetime('now'), datetime('now'))",
    )
      .bind(generateUUID(), parsed.data.contentId, parsed.data.platform)
      .run();
  }

  return c.json({ success: true });
});
