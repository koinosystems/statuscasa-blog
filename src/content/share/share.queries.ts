import { Hono } from "hono";

import type { BlogBindings } from "../../environment";

export const shareQueries = new Hono<{ Bindings: BlogBindings }>();

shareQueries.get("/:contentId", async (c) => {
  const contentId = c.req.param("contentId");

  const shares = await c.env.BLOG_DB.prepare(
    "SELECT platform, count FROM sc_content_share_counts WHERE content_id = ?",
  )
    .bind(contentId)
    .all();

  const total = shares.results.reduce(
    (sum, share) => sum + (share.count || 0),
    0,
  );

  return c.json({
    success: true,
    total,
    byPlatform: shares.results.reduce(
      (acc, share) => {
        acc[share.platform] = share.count || 0;
        return acc;
      },
      {} as Record<string, number>,
    ),
  });
});
