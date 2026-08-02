import { Hono } from "hono";

import type { BlogBindings } from "../environment";

export const contentQueries = new Hono<{ Bindings: BlogBindings }>();

contentQueries.get("/published", async (c) => {
  const page = parseInt(c.req.query("page") || "1", 10);
  const limit = parseInt(c.req.query("limit") || "20", 10);
  const offset = (page - 1) * limit;

  const contents = await c.env.BLOG_DB.prepare(
    `SELECT c.*, GROUP_CONCAT(t.tag) as tags
     FROM sc_content c
     LEFT JOIN sc_content_tags t ON c.id = t.content_id
     WHERE c.status = 'published'
     GROUP BY c.id
     ORDER BY c.published_at DESC
     LIMIT ? OFFSET ?`,
  )
    .bind(limit, offset)
    .all();

  const total = await c.env.BLOG_DB.prepare(
    "SELECT COUNT(*) as count FROM sc_content WHERE status = 'published'",
  ).first<{ count: number }>();

  return c.json({
    success: true,
    data: contents.results.map((row) => ({
      ...row,
      tags: row.tags ? row.tags.split(",") : [],
    })),
    total: total?.count || 0,
    page,
    limit,
  });
});

contentQueries.get("/:slug", async (c) => {
  const slug = c.req.param("slug");

  const content = await c.env.BLOG_DB.prepare(
    `SELECT c.*, GROUP_CONCAT(t.tag) as tags
     FROM sc_content c
     LEFT JOIN sc_content_tags t ON c.id = t.content_id
     WHERE c.slug = ? AND c.status = 'published'
     GROUP BY c.id`,
  )
    .bind(slug)
    .first();

  if (!content) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.json({
    success: true,
    data: {
      ...content,
      tags: content.tags ? content.tags.split(",") : [],
    },
  });
});
