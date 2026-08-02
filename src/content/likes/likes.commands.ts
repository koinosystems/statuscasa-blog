import { Hono } from "hono";
import { z } from "zod";

import type { BlogBindings } from "../../environment";
import { generateUUID } from "../../lib/utils";
import { authenticate } from "../../middleware/auth";

const toggleLikeSchema = z.object({
  contentId: z.string().uuid(),
});

export const likesCommands = new Hono<{
  Bindings: BlogBindings;
  Variables: { userId: string };
}>();

likesCommands.post("/toggle", authenticate, async (c) => {
  const userId = c.get("userId");

  const body = await c.req.json();
  const parsed = toggleLikeSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      400,
    );
  }

  const existing = await c.env.BLOG_DB.prepare(
    "SELECT id FROM sc_content_likes WHERE content_id = ? AND user_id = ?",
  )
    .bind(parsed.data.contentId, userId)
    .first();

  if (existing) {
    await c.env.BLOG_DB.prepare(
      "DELETE FROM sc_content_likes WHERE content_id = ? AND user_id = ?",
    )
      .bind(parsed.data.contentId, userId)
      .run();
    return c.json({ success: true, liked: false });
  }

  await c.env.BLOG_DB.prepare(
    "INSERT INTO sc_content_likes (id, content_id, user_id, created_at) VALUES (?, ?, ?, datetime('now'))",
  )
    .bind(generateUUID(), parsed.data.contentId, userId)
    .run();

  return c.json({ success: true, liked: true });
});
