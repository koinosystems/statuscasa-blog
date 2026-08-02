import { Hono } from "hono";
import { z } from "zod";

import type { BlogBindings } from "../../environment";
import { generateUUID } from "../../lib/utils";
import { authenticate } from "../../middleware/auth";

const createCommentSchema = z.object({
  contentId: z.string().uuid(),
  body: z.string().min(1).max(2000),
  parentId: z.string().uuid().optional(),
});

export const commentsCommands = new Hono<{
  Bindings: BlogBindings;
  Variables: { userId: string };
}>();

commentsCommands.post("/", authenticate, async (c) => {
  const userId = c.get("userId");

  const body = await c.req.json();
  const parsed = createCommentSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      400,
    );
  }

  const id = generateUUID();
  await c.env.BLOG_DB.prepare(
    `INSERT INTO sc_content_comments (id, content_id, user_id, body, parent_id, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'approved', datetime('now'), datetime('now'))`,
  )
    .bind(
      id,
      parsed.data.contentId,
      userId,
      parsed.data.body,
      parsed.data.parentId || null,
    )
    .run();

  return c.json({ success: true, id }, 201);
});

commentsCommands.delete("/:id", authenticate, async (c) => {
  const userId = c.get("userId");
  const commentId = c.req.param("id");

  const comment = await c.env.BLOG_DB.prepare(
    "SELECT user_id FROM sc_content_comments WHERE id = ?",
  )
    .bind(commentId)
    .first<{ user_id: string }>();
  if (!comment || comment.user_id !== userId) {
    return c.json({ error: "Not found" }, 404);
  }

  await c.env.BLOG_DB.prepare("DELETE FROM sc_content_comments WHERE id = ?")
    .bind(commentId)
    .run();

  return c.json({ success: true });
});
