import { Hono } from "hono";

import type { BlogBindings } from "../../environment";

export const likesQueries = new Hono<{ Bindings: BlogBindings }>();

likesQueries.get("/:contentId", async (c) => {
  const contentId = c.req.param("contentId");
  const userId = c.get("userId");

  const countResult = await c.env.BLOG_DB.prepare(
    "SELECT COUNT(*) as count FROM sc_content_likes WHERE content_id = ?",
  )
    .bind(contentId)
    .first<{ count: number }>();

  let liked = false;
  if (userId) {
    const existing = await c.env.BLOG_DB.prepare(
      "SELECT 1 FROM sc_content_likes WHERE content_id = ? AND user_id = ?",
    )
      .bind(contentId, userId)
      .first();
    liked = !!existing;
  }

  return c.json({
    success: true,
    count: countResult?.count || 0,
    liked,
  });
});
