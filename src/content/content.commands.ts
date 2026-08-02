import { Hono } from "hono";
import { z } from "zod";

import type { BlogBindings } from "../environment";
import { generateUUID, slugify } from "../lib/utils";
import { authenticate } from "../middleware/auth";

const createContentSchema = z.object({
  title: z.string().min(3),
  content: z.string().optional(),
  summary: z.string().max(500).optional(),
  type: z.enum(["blog", "guide", "list"]).default("blog"),
  coverImg: z.string().url().optional(),
  coverAlt: z.string().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

const updateContentSchema = z.object({
  title: z.string().min(3).optional(),
  content: z.string().optional(),
  summary: z.string().max(500).optional(),
  coverImg: z.string().url().optional(),
  coverAlt: z.string().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

export const contentCommands = new Hono<{
  Bindings: BlogBindings;
  Variables: { userId: string };
}>();

contentCommands.post("/", authenticate, async (c) => {
  const userId = c.get("userId");

  const body = await c.req.json();
  const parsed = createContentSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      400,
    );
  }

  const id = generateUUID();
  let slug = slugify(parsed.data.title);

  const existing = await c.env.BLOG_DB.prepare(
    "SELECT id FROM sc_content WHERE slug = ?",
  )
    .bind(slug)
    .first();
  if (existing) {
    slug = `${slug}-${Date.now()}`;
  }

  await c.env.BLOG_DB.prepare(
    `INSERT INTO sc_content (id, author_id, title, content, slug, summary, type, cover_img, cover_alt, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', datetime('now'), datetime('now'))`,
  )
    .bind(
      id,
      userId,
      parsed.data.title,
      parsed.data.content || "",
      slug,
      parsed.data.summary || null,
      parsed.data.type,
      parsed.data.coverImg || null,
      parsed.data.coverAlt || null,
    )
    .run();

  if (parsed.data.tags && parsed.data.tags.length > 0) {
    const tagStatements = parsed.data.tags.map((tag) =>
      c.env.BLOG_DB.prepare(
        "INSERT INTO sc_content_tags (id, content_id, tag) VALUES (?, ?, ?)",
      ).bind(generateUUID(), id, tag),
    );
    await c.env.BLOG_DB.batch(tagStatements);
  }

  return c.json({ success: true, id, slug }, 201);
});

contentCommands.put("/:id/publish", authenticate, async (c) => {
  const userId = c.get("userId");
  const contentId = c.req.param("id");

  const content = await c.env.BLOG_DB.prepare(
    "SELECT author_id FROM sc_content WHERE id = ?",
  )
    .bind(contentId)
    .first<{ author_id: string }>();
  if (!content || content.author_id !== userId) {
    return c.json({ error: "Not found" }, 404);
  }

  await c.env.BLOG_DB.prepare(
    "UPDATE sc_content SET status = 'published', published_at = datetime('now'), updated_at = datetime('now') WHERE id = ?",
  )
    .bind(contentId)
    .run();

  return c.json({ success: true });
});

contentCommands.patch("/:id", authenticate, async (c) => {
  const userId = c.get("userId");
  const contentId = c.req.param("id");

  const body = await c.req.json();
  const parsed = updateContentSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      400,
    );
  }

  const content = await c.env.BLOG_DB.prepare(
    "SELECT author_id FROM sc_content WHERE id = ?",
  )
    .bind(contentId)
    .first<{ author_id: string }>();
  if (!content || content.author_id !== userId) {
    return c.json({ error: "Not found" }, 404);
  }

  const updates: string[] = [];
  const values: unknown[] = [];

  if (parsed.data.title) {
    updates.push("title = ?");
    values.push(parsed.data.title);
  }
  if (parsed.data.content !== undefined) {
    updates.push("content = ?");
    values.push(parsed.data.content);
  }
  if (parsed.data.summary !== undefined) {
    updates.push("summary = ?");
    values.push(parsed.data.summary);
  }
  if (parsed.data.coverImg !== undefined) {
    updates.push("cover_img = ?");
    values.push(parsed.data.coverImg);
  }
  if (parsed.data.coverAlt !== undefined) {
    updates.push("cover_alt = ?");
    values.push(parsed.data.coverAlt);
  }

  if (updates.length > 0) {
    updates.push("updated_at = datetime('now')");
    values.push(contentId);
    await c.env.BLOG_DB.prepare(
      `UPDATE sc_content SET ${updates.join(", ")} WHERE id = ?`,
    )
      .bind(...values)
      .run();
  }

  if (parsed.data.tags) {
    await c.env.BLOG_DB.prepare(
      "DELETE FROM sc_content_tags WHERE content_id = ?",
    )
      .bind(contentId)
      .run();

    if (parsed.data.tags.length > 0) {
      const tagStatements = parsed.data.tags.map((tag) =>
        c.env.BLOG_DB.prepare(
          "INSERT INTO sc_content_tags (id, content_id, tag) VALUES (?, ?, ?)",
        ).bind(generateUUID(), contentId, tag),
      );
      await c.env.BLOG_DB.batch(tagStatements);
    }
  }

  return c.json({ success: true });
});

contentCommands.delete("/:id", authenticate, async (c) => {
  const userId = c.get("userId");
  const contentId = c.req.param("id");

  const content = await c.env.BLOG_DB.prepare(
    "SELECT author_id FROM sc_content WHERE id = ?",
  )
    .bind(contentId)
    .first<{ author_id: string }>();
  if (!content || content.author_id !== userId) {
    return c.json({ error: "Not found" }, 404);
  }

  await c.env.BLOG_DB.prepare("DELETE FROM sc_content WHERE id = ?")
    .bind(contentId)
    .run();

  return c.json({ success: true });
});
