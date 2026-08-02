import { Hono } from "hono";

import type { BlogBindings } from "../../environment";

export const commentsQueries = new Hono<{ Bindings: BlogBindings }>();

commentsQueries.get("/:contentId", async (c) => {
  const contentId = c.req.param("contentId");
  const page = parseInt(c.req.query("page") || "1", 10);
  const limit = parseInt(c.req.query("limit") || "20", 10);
  const offset = (page - 1) * limit;

  const comments = await c.env.BLOG_DB.prepare(
    `SELECT * FROM sc_content_comments
     WHERE content_id = ? AND status = 'approved'
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
  )
    .bind(contentId, limit, offset)
    .all();

  const total = await c.env.BLOG_DB.prepare(
    "SELECT COUNT(*) as count FROM sc_content_comments WHERE content_id = ? AND status = 'approved'",
  )
    .bind(contentId)
    .first<{ count: number }>();

  return c.json({
    success: true,
    data: comments.results,
    total: total?.count || 0,
    page,
    limit,
  });
});

commentsQueries.get("/:contentId/count", async (c) => {
  const contentId = c.req.param("contentId");

  const result = await c.env.BLOG_DB.prepare(
    "SELECT COUNT(*) as count FROM sc_content_comments WHERE content_id = ? AND status = 'approved'",
  )
    .bind(contentId)
    .first<{ count: number }>();

  return c.json({ success: true, count: result?.count || 0 });
});
